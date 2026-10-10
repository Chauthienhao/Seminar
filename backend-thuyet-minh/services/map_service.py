"""
Business logic cho sơ đồ tham quan: phòng (rooms), tuyến tham quan (tours),
và định vị hiện vật gần nhất theo toạ độ (geofence — dùng cho bản mobile sau này,
khớp cột lat/lng/geofence_radius trong bảng `artifacts`).
"""
import math
import uuid

from sqlalchemy.orm import Session

from core.exceptions import NotFoundError
from domain.entities import Room, Tour, TourArtifact
from domain.schemas import (
    ArtifactSummary,
    RoomCreate,
    RoomDetail,
    RoomOut,
    TourCreate,
    TourDetail,
    TourStop,
    TourSummary,
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
        room = Room(id=str(uuid.uuid4()), code=payload.code, name_vi=payload.name_vi, name_en=payload.name_en)
        created = self.rooms.create(room)
        return RoomOut.model_validate(created)

    # ---------- Tours ----------

    def list_tours(self, language_code: str = "vi") -> list[TourSummary]:
        return [self._to_tour_summary(t, language_code) for t in self.tours.list_all()]

    def get_tour(self, tour_id: str, language_code: str = "vi") -> TourDetail:
        tour = self.tours.get_by_id(tour_id)
        if tour is None:
            raise NotFoundError(f"Không tìm thấy tuyến tham quan id={tour_id}")

        stops = [
            TourStop(
                step_order=link.step_order,
                artifact=ArtifactSummary(
                    id=link.artifact.id,
                    qr_code=link.artifact.qr_code,
                    title=next(
                        (t.title for t in link.artifact.translations if t.language_code == language_code),
                        link.artifact.translations[0].title if link.artifact.translations else link.artifact.qr_code,
                    ),
                    period=link.artifact.period,
                    image_url=link.artifact.image_url,
                ),
            )
            for link in sorted(tour.stops, key=lambda s: s.step_order)
        ]
        summary = self._to_tour_summary(tour, language_code)
        return TourDetail(**summary.model_dump(), stops=stops)

    def create_tour(self, payload: TourCreate) -> TourDetail:
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
