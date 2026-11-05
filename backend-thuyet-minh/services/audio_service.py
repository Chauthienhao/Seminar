"""
Business logic cho hiện vật + thuyết minh tự động (đề tài slide "1. Thuyết minh tự động").

Quy tắc nghiệp vụ chính:
- Nếu bản dịch (artifact_translations) đã có `audio_url` (file thu sẵn, giọng tự nhiên,
  chất lượng cao) -> ưu tiên dùng file đó.
- Nếu chưa có -> gọi sang service TTS riêng biệt (linh hoạt, đa ngôn ngữ, nhẹ dữ liệu) để
  tổng hợp giọng nói theo yêu cầu, và trả về URL stream từ service đó.
  Đây chính là phần "BE Dev tạo các services giao tiếp với nhau" trong đề bài — hai service
  (backend chính và tts-service) giao tiếp qua HTTP, độc lập triển khai/CI-CD.
- Việc "quản lý hàng chờ audio, không phát trùng lặp, tự dừng khi có thông báo khác" là hành vi
  phía client (trình phát trong ArtifactDetail.jsx) — backend chỉ đảm bảo trả về ĐÚNG MỘT
  nguồn audio hợp lệ cho mỗi request, không cần biết trình phát đang làm gì.
"""
import uuid
from urllib.parse import quote

from sqlalchemy.orm import Session

from core.config import settings
from core.exceptions import ConflictError, InvalidDataError, NotFoundError
from domain.entities import Artifact, ArtifactTranslation, PlayLog
from domain.schemas import (
    ArtifactAdminOut,
    ArtifactCreate,
    ArtifactDetail,
    ArtifactPlayStat,
    ArtifactSummary,
    ArtifactTranslationAdminOut,
    ArtifactTranslationIn,
    ArtifactTranslationOut,
    ArtifactTranslationUpdate,
    ArtifactUpdate,
    PlayLogCreate,
    PlayLogOut,
    RoomOut,
)
from repositories.artifact_repo import ArtifactRepository
from repositories.play_log_repo import PlayLogRepository
from repositories.room_repo import RoomRepository

SUPPORTED_LANGUAGES = ("vi", "en")


