"""Read-only analytics over the existing play_logs schema (no migrations).

The date window uses the database's stored timestamps, with an inclusive end date.
Routes are full observed sequences, split after 30 minutes of inactivity. They
describe listening order, not verified physical movement. Session IDs never leave
this service. SQL aggregates avoid translation joins multiplying play counts.
"""
from collections import Counter
from datetime import date, datetime, time, timedelta

from sqlalchemy import func

from domain.entities import Artifact, ArtifactTranslation, PlayLog, Room


class AnalyticsService:
    def __init__(self, db):
        self.db = db

    def dashboard(self, start: date, end: date, lang: str = "vi") -> dict:
        lower = datetime.combine(start, time.min)
        upper = datetime.combine(end + timedelta(days=1), time.min)
        filters = (PlayLog.played_at >= lower, PlayLog.played_at < upper)
        logs = self.db.query(PlayLog).filter(*filters)
        total, measured, avg = logs.with_entities(
            func.count(PlayLog.id), func.count(PlayLog.listen_duration), func.avg(PlayLog.listen_duration)
        ).one()

        # MIN gives a stable fallback even for legacy duplicate translations.
        names = dict(self.db.query(Artifact.id, Artifact.qr_code).all())
        fallback = self.db.query(ArtifactTranslation.artifact_id, func.min(ArtifactTranslation.title)).group_by(
            ArtifactTranslation.artifact_id
        ).all()
        preferred = self.db.query(ArtifactTranslation.artifact_id, func.min(ArtifactTranslation.title)).filter(
            ArtifactTranslation.language_code == lang
        ).group_by(ArtifactTranslation.artifact_id).all()
        names.update(fallback)
        names.update(preferred)

        poi_rows = logs.with_entities(
            PlayLog.artifact_id, func.count(PlayLog.id), func.count(PlayLog.listen_duration),
            func.avg(PlayLog.listen_duration), func.coalesce(func.sum(PlayLog.listen_duration), 0),
        ).filter(PlayLog.artifact_id.isnot(None)).group_by(PlayLog.artifact_id).order_by(
            func.count(PlayLog.id).desc(), PlayLog.artifact_id
        ).all()
        pois = [dict(artifact_id=id_, title=names.get(id_, id_), play_count=count,
                     measured_plays=known, average_listen_seconds=round(float(mean), 2) if mean is not None else None,
                     total_listen_seconds=int(seconds)) for id_, count, known, mean, seconds in poi_rows]

        daily_rows = logs.with_entities(
            func.date(PlayLog.played_at), PlayLog.language_played, func.count(PlayLog.id)
        ).group_by(func.date(PlayLog.played_at), PlayLog.language_played).order_by(
            func.date(PlayLog.played_at), PlayLog.language_played
        ).all()
        languages = logs.with_entities(PlayLog.language_played, func.count(PlayLog.id)).group_by(
            PlayLog.language_played
        ).order_by(func.count(PlayLog.id).desc(), PlayLog.language_played).all()

        room_counts = dict(self.db.query(Artifact.room_id, func.count(PlayLog.id)).join(
            PlayLog, PlayLog.artifact_id == Artifact.id
        ).filter(*filters).group_by(Artifact.room_id).all())
        rooms = [dict(room_id=r.id, code=r.code, name=r.name_en if lang == "en" else r.name_vi,
                      play_count=room_counts.get(r.id, 0))
                 for r in self.db.query(Room).order_by(Room.code, Room.id).all()]
        assigned = sum(r["play_count"] for r in rooms)

        ordered = logs.with_entities(PlayLog.session_id, PlayLog.artifact_id, PlayLog.played_at).order_by(
            PlayLog.session_id, PlayLog.played_at, PlayLog.id
        ).yield_per(1000)
        routes = Counter()
        session, previous_time, route = None, None, []

        def finish():
            if len(route) >= 2:
                routes[tuple(route)] += 1

        for session_id, artifact_id, played_at in ordered:
            if session_id != session or (previous_time and played_at - previous_time > timedelta(minutes=30)):
                finish()
                route = []
            # A deleted POI is a gap, not a new inferred direct transition.
            if artifact_id is None:
                finish()
                route = []
            elif not route or route[-1] != artifact_id:
                route.append(artifact_id)
            session, previous_time = session_id, played_at
        finish()
        popular = [dict(stops=[dict(artifact_id=id_, title=names.get(id_, id_)) for id_ in sequence],
                        journey_count=count)
                   for sequence, count in sorted(routes.items(), key=lambda item: (-item[1], item[0]))[:10]]

        return dict(start_date=start.isoformat(), end_date=end.isoformat(), timezone="database",
                    total_plays=total, measured_plays=measured,
                    average_listen_seconds=round(float(avg), 2) if avg is not None else None,
                    unassigned_plays=total-assigned, pois=pois,
                    daily=[dict(day=str(day), language=language, play_count=count) for day, language, count in daily_rows],
                    languages=[dict(language=language, play_count=count) for language, count in languages],
                    popular_routes=popular, rooms=rooms)
