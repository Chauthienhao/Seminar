"""
Pydantic schemas — định dạng dữ liệu vào/ra của API (tách biệt với entities/ORM).
Gộp chung 1 file cho gọn theo đúng cấu trúc thư mục domain/ đã chọn.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ---------- Room ----------

class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    name_vi: str
    name_en: str


class RoomCreate(BaseModel):
    code: str
    name_vi: str
    name_en: str


class RoomUpdate(BaseModel):
    code: str | None = None
    name_vi: str | None = None
    name_en: str | None = None


# ---------- Artifact translation ----------

class ArtifactTranslationIn(BaseModel):
    language_code: str  # 'vi' | 'en'
    title: str
    transcript: str | None = None
    audio_url: str | None = None
    audio_duration: int | None = None


class ArtifactTranslationOut(ArtifactTranslationIn):
    model_config = ConfigDict(from_attributes=True)
    id: str
    audio_source: str = "pre_recorded"  # 'pre_recorded' (file thu sẵn) | 'tts' (tổng hợp giọng nói lúc gọi API)


class ArtifactTranslationUpdate(BaseModel):
    """Sửa một bản dịch — ngôn ngữ nằm trên URL nên không cho đổi ở đây."""

    title: str | None = None
    transcript: str | None = None
    audio_url: str | None = None
    audio_duration: int | None = None


class ArtifactTranslationAdminOut(ArtifactTranslationIn):
    """Bản dịch dạng thô cho CMS — không resolve audio sang TTS như phía khách tham quan."""

    model_config = ConfigDict(from_attributes=True)
    id: str


# ---------- Artifact ----------

class ArtifactCreate(BaseModel):
    qr_code: str
    room_id: str
    lat: float | None = None
    lng: float | None = None
    geofence_radius: int = 10
    image_url: str | None = None
    period: str | None = None
    translations: list[ArtifactTranslationIn] = []


class ArtifactUpdate(BaseModel):
    room_id: str | None = None  # bỏ trống = giữ phòng cũ; gửi null tường minh sẽ bị từ chối
    lat: float | None = None
    lng: float | None = None
    geofence_radius: int | None = None
    image_url: str | None = None
    period: str | None = None


class ArtifactSummary(BaseModel):
    """Dạng rút gọn — dùng cho danh sách tra cứu / tìm kiếm (trang ArtifactLookup)."""

    id: str
    qr_code: str
    title: str
    period: str | None = None
    image_url: str | None = None


class ArtifactMapPoint(BaseModel):
    """One real artifact with geographic coordinates and popup information."""

    id: str
    qr_code: str
    title: str
    image_url: str | None = None
    room: RoomOut | None = None
    description: str | None = None
    lat: float = Field(ge=-90, le=90, allow_inf_nan=False)
    lng: float = Field(ge=-180, le=180, allow_inf_nan=False)


class RoomDetail(RoomOut):
    """Chi tiết phòng kèm danh sách hiện vật — dùng cho sơ đồ mặt bằng (MuseumMap.jsx)."""

    artifacts: list[ArtifactSummary] = []


class ArtifactDetail(BaseModel):
    """Chi tiết đầy đủ — dùng cho trang ArtifactDetail, đã resolve theo 1 ngôn ngữ."""

    id: str
    qr_code: str
    image_url: str | None = None
    period: str | None = None
    lat: float | None = None
    lng: float | None = None
    geofence_radius: int
    room: RoomOut | None = None
    translation: ArtifactTranslationOut
    available_languages: list[str]


class ArtifactAdminOut(BaseModel):
    """Hiện vật kèm TẤT CẢ bản dịch — dùng cho danh sách và form sửa trong CMS."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    qr_code: str
    room_id: str | None = None
    lat: float | None = None
    lng: float | None = None
    geofence_radius: int | None = None
    image_url: str | None = None
    period: str | None = None
    room: RoomOut | None = None
    translations: list[ArtifactTranslationAdminOut] = []


# ---------- Tour ----------

class TourCreate(BaseModel):
    title_vi: str
    title_en: str
    description_vi: str | None = None
    description_en: str | None = None
    duration_minutes: int | None = None
    thumbnail_url: str | None = None
    artifact_ids_in_order: list[str] = []  # thứ tự trong list = step_order


class TourSummary(BaseModel):
    id: str
    title: str
    description: str | None = None
    duration_minutes: int | None = None
    thumbnail_url: str | None = None
    stop_count: int


class TourStop(BaseModel):
    step_order: int
    artifact: ArtifactSummary


class TourDetail(TourSummary):
    stops: list[TourStop]


class TourUpdate(BaseModel):
    title_vi: str | None = None
    title_en: str | None = None
    description_vi: str | None = None
    description_en: str | None = None
    duration_minutes: int | None = None
    thumbnail_url: str | None = None
    # None = giữ nguyên lộ trình; gửi list (kể cả list rỗng) = thay toàn bộ lộ trình theo thứ tự mới
    artifact_ids_in_order: list[str] | None = None


class TourAdminOut(BaseModel):
    """Tour kèm cả tiêu đề/mô tả vi + en — dùng cho form sửa tour trong CMS."""

    id: str
    title_vi: str
    title_en: str
    description_vi: str | None = None
    description_en: str | None = None
    duration_minutes: int | None = None
    thumbnail_url: str | None = None
    stops: list[TourStop]


# ---------- Play log / analytics ----------

class PlayLogCreate(BaseModel):
    artifact_id: str
    session_id: str
    trigger_method: str  # 'QR_SCAN' | 'GEOFENCE' | 'MANUAL'
    language_played: str
    listen_duration: int | None = None


class PlayLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    artifact_id: str | None
    session_id: str
    trigger_method: str
    language_played: str
    played_at: datetime
    listen_duration: int | None


class ArtifactPlayStat(BaseModel):
    """Hiện vật được nghe nhiều nhất — dùng cho dashboard CMS."""

    artifact_id: str
    title: str
    play_count: int
    total_listen_seconds: int


# ---------- Auth (CMS) ----------

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    full_name: str | None
    role: str
    created_at: datetime
    last_login: datetime | None