class AudioService:
    def __init__(self, db: Session):
        self.db = db
        self.artifacts = ArtifactRepository(db)
        self.play_logs = PlayLogRepository(db)
        self.rooms = RoomRepository(db)

    # ---------- Đọc dữ liệu cho khách tham quan ----------

    def get_detail(self, artifact_id: str, language_code: str = "vi") -> ArtifactDetail:
        artifact = self.artifacts.get_by_id(artifact_id)
        if artifact is None:
            raise NotFoundError(f"Không tìm thấy hiện vật id={artifact_id}")
        return self._to_detail(artifact, language_code)

    def lookup_by_qr_code(self, qr_code: str, language_code: str = "vi") -> ArtifactDetail:
        """Luồng chính khi quét mã QR (mobile) hoặc nhập mã thủ công (web)."""
        artifact = self.artifacts.get_by_qr_code(qr_code)
        if artifact is None:
            raise NotFoundError(f"Không tìm thấy hiện vật với mã '{qr_code}'")
        return self._to_detail(artifact, language_code)

    def search(self, query: str | None, language_code: str = "vi", skip: int = 0, limit: int = 20) -> list[ArtifactSummary]:
        artifacts = self.artifacts.search(query, language_code, skip, limit)
        return [self._to_summary(a, language_code) for a in artifacts]

    # ---------- Ghi log lượt phát (Analytics) ----------

    def log_play(self, payload: PlayLogCreate) -> PlayLogOut:
        artifact = self.artifacts.get_by_id(payload.artifact_id)
        if artifact is None:
            raise NotFoundError(f"Không tìm thấy hiện vật id={payload.artifact_id}")

        log = PlayLog(
            id=str(uuid.uuid4()),
            artifact_id=payload.artifact_id,
            session_id=payload.session_id,
            trigger_method=payload.trigger_method,
            language_played=payload.language_played,
            listen_duration=payload.listen_duration,
        )
        created = self.play_logs.create(log)
        return PlayLogOut.model_validate(created)

    def top_played(self, language_code: str = "vi", limit: int = 10) -> list[ArtifactPlayStat]:
        rows = self.play_logs.top_played_artifacts(language_code, limit)
        return [ArtifactPlayStat(**row) for row in rows]

    # ---------- CMS: quản trị hiện vật ----------

    def create_artifact(self, payload: ArtifactCreate) -> ArtifactDetail:
        if self.artifacts.get_by_qr_code(payload.qr_code) is not None:
            raise ConflictError(f"Mã QR '{payload.qr_code}' đã tồn tại")
        self._validate_room(payload.room_id)

        artifact = Artifact(
            id=str(uuid.uuid4()),
            qr_code=payload.qr_code,
            room_id=payload.room_id,
            lat=payload.lat,
            lng=payload.lng,
            geofence_radius=payload.geofence_radius,
            image_url=payload.image_url,
            period=payload.period,
        )
        created = self.artifacts.create(artifact)

        for t in payload.translations:
            translation = ArtifactTranslation(
                id=str(uuid.uuid4()),
                artifact_id=created.id,
                language_code=t.language_code,
                title=t.title,
                transcript=t.transcript,
                audio_url=t.audio_url,
                audio_duration=t.audio_duration,
            )
            self.artifacts.add_translation(translation)

        default_lang = payload.translations[0].language_code if payload.translations else "vi"
        return self.get_detail(created.id, default_lang)

    def update_artifact(self, artifact_id: str, payload: ArtifactUpdate) -> ArtifactDetail:
        artifact = self.artifacts.get_by_id(artifact_id)
        if artifact is None:
            raise NotFoundError(f"Không tìm thấy hiện vật id={artifact_id}")

        fields = payload.model_dump(exclude_unset=True)
        if "room_id" in fields:
            self._validate_room(fields["room_id"])

        for field, value in fields.items():
            setattr(artifact, field, value)

        updated = self.artifacts.update(artifact)
        return self._to_detail(updated, "vi")

    def delete_artifact(self, artifact_id: str) -> None:
        artifact = self.artifacts.get_by_id(artifact_id)
        if artifact is None:
            raise NotFoundError(f"Không tìm thấy hiện vật id={artifact_id}")
        self.artifacts.delete(artifact)

    def list_for_admin(self, query: str | None, skip: int = 0, limit: int = 50) -> list[ArtifactAdminOut]:
        return [ArtifactAdminOut.model_validate(a) for a in self.artifacts.list_for_admin(query, skip, limit)]

    def get_for_admin(self, artifact_id: str) -> ArtifactAdminOut:
        artifact = self.artifacts.get_by_id(artifact_id)
        if artifact is None:
            raise NotFoundError(f"Không tìm thấy hiện vật id={artifact_id}")
        return ArtifactAdminOut.model_validate(artifact)

    # ---------- CMS: quản trị bản dịch (mỗi hiện vật tối đa 1 bản / ngôn ngữ) ----------

    def add_translation(self, artifact_id: str, payload: ArtifactTranslationIn) -> ArtifactTranslationAdminOut:
        if payload.language_code not in SUPPORTED_LANGUAGES:
            raise InvalidDataError(f"Ngôn ngữ '{payload.language_code}' chưa được hỗ trợ")
        if self.artifacts.get_by_id(artifact_id) is None:
            raise NotFoundError(f"Không tìm thấy hiện vật id={artifact_id}")
        if self.artifacts.get_translation(artifact_id, payload.language_code) is not None:
            raise ConflictError(f"Hiện vật đã có bản dịch '{payload.language_code}', hãy sửa thay vì thêm mới")

        translation = ArtifactTranslation(id=str(uuid.uuid4()), artifact_id=artifact_id, **payload.model_dump())
        created = self.artifacts.add_translation(translation)
        return ArtifactTranslationAdminOut.model_validate(created)

    def update_translation(
        self, artifact_id: str, language_code: str, payload: ArtifactTranslationUpdate
    ) -> ArtifactTranslationAdminOut:
        translation = self._get_translation_or_raise(artifact_id, language_code)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(translation, field, value)
        updated = self.artifacts.update_translation(translation)
        return ArtifactTranslationAdminOut.model_validate(updated)

    def delete_translation(self, artifact_id: str, language_code: str) -> None:
        translation = self._get_translation_or_raise(artifact_id, language_code)
        artifact = self.artifacts.get_by_id(artifact_id)
        # Hiện vật không còn bản dịch nào sẽ biến mất khỏi trang tra cứu và trang chi tiết
        # báo lỗi, nên bắt buộc giữ lại ít nhất 1 bản.
        if len(artifact.translations) <= 1:
            raise InvalidDataError("Không thể xoá bản dịch cuối cùng của hiện vật")
        self.artifacts.delete_translation(translation)

    # ---------- Nội bộ ----------

    def _validate_room(self, room_id: str | None) -> None:
        """Mỗi hiện vật bắt buộc thuộc một phòng đang tồn tại (artifacts.room_id NOT NULL + khoá ngoại)."""
        if not room_id:
            raise InvalidDataError("Hiện vật bắt buộc phải thuộc một phòng")
        if self.rooms.get_by_id(room_id) is None:
            raise InvalidDataError(f"Không tìm thấy phòng id={room_id}")

    def _get_translation_or_raise(self, artifact_id: str, language_code: str) -> ArtifactTranslation:
        translation = self.artifacts.get_translation(artifact_id, language_code)
        if translation is None:
            raise NotFoundError(f"Hiện vật id={artifact_id} chưa có bản dịch '{language_code}'")
        return translation

    def _pick_translation(self, artifact: Artifact, language_code: str) -> ArtifactTranslation:
        for t in artifact.translations:
            if t.language_code == language_code:
                return t
        # Không có đúng ngôn ngữ yêu cầu -> lấy bản đầu tiên có sẵn (fallback mềm)
        if artifact.translations:
            return artifact.translations[0]
        raise NotFoundError(f"Hiện vật '{artifact.qr_code}' chưa có nội dung thuyết minh nào")

    def _resolve_audio(self, translation: ArtifactTranslation) -> ArtifactTranslationOut:
        """
        Áp quy tắc: ưu tiên audio thu sẵn; nếu thiếu thì trỏ sang TTS service.
        Đây là điểm giao tiếp liên-service (backend chính -> tts-service).
        """
        out = ArtifactTranslationOut.model_validate(translation)
        if not out.audio_url:
            encoded_text = quote((translation.transcript or translation.title)[:2000])
            out.audio_url = (
                f"{settings.TTS_SERVICE_URL}/synthesize"
                f"?text={encoded_text}&lang={translation.language_code}"
            )
            out.audio_source = "tts"
        else:
            out.audio_source = "pre_recorded"
        return out

    def _to_detail(self, artifact: Artifact, language_code: str) -> ArtifactDetail:
        translation = self._pick_translation(artifact, language_code)
        return ArtifactDetail(
            id=artifact.id,
            qr_code=artifact.qr_code,
            image_url=artifact.image_url,
            period=artifact.period,
            lat=artifact.lat,
            lng=artifact.lng,
            geofence_radius=artifact.geofence_radius,
            room=RoomOut.model_validate(artifact.room) if artifact.room else None,
            translation=self._resolve_audio(translation),
            available_languages=sorted({t.language_code for t in artifact.translations}),
        )

    def _to_summary(self, artifact: Artifact, language_code: str) -> ArtifactSummary:
        translation = self._pick_translation(artifact, language_code)
        return ArtifactSummary(
            id=artifact.id,
            qr_code=artifact.qr_code,
            title=translation.title,
            period=artifact.period,
            image_url=artifact.image_url,
        )
