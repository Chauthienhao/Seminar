from datetime import date, datetime
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from api.dependencies import get_current_user
from core.database import Base, get_db
from core.exceptions import ConflictError
from domain.entities import Artifact, ArtifactTranslation, PlayLog, Room
from domain.schemas import PlayLogCreate
from main import app
from services.analytics_service import AnalyticsService
from services.audio_service import AudioService


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all([Room(id="r1", code="101", name_vi="Phòng một", name_en="Room one"),
                         Room(id="r2", code="102", name_vi="Phòng hai", name_en="Room two"),
                         Room(id="r0", code="999", name_vi="Phòng trống", name_en="Empty")])
        session.flush()
        session.add_all([Artifact(id="a", qr_code="A", room_id="r1"),
                         Artifact(id="b", qr_code="B", room_id="r2"),
                         Artifact(id="c", qr_code="C", room_id=None)])
        session.flush()
        # Duplicate legacy translations must not multiply log counts.
        session.add_all([ArtifactTranslation(id="ta", artifact_id="a", language_code="vi", title="A vi"),
                         ArtifactTranslation(id="ta2", artifact_id="a", language_code="vi", title="A vi duplicate"),
                         ArtifactTranslation(id="tb", artifact_id="b", language_code="en", title="B en")])
        session.commit()
        yield session
    engine.dispose()


def add(db, artifact, session, when, duration=None, lang="vi", id_=None):
    row = PlayLog(id=id_ or str(uuid4()), artifact_id=artifact, session_id=session,
                  trigger_method="MANUAL", language_played=lang,
                  listen_duration=duration, played_at=datetime.fromisoformat(when))
    db.add(row)
    db.commit()
    return row


def test_snapshot_retries_do_not_inflate_counts_or_reduce_duration(db):
    id_ = uuid4()
    service = AudioService(db)
    payload = dict(id=id_, artifact_id="a", session_id="anonymous", trigger_method="MANUAL", language_played="en")
    first = service.log_play(PlayLogCreate(**payload))
    for seconds in (12, 25, 12, None, 25):
        result = service.log_play(PlayLogCreate(**payload, listen_duration=seconds))
    assert db.query(PlayLog).count() == 1
    assert result.listen_duration == 25
    assert result.played_at == first.played_at
    assert result.language_played == "en"
    with pytest.raises(ConflictError):
        service.log_play(PlayLogCreate(**{**payload, "session_id": "different"}, listen_duration=30))


def test_analytics_counts_nulls_boundaries_languages_and_room_zeros(db):
    add(db, "a", "s1", "2026-10-25T00:00:00", 20)
    add(db, "a", "s1", "2026-10-25T00:00:01", None, "en")
    add(db, "b", "s1", "2026-10-25T00:01:00", 40, "en")
    add(db, "c", "s2", "2026-10-26T23:59:59", 0)
    add(db, None, "s3", "2026-10-26T12:00:00", None)
    add(db, "a", "outside", "2026-10-27T00:00:00", 500)
    result = AnalyticsService(db).dashboard(date(2026, 10, 25), date(2026, 10, 26))
    assert result["total_plays"] == 5
    assert result["measured_plays"] == 3
    assert result["average_listen_seconds"] == 20
    assert result["unassigned_plays"] == 2
    a = next(row for row in result["pois"] if row["artifact_id"] == "a")
    assert (a["play_count"], a["measured_plays"], a["average_listen_seconds"]) == (2, 1, 20)
    assert next(row for row in result["pois"] if row["artifact_id"] == "b")["title"] == "B en"
    assert {r["language"]: r["play_count"] for r in result["languages"]} == {"vi": 3, "en": 2}
    assert sum(r["play_count"] for r in result["daily"]) == 5
    assert {r["code"]: r["play_count"] for r in result["rooms"]} == {"101": 2, "102": 1, "999": 0}


def test_routes_order_collapse_repeats_split_inactivity_deleted_and_hide_ids(db):
    for s in ("private-one", "private-two"):
        # Insertion order is deliberately different from playback order.
        add(db, "b", s, "2026-10-25T09:02:00")
        add(db, "a", s, "2026-10-25T09:00:00")
        add(db, "a", s, "2026-10-25T09:01:00")
    add(db, "c", "private-one", "2026-10-25T10:00:00")  # new journey, one POI excluded
    add(db, "a", "with-gap", "2026-10-25T09:00:00")
    add(db, None, "with-gap", "2026-10-25T09:01:00")
    add(db, "b", "with-gap", "2026-10-25T09:02:00")
    result = AnalyticsService(db).dashboard(date(2026, 10, 25), date(2026, 10, 25))
    assert len(result["popular_routes"]) == 1
    route = result["popular_routes"][0]
    assert [stop["artifact_id"] for stop in route["stops"]] == ["a", "b"]
    assert route["journey_count"] == 2
    assert "private-one" not in str(result)
    assert "session_id" not in str(result)


def test_empty_and_legacy_missing_durations(db):
    result = AnalyticsService(db).dashboard(date(2026, 10, 25), date(2026, 10, 25))
    assert result["total_plays"] == 0
    assert result["average_listen_seconds"] is None
    assert result["popular_routes"] == []
    add(db, "a", "s", "2026-10-25T09:00:00")
    result = AnalyticsService(db).dashboard(date(2026, 10, 25), date(2026, 10, 25))
    assert result["pois"][0]["average_listen_seconds"] is None


def test_http_auth_window_validation_and_anonymous_snapshots(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            assert client.get("/api/admin/stats/dashboard").status_code == 401
            app.dependency_overrides[get_current_user] = lambda: object()
            for qs in ("start_date=2026-10-26&end_date=2026-10-25", "start_date=2024-01-01&end_date=2026-01-01", "lang=bad", "start_date=bad"):
                assert client.get("/api/admin/stats/dashboard?" + qs).status_code == 422
            response = client.get("/api/admin/stats/dashboard?start_date=2026-10-25&end_date=2026-10-26")
            assert response.status_code == 200
            assert response.json()["total_plays"] == 0
            body = dict(id=str(uuid4()), artifact_id="a", session_id="anon", trigger_method="MANUAL", language_played="vi")
            assert client.post("/api/play-logs", json=body).status_code == 201
            assert client.post("/api/play-logs", json={**body, "listen_duration": 17}).json()["listen_duration"] == 17
            assert client.post("/api/play-logs", json={**body, "listen_duration": -1}).status_code == 422
            assert client.post("/api/play-logs", json={**body, "session_id": "other"}).status_code == 409
            assert client.post("/api/play-logs", json={**body, "id": str(uuid4()), "artifact_id": "missing"}).status_code == 404
            assert db.query(PlayLog).count() == 1
    finally:
        app.dependency_overrides.clear()
