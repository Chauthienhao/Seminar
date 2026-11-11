"""
Pydantic schemas — định dạng dữ liệu vào/ra của API (tách biệt với entities/ORM).
Gộp chung 1 file cho gọn theo đúng cấu trúc thư mục domain/ đã chọn.
"""
from datetime import datetime
from typing import Literal

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


# ---------- POI (điểm tham quan) ----------

PoiType = Literal["EXHIBIT", "ENTRANCE", "INFO_DESK", "EXIT"]


class PoiCreate(BaseModel):
    code: str  # mã in trong QR — không sửa được sau khi tạo (các tờ QR đã in trỏ vào mã này)
    room_id: str
    poi_type: PoiType = "EXHIBIT"
    name_vi: str
    name_en: str
    description_vi: str | None = None
    description_en: str | None = None
    lat: float | None = None
    lng: float | None = None
    geofence_radius: int = 10


class PoiUpdate(BaseModel):
    room_id: str | None = None  # bỏ trống = giữ phòng cũ; gửi null tường minh sẽ bị từ chối
    poi_type: PoiType | None = None
    name_vi: str | None = None
    name_en: str | None = None
    description_vi: str | None = None
    description_en: str | None = None
    lat: float | None = None
    lng: float | None = None
    geofence_radius: int | None = None


class PoiOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    room_id: str
    poi_type: str
    name_vi: str
    name_en: str
    description_vi: str | None = None
    description_en: str | None = None
    lat: float | None = None
    lng: float | None = None
    geofence_radius: int | None = None
    room: RoomOut | None = None


# ---------- Artifact ----------

class ArtifactCreate(BaseModel):
    code: str
    poi_id: str
    image_url: str | None = None
    period: str | None = None
    translations: list[ArtifactTranslationIn] = []


class ArtifactUpdate(BaseModel):
    poi_id: str | None = None  # bỏ trống = giữ POI cũ; gửi null tường minh sẽ bị từ chối
    image_url: str | None = None
    period: str | None = None


class ArtifactSummary(BaseModel):
    """Dạng rút gọn — dùng cho danh sách tra cứu, danh sách hiện vật tại một POI, popup bản đồ."""

    id: str
    code: str
    title: str
    period: str | None = None
    image_url: str | None = None
    description: str | None = None  # chỉ điền ở popup bản đồ (đoạn đầu của transcript)


class PoiDetail(PoiOut):
    """POI kèm các hiện vật đặt tại đó — dùng khi quét QR, trên bản đồ, trong tour và CMS."""

    artifacts: list[ArtifactSummary] = []


class ArtifactDetail(BaseModel):
    """Chi tiết đầy đủ — dùng cho trang ArtifactDetail, đã resolve theo 1 ngôn ngữ."""

    id: str
    code: str
    image_url: str | None = None
    period: str | None = None
    poi: PoiOut
    room: RoomOut | None = None
    translation: ArtifactTranslationOut
    available_languages: list[str]


class ArtifactAdminOut(BaseModel):
    """Hiện vật kèm TẤT CẢ bản dịch — dùng cho danh sách và form sửa trong CMS."""

    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    poi_id: str
    image_url: str | None = None
    period: str | None = None
    poi: PoiOut | None = None
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
    poi_ids_in_order: list[str] = []  # thứ tự trong list = step_order


class TourSummary(BaseModel):
    id: str
    title: str
    description: str | None = None
    duration_minutes: int | None = None
    thumbnail_url: str | None = None
    stop_count: int


class TourStop(BaseModel):
    step_order: int
    poi: PoiDetail


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
    poi_ids_in_order: list[str] | None = None


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
    poi_id: str | None
    session_id: str
    trigger_method: str
    language_played: str
    played_at: datetime
    listen_duration: int | None


class PresenceHeartbeat(BaseModel):
    """Trình duyệt của khách báo "vẫn đang mở web" (xem services/presence_service.py)."""

    device_id: str = Field(..., min_length=8, max_length=64, pattern=r"^[A-Za-z0-9-]+$")


class OnlineStat(BaseModel):
    """Số thiết bị đang truy cập — dùng cho trang Tổng quan CMS."""

    online_devices: int
    window_seconds: int


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
