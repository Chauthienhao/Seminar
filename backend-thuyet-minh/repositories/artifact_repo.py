"""
Tầng truy xuất dữ liệu cho Artifact / ArtifactTranslation / Room.
Không chứa business logic (không tính toán, không quyết định luật nghiệp vụ)
— chỉ đọc/ghi CSDL. Business logic nằm ở services/audio_service.py.
"""
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from domain.entities import Artifact, ArtifactTranslation


class ArtifactRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, artifact_id: str) -> Artifact | None:
        return (
            self.db.query(Artifact)
            .options(joinedload(Artifact.room), joinedload(Artifact.translations))
            .filter(Artifact.id == artifact_id)
            .first()
        )

    def get_by_qr_code(self, qr_code: str) -> Artifact | None:
        return (
            self.db.query(Artifact)
            .options(joinedload(Artifact.room), joinedload(Artifact.translations))
            .filter(Artifact.qr_code == qr_code)
            .first()
        )

    def search(self, query: str | None, language_code: str, skip: int = 0, limit: int = 20) -> list[Artifact]:
        """Tìm theo mã QR hoặc tiêu đề đã dịch — dùng cho trang Tra cứu hiện vật trên web."""
        q = (
            self.db.query(Artifact)
            .join(ArtifactTranslation)
            .filter(ArtifactTranslation.language_code == language_code)
            .options(joinedload(Artifact.translations), joinedload(Artifact.room))
        )
        if query:
            like = f"%{query}%"
            q = q.filter(or_(Artifact.qr_code.ilike(like), ArtifactTranslation.title.ilike(like)))
        return q.order_by(ArtifactTranslation.title).offset(skip).limit(limit).all()

    def find_nearby(self, lat: float, lng: float, max_candidates: int = 50) -> list[Artifact]:
        """
        Lấy danh sách hiện vật có toạ độ để tính khoảng cách geofence ở tầng service.
        MySQL không có hàm khoảng cách địa lý sẵn nên lọc gần đúng bằng bounding box,
        rồi service sẽ tính chính xác bằng công thức Haversine.
        """
        delta = 0.01  # ~1km, đủ rộng để không bỏ sót trước khi lọc chính xác
        return (
            self.db.query(Artifact)
            .options(joinedload(Artifact.translations), joinedload(Artifact.room))
            .filter(
                Artifact.lat.isnot(None),
                Artifact.lng.isnot(None),
                Artifact.lat.between(lat - delta, lat + delta),
                Artifact.lng.between(lng - delta, lng + delta),
            )
            .limit(max_candidates)
            .all()
        )

    def list_all(self, skip: int = 0, limit: int = 100) -> list[Artifact]:
        return (
            self.db.query(Artifact)
            .options(joinedload(Artifact.translations), joinedload(Artifact.room))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, artifact: Artifact) -> Artifact:
        self.db.add(artifact)
        self.db.commit()
        self.db.refresh(artifact)
        return artifact

    def update(self, artifact: Artifact) -> Artifact:
        self.db.commit()
        self.db.refresh(artifact)
        return artifact

    def delete(self, artifact: Artifact) -> None:
        self.db.delete(artifact)
        self.db.commit()

    def add_translation(self, translation: ArtifactTranslation) -> ArtifactTranslation:
        self.db.add(translation)
        self.db.commit()
        self.db.refresh(translation)
        return translation

    def get_translation(self, artifact_id: str, language_code: str) -> ArtifactTranslation | None:
        return (
            self.db.query(ArtifactTranslation)
            .filter(
                ArtifactTranslation.artifact_id == artifact_id,
                ArtifactTranslation.language_code == language_code,
            )
            .first()
        )
