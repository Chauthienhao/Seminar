"""
SQLAlchemy models — ánh xạ 1:1 với các bảng trong DB.sql ở thư mục gốc.
Mọi thay đổi cấu trúc bảng phải sửa ở CẢ HAI nơi: DB.sql và file này.
"""
from sqlalchemy import Column, Double, String, Integer, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship

from core.database import Base


class Room(Base):
    """Khu vực / phòng trưng bày — bảng `rooms`."""

    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True)
    code = Column(String(50), nullable=False)
    name_vi = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)

    # passive_deletes="all": không để ORM tự đặt room_id = NULL khi xoá phòng (cột này NOT NULL);
    # luật chặn xoá phòng còn hiện vật nằm ở MapService.delete_room và khoá ngoại RESTRICT.
    artifacts = relationship("Artifact", back_populates="room", passive_deletes="all")


class Artifact(Base):
    """Hiện vật / điểm POI — bảng `artifacts`."""

    __tablename__ = "artifacts"

    id = Column(String(36), primary_key=True)
    qr_code = Column(String(50), unique=True, nullable=False, index=True)
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False)
    lat = Column(Double, nullable=True)
    lng = Column(Double, nullable=True)
    geofence_radius = Column(Integer, default=10)
    image_url = Column(String(500), nullable=True)
    period = Column(String(100), nullable=True)

    room = relationship("Room", back_populates="artifacts")
    translations = relationship(
        "ArtifactTranslation", back_populates="artifact", cascade="all, delete-orphan"
    )
    tour_links = relationship(
        "TourArtifact", back_populates="artifact", cascade="all, delete-orphan"
    )
    play_logs = relationship("PlayLog", back_populates="artifact")


class ArtifactTranslation(Base):
    """Nội dung đa ngôn ngữ của hiện vật — bảng `artifact_translations`."""

    __tablename__ = "artifact_translations"

    id = Column(String(36), primary_key=True)
    artifact_id = Column(String(36), ForeignKey("artifacts.id", ondelete="CASCADE"), nullable=False)
    language_code = Column(String(10), nullable=False)  # 'vi' hoặc 'en'
    title = Column(String(255), nullable=False)
    transcript = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    audio_duration = Column(Integer, nullable=True)

    artifact = relationship("Artifact", back_populates="translations")


class Tour(Base):
    """Tuyến tham quan — bảng `tours`."""

    __tablename__ = "tours"

    id = Column(String(36), primary_key=True)
    title_vi = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    description_vi = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)

    stops = relationship(
        "TourArtifact",
        back_populates="tour",
        cascade="all, delete-orphan",
        order_by="TourArtifact.step_order",
    )


class TourArtifact(Base):
    """Bảng trung gian: thứ tự các điểm dừng trong một tuyến tham quan — bảng `tour_artifacts`."""

    __tablename__ = "tour_artifacts"

    tour_id = Column(String(36), ForeignKey("tours.id", ondelete="CASCADE"), primary_key=True)
    artifact_id = Column(String(36), ForeignKey("artifacts.id", ondelete="CASCADE"), primary_key=True)
    step_order = Column(Integer, nullable=False)

    tour = relationship("Tour", back_populates="stops")
    artifact = relationship("Artifact", back_populates="tour_links")


class PlayLog(Base):
    """Lịch sử phát thuyết minh — dùng cho CMS Analytics — bảng `play_logs`."""

    __tablename__ = "play_logs"

    id = Column(String(36), primary_key=True)
    artifact_id = Column(String(36), ForeignKey("artifacts.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(100), nullable=False)  # ID ẩn danh của thiết bị
    trigger_method = Column(String(50), nullable=False)  # 'QR_SCAN' | 'GEOFENCE' | 'MANUAL' (mở từ tìm kiếm/bản đồ/tour)
    language_played = Column(String(10), nullable=False)
    played_at = Column(TIMESTAMP, server_default=func.now())
    listen_duration = Column(Integer, nullable=True)  # số giây đã nghe

    artifact = relationship("Artifact", back_populates="play_logs")


class User(Base):
    """Tài khoản quản trị CMS — bảng `admins` (repo tương ứng: user_repo.py)."""

    __tablename__ = "admins"

    id = Column(String(36), primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="STAFF")  # 'SUPER_ADMIN' hoặc 'STAFF'
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_login = Column(TIMESTAMP, nullable=True)
