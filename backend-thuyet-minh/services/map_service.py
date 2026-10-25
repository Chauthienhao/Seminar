"""
Business logic cho sơ đồ tham quan: phòng (rooms), tuyến tham quan (tours),
và định vị hiện vật gần nhất theo toạ độ (geofence — dùng cho bản mobile sau này,
khớp cột lat/lng/geofence_radius trong bảng `artifacts`).
"""
import math
import uuid

from sqlalchemy.orm import Session

from core.exceptions import ConflictError, InvalidDataError, NotFoundError
from domain.entities import Artifact, Room, Tour, TourArtifact
from domain.schemas import (
    ArtifactSummary,
    RoomCreate,
    RoomDetail,
    RoomOut,
    RoomUpdate,
    TourAdminOut,
    TourCreate,
    TourDetail,
    TourStop,
    TourSummary,
    TourUpdate,
)
from repositories.artifact_repo import ArtifactRepository
from repositories.room_repo import RoomRepository
from repositories.tour_repo import TourRepository


class MapService:
    def __init__(self, db: Session):
        self.db = db
        self.rooms = RoomRepository(db)
        self.tours = TourRepository(db)
        self.artifacts = ArtifactRepository(db)

    # ---------- Rooms ----------

    def list_rooms(self) -> list[RoomOut]:
        return [RoomOut.model_validate(r) for r in self.rooms.list_all()]

    def get_room(self, room_id: str, language_code: str = "vi") -> RoomDetail:
        room = self.rooms.get_by_id(room_id)
        if room is None:
            raise NotFoundError(f"Không tìm thấy phòng id={room_id}")

        artifacts = [
            ArtifactSummary(
                id=a.id,
                qr_code=a.qr_code,
                title=next(
                    (t.title for t in a.translations if t.language_code == language_code),
                    a.translations[0].title if a.translations else a.qr_code,
                ),
                period=a.period,
                image_url=a.image_url,
            )
            for a in room.artifacts
        ]
        return RoomDetail(id=room.id, code=room.code, name_vi=room.name_vi, name_en=room.name_en, artifacts=artifacts)

    def create_room(self, payload: RoomCreate) -> RoomOut:
        if self.rooms.get_by_code(payload.code) is not None:
            raise ConflictError(f"Mã phòng '{payload.code}' đã tồn tại")
        room = Room(id=str(uuid.uuid4()), code=payload.code, name_vi=payload.name_vi, name_en=payload.name_en)
        created = self.rooms.create(room)
        return RoomOut.model_validate(created)

    def update_room(self, room_id: str, payload: RoomUpdate) -> RoomOut:
        room = self.rooms.get_by_id(room_id)
        if room is None:
            raise NotFoundError(f"Không tìm thấy phòng id={room_id}")

        if payload.code is not None and payload.code != room.code:
            if self.rooms.get_by_code(payload.code) is not None:
                raise ConflictError(f"Mã phòng '{payload.code}' đã tồn tại")

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(room, field, value)
        return RoomOut.model_validate(self.rooms.update(room))

    def delete_room(self, room_id: str) -> None:
        """Hiện vật trong phòng KHÔNG bị xoá theo, chỉ chuyển sang trạng thái chưa xếp phòng (room_id = NULL)."""
        room = self.rooms.get_by_id(room_id)
        if room is None:
            raise NotFoundError(f"Không tìm thấy phòng id={room_id}")
        self.rooms.delete(room)

    # ---------- Tours ----------

    def list_tours(self, language_code: str = "vi") -> list[TourSummary]:
        return [self._to_tour_summary(t, language_code) for t in self.tours.list_all()]

    def get_tour(self, tour_id: str, language_code: str = "vi") -> TourDetail:
        tour = self.tours.get_by_id(tour_id)
        if tour is None:
            raise NotFoundError(f"Không tìm thấy tuyến tham quan id={tour_id}")

        summary = self._to_tour_summary(tour, language_code)
        return TourDetail(**summary.model_dump(), stops=self._to_tour_stops(tour, language_code))

    def create_tour(self, payload: TourCreate) -> TourDetail:
        self._validate_stop_ids(payload.artifact_ids_in_order)
        tour = Tour(
            id=str(uuid.uuid4()),
            title_vi=payload.title_vi,
            title_en=payload.title_en,
            description_vi=payload.description_vi,
            description_en=payload.description_en,
            duration_minutes=payload.duration_minutes,
            thumbnail_url=payload.thumbnail_url,
        )
        created = self.tours.create(tour)

        for order, artifact_id in enumerate(payload.artifact_ids_in_order, start=1):
            self.tours.add_stop(
                TourArtifact(tour_id=created.id, artifact_id=artifact_id, step_order=order)
            )

        return self.get_tour(created.id, "vi")

    def list_tours_for_admin(self) -> list[TourAdminOut]:
        return [self._to_tour_admin(t) for t in self.tours.list_all()]

    def get_tour_for_admin(self, tour_id: str) -> TourAdminOut:
        tour = self.tours.get_by_id(tour_id)
        if tour is None:
            raise NotFoundError(f"Không tìm thấy tuyến tham quan id={tour_id}")
        return self._to_tour_admin(tour)

    def update_tour(self, tour_id: str, payload: TourUpdate) -> TourAdminOut:
        tour = self.tours.get_by_id(tour_id)
        if tour is None:
            raise NotFoundError(f"Không tìm thấy tuyến tham quan id={tour_id}")

        fields = payload.model_dump(exclude_unset=True)
        new_order = fields.pop("artifact_ids_in_order", None)
        for field, value in fields.items():
            setattr(tour, field, value)

        if new_order is None:
            tour = self.tours.update(tour)
        else:
            self._validate_stop_ids(new_order)
            stops = [
                TourArtifact(tour_id=tour.id, artifact_id=artifact_id, step_order=order)
                for order, artifact_id in enumerate(new_order, start=1)
            ]
            tour = self.tours.replace_stops(tour, stops)

        return self._to_tour_admin(tour)

    def delete_tour(self, tour_id: str) -> None:
        tour = self.tours.get_by_id(tour_id)
        if tour is None:
            raise NotFoundError(f"Không tìm thấy tuyến tham quan id={tour_id}")
        self.tours.delete(tour)

    # ---------- Geofence: tìm hiện vật gần nhất theo toạ độ GPS ----------

    def find_nearest_artifact(self, lat: float, lng: float, language_code: str = "vi") -> ArtifactSummary | None:
        """
        Dùng công thức Haversine để tính khoảng cách thật (mét) giữa vị trí khách tham
        quan và từng hiện vật, rồi chỉ nhận hiện vật nằm trong bán kính `geofence_radius`
        của chính nó. Trả về hiện vật gần nhất nếu có nhiều điểm cùng thoả điều kiện.
        """
        candidates = self.artifacts.find_nearby(lat, lng)
        best, best_distance = None, None

        for artifact in candidates:
            distance_m = self._haversine_meters(lat, lng, artifact.lat, artifact.lng)
            if distance_m <= (artifact.geofence_radius or 10):
                if best_distance is None or distance_m < best_distance:
                    best, best_distance = artifact, distance_m

        if best is None:
            return None

        title = next(
            (t.title for t in best.translations if t.language_code == language_code),
            best.translations[0].title if best.translations else best.qr_code,
        )
        return ArtifactSummary(id=best.id, qr_code=best.qr_code, title=title, period=best.period, image_url=best.image_url)

    @staticmethod
    def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        radius_earth_m = 6_371_000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lng2 - lng1)
        a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        return 2 * radius_earth_m * math.asin(math.sqrt(a))

    # ---------- Nội bộ ----------

    def _validate_stop_ids(self, artifact_ids: list[str]) -> None:
        if len(artifact_ids) != len(set(artifact_ids)):
            raise InvalidDataError("Một hiện vật chỉ được xuất hiện một lần trong lộ trình tour")
        missing = set(artifact_ids) - self.artifacts.existing_ids(artifact_ids)
        if missing:
            raise InvalidDataError(f"Không tìm thấy hiện vật trong lộ trình: {', '.join(sorted(missing))}")

    @staticmethod
    def _artifact_summary(artifact: Artifact, language_code: str) -> ArtifactSummary:
        return ArtifactSummary(
            id=artifact.id,
            qr_code=artifact.qr_code,
            title=next(
                (t.title for t in artifact.translations if t.language_code == language_code),
                artifact.translations[0].title if artifact.translations else artifact.qr_code,
            ),
            period=artifact.period,
            image_url=artifact.image_url,
        )

    def _to_tour_stops(self, tour: Tour, language_code: str) -> list[TourStop]:
        return [
            TourStop(step_order=link.step_order, artifact=self._artifact_summary(link.artifact, language_code))
            for link in sorted(tour.stops, key=lambda s: s.step_order)
        ]

    def _to_tour_admin(self, tour: Tour) -> TourAdminOut:
        return TourAdminOut(
            id=tour.id,
            title_vi=tour.title_vi,
            title_en=tour.title_en,
            description_vi=tour.description_vi,
            description_en=tour.description_en,
            duration_minutes=tour.duration_minutes,
            thumbnail_url=tour.thumbnail_url,
            stops=self._to_tour_stops(tour, "vi"),
        )

    @staticmethod
    def _to_tour_summary(tour: Tour, language_code: str) -> TourSummary:
        is_en = language_code == "en"
        return TourSummary(
            id=tour.id,
            title=tour.title_en if is_en else tour.title_vi,
            description=(tour.description_en if is_en else tour.description_vi),
            duration_minutes=tour.duration_minutes,
            thumbnail_url=tour.thumbnail_url,
            stop_count=len(tour.stops),
        )
