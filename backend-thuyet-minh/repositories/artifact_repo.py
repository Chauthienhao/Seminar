"""
Tầng truy xuất dữ liệu cho Artifact / ArtifactTranslation.
Không chứa business logic (không tính toán, không quyết định luật nghiệp vụ)
— chỉ đọc/ghi CSDL. Business logic nằm ở services/audio_service.py.
Vị trí (QR, GPS) không nằm ở đây mà ở bảng pois — xem repositories/poi_repo.py.
"""
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from domain.entities import Artifact, ArtifactTranslation, Poi


def _with_details():
    """Nạp sẵn POI + phòng + bản dịch để service đọc mà không phát sinh thêm truy vấn."""
    return (
        joinedload(Artifact.poi).joinedload(Poi.room),
        joinedload(Artifact.translations),
    )


class ArtifactRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, artifact_id: str) -> Artifact | None:
        return self.db.query(Artifact).options(*_with_details()).filter(Artifact.id == artifact_id).first()

    def get_by_code(self, code: str) -> Artifact | None:
        return self.db.query(Artifact).options(*_with_details()).filter(Artifact.code == code).first()

    def search(self, query: str | None, language_code: str, skip: int = 0, limit: int = 20) -> list[Artifact]:
        """Tìm theo mã hoặc tiêu đề đã dịch — dùng cho trang Tra cứu hiện vật trên web."""
        q = (
            self.db.query(Artifact)
            .join(ArtifactTranslation)
            .filter(ArtifactTranslation.language_code == language_code)
            .options(*_with_details())
        )
        if query:
            like = f"%{query}%"
            q = q.filter(or_(Artifact.code.ilike(like), ArtifactTranslation.title.ilike(like)))
        return q.order_by(ArtifactTranslation.title).offset(skip).limit(limit).all()

    def list_for_admin(self, query: str | None, skip: int = 0, limit: int = 50) -> list[Artifact]:
        """
        Danh sách cho CMS: lấy CẢ hiện vật chưa có bản dịch nào (khác `search()` phía khách
        tham quan vốn join bắt buộc với bản dịch), tìm theo mã hoặc tiêu đề ở mọi ngôn ngữ.
        """
        q = self.db.query(Artifact).options(*_with_details())
        if query:
            like = f"%{query}%"
            q = q.filter(
                or_(
                    Artifact.code.ilike(like),
                    Artifact.translations.any(ArtifactTranslation.title.ilike(like)),
                )
            )
        return q.order_by(Artifact.code).offset(skip).limit(limit).all()

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

    def update_translation(self, translation: ArtifactTranslation) -> ArtifactTranslation:
        self.db.commit()
        self.db.refresh(translation)
        return translation

    def delete_translation(self, translation: ArtifactTranslation) -> None:
        self.db.delete(translation)
        self.db.commit()

    def get_translation(self, artifact_id: str, language_code: str) -> ArtifactTranslation | None:
        return (
            self.db.query(ArtifactTranslation)
            .filter(
                ArtifactTranslation.artifact_id == artifact_id,
                ArtifactTranslation.language_code == language_code,
            )
            .first()
        )
