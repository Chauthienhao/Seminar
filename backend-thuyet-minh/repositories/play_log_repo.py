"""
Tầng truy xuất dữ liệu cho PlayLog — lịch sử phát thuyết minh, phục vụ CMS Analytics.
Dùng bởi services/audio_service.py (ghi log khi phát) và api/routers/admin.py (xem thống kê).
"""
from sqlalchemy import func
from sqlalchemy.orm import Session

from domain.entities import Artifact, ArtifactTranslation, PlayLog


class PlayLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: PlayLog) -> PlayLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

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
