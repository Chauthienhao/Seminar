"""Map API regression tests; isolated SQLite data, never the museum database."""
import math

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.routers.visitor import router
from core.database import Base, get_db
from domain.entities import Artifact, ArtifactTranslation, Room
from domain.schemas import ArtifactMapPoint
from repositories.artifact_repo import ArtifactRepository
from services.map_service import MapService


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine)() as session:
        session.add(Room(id="room-1", code="103", name_vi="Phòng khảo cổ", name_en="Archaeology Room"))
        session.commit()
        yield session
    engine.dispose()


def add_artifact(db, identifier="artifact-1", *, lat=10.776, lng=106.7, room_id="room-1", translations=None):
    artifact = Artifact(
        id=identifier,
        qr_code=f"HV-{identifier}",
        room_id=room_id,
        lat=lat,
        lng=lng,
        image_url=f"/images/{identifier}.jpg",
    )
    if translations is not None:
        artifact.translations = [
            ArtifactTranslation(id=f"{identifier}-{lang}", language_code=lang, title=title, transcript=text)
            for lang, title, text in translations
        ]
    db.add(artifact)
    db.commit()
    return artifact


def api_client(db):
    app = FastAPI()
    app.include_router(router, prefix="/api")

    def database_override():
        yield db

    app.dependency_overrides[get_db] = database_override
    return TestClient(app)


def test_api_returns_real_artifact_identity_popup_fields_and_language(db):
    add_artifact(db, translations=[
        ("vi", "Bình gốm cổ", "  Một   chiếc bình\n được trưng bày.  "),
        ("en", "Ancient ceramic vase", "A vase from the collection."),
    ])
    with api_client(db) as client:
        response = client.get("/api/map/artifacts?lang=vi")
        assert response.status_code == 200
        assert response.json() == [{
            "id": "artifact-1",
            "qr_code": "HV-artifact-1",
            "title": "Bình gốm cổ",
            "image_url": "/images/artifact-1.jpg",
            "room": {"id": "room-1", "code": "103", "name_vi": "Phòng khảo cổ", "name_en": "Archaeology Room"},
            "description": "Một chiếc bình được trưng bày.",
            "lat": 10.776,
            "lng": 106.7,
        }]
        english = client.get("/api/map/artifacts?lang=en").json()[0]
        assert english["title"] == "Ancient ceramic vase"
        assert english["description"] == "A vase from the collection."


def test_map_is_not_truncated_to_search_or_admin_page_sizes(db):
    for index in range(125):
        add_artifact(db, identifier=f"{index:03d}")
    with api_client(db) as client:
        points = client.get("/api/map/artifacts").json()
    assert len(points) == 125
    assert len({point["id"] for point in points}) == 125
    assert [point["qr_code"] for point in points] == sorted(point["qr_code"] for point in points)


@pytest.mark.parametrize("lat,lng", [(0, 0), (-90, -180), (90, 180), (0, 106.7), (10.7, 0)])
def test_zero_and_boundary_coordinates_are_valid(db, lat, lng):
    add_artifact(db, lat=lat, lng=lng)
    point = MapService(db).list_artifact_positions()[0]
    assert (point.lat, point.lng) == (lat, lng)


@pytest.mark.parametrize("lat,lng", [
    (None, 106.7), (10.7, None), (None, None),
    (90.01, 106.7), (-90.01, 106.7), (10.7, 180.01), (10.7, -180.01),
    (math.inf, 106.7), (-math.inf, 106.7), (10.7, math.inf), (math.nan, 106.7),
])
def test_invalid_or_missing_coordinates_are_omitted(db, lat, lng):
    add_artifact(db, lat=lat, lng=lng)
    assert MapService(db).list_artifact_positions() == []


def test_translation_fallback_is_vi_then_stable_language_then_code(db):
    add_artifact(db, "vi-only", translations=[("vi", "Tên tiếng Việt", "Nội dung tiếng Việt")])
    add_artifact(db, "other-only", translations=[("fr", "Nom français", None), ("de", "Deutscher Name", None)])
    add_artifact(db, "no-translations")
    points = {point.id: point for point in MapService(db).list_artifact_positions("en")}
    assert points["vi-only"].title == "Tên tiếng Việt"
    assert points["other-only"].title == "Deutscher Name"
    assert points["no-translations"].title == "HV-no-translations"
    assert points["no-translations"].description is None


def test_missing_room_does_not_drop_marker_or_invent_room_information(db):
    add_artifact(db, room_id="legacy-missing-room")
    points = MapService(db).list_artifact_positions()
    assert len(points) == 1
    assert points[0].room is None


def test_description_is_shortened_only_from_actual_transcript(db):
    add_artifact(db, translations=[("vi", "Tên thật", "Nội dung trong database " * 30)])
    description = MapService(db).list_artifact_positions()[0].description
    assert len(description) <= 220
    assert description.endswith("...")
    assert description.startswith("Nội dung trong database")


def test_eager_loading_avoids_one_query_per_marker_and_keeps_artifacts_without_translations(db):
    for index in range(5):
        add_artifact(db, str(index), translations=[("vi", f"Hiện vật {index}", None)])
    add_artifact(db, "untranslated")
    db.expunge_all()
    statements = []

    def record_statement(connection, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    event.listen(db.bind, "before_cursor_execute", record_statement)
    try:
        artifacts = ArtifactRepository(db).list_for_map()
        assert len(artifacts) == 6
        for artifact in artifacts:
            assert artifact.room.code == "103"
            list(artifact.translations)
    finally:
        event.remove(db.bind, "before_cursor_execute", record_statement)
    assert len(statements) == 1


def test_empty_database_does_not_generate_sample_markers(db):
    with api_client(db) as client:
        response = client.get("/api/map/artifacts")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.parametrize("lat,lng", [(math.inf, 0), (0, math.nan), (91, 0), (0, 181)])
def test_api_schema_rejects_non_geographic_or_non_finite_numbers(lat, lng):
    with pytest.raises(ValidationError):
        ArtifactMapPoint(id="x", qr_code="x", title="x", lat=lat, lng=lng)
