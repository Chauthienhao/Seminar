"""
Tầng truy xuất dữ liệu cho PlayLog — lịch sử phát thuyết minh, phục vụ CMS Analytics.
Dùng bởi services/audio_service.py (ghi log khi phát) và api/routers/admin.py (xem thống kê).
"""
from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.exceptions import ConflictError
from domain.entities import Artifact, ArtifactTranslation, PlayLog


class PlayLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: PlayLog) -> PlayLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def save_snapshot(self, log: PlayLog) -> PlayLog:
        """Reuse the existing PK; preserve start time and never decrease duration."""
        existing = self.db.get(PlayLog, log.id)
        if existing is None:
            try:
                return self.create(log)
            except IntegrityError:
                self.db.rollback()
                # A concurrent start/checkpoint may have inserted the same ID.
                existing = self.db.get(PlayLog, log.id)
                if existing is None:
                    raise
        if (existing.session_id, existing.artifact_id, existing.language_played) != (
            log.session_id, log.artifact_id, log.language_played
        ):
            raise ConflictError("Mã lượt nghe đã được sử dụng")
        if log.listen_duration is not None:
            self.db.query(PlayLog).filter(PlayLog.id == log.id).update({
                PlayLog.listen_duration: case(
                    (PlayLog.listen_duration.is_(None), log.listen_duration),
                    (PlayLog.listen_duration < log.listen_duration, log.listen_duration),
                    else_=PlayLog.listen_duration,
                )
            }, synchronize_session=False)
            self.db.commit()
            self.db.refresh(existing)
        return existing

    def top_played_artifacts(self, language_code: str = "vi", limit: int = 10) -> list[dict]:
        """Top hiện vật được nghe nhiều nhất — dùng cho dashboard CMS."""
        rows = (
            self.db.query(
                PlayLog.artifact_id,
                ArtifactTranslation.title,
                func.count(PlayLog.id).label("play_count"),
                func.coalesce(func.sum(PlayLog.listen_duration), 0).label("total_listen_seconds"),
            )
            .join(Artifact, Artifact.id == PlayLog.artifact_id)
            .join(
                ArtifactTranslation,
                (ArtifactTranslation.artifact_id == Artifact.id)
                & (ArtifactTranslation.language_code == language_code),
            )
            .group_by(PlayLog.artifact_id, ArtifactTranslation.title)
            .order_by(func.count(PlayLog.id).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "artifact_id": r.artifact_id,
                "title": r.title,
                "play_count": r.play_count,
                "total_listen_seconds": int(r.total_listen_seconds),
            }
            for r in rows
        ]
