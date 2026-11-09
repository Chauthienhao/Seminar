"""
Business logic cho vị trí trong bảo tàng: phòng (rooms), điểm tham quan (pois),
tuyến tham quan (tours = chuỗi POI), bản đồ và định vị POI gần nhất theo GPS (geofence —
dùng cho bản mobile sau này, khớp cột lat/lng/geofence_radius trong bảng `pois`).
"""
import math
import uuid

from sqlalchemy.orm import Session

from core.exceptions import ConflictError, InvalidDataError, NotFoundError
from domain.entities import Artifact, Poi, Room, Tour, TourPoi
from domain.schemas import (
    ArtifactSummary,
    PoiCreate,
    PoiDetail,
    PoiOut,
    PoiUpdate,
    RoomCreate,
    RoomOut,
    RoomUpdate,
    TourAdminOut,
    TourCreate,
    TourDetail,
    TourStop,
    TourSummary,
    TourUpdate,
)
from repositories.poi_repo import PoiRepository
from repositories.room_repo import RoomRepository
from repositories.tour_repo import TourRepository


def artifact_summary(artifact: Artifact, language_code: str, with_description: bool = False) -> ArtifactSummary:
    """Tóm tắt hiện vật theo ngôn ngữ; thiếu bản dịch thì lấy bản khác, không có bản nào thì dùng mã."""
    translation = next(
        (t for t in artifact.translations if t.language_code == language_code),
        artifact.translations[0] if artifact.translations else None,
    )
    description = None
    if with_description and translation and translation.transcript:
        description = " ".join(translation.transcript.split())
        if len(description) > 220:
            description = description[:217].rstrip() + "..."
    return ArtifactSummary(
        id=artifact.id,
        code=artifact.code,
        title=translation.title if translation else artifact.code,
        period=artifact.period,
        image_url=artifact.image_url,
        description=description,
    )


def poi_detail(poi: Poi, language_code: str, with_description: bool = False) -> PoiDetail:
    """POI kèm danh sách hiện vật đặt tại đó (sắp theo mã hiện vật)."""
    artifacts = sorted(poi.artifacts, key=lambda a: a.code)
    return PoiDetail(
        **PoiOut.model_validate(poi).model_dump(),
        artifacts=[artifact_summary(a, language_code, with_description) for a in artifacts],
    )


class MapService:
    def __init__(self, db: Session):
        self.db = db
        self.rooms = RoomRepository(db)
        self.tours = TourRepository(db)
        self.pois = PoiRepository(db)

    # ---------- Rooms ----------

    def list_rooms(self) -> list[RoomOut]:
        return [RoomOut.model_validate(r) for r in self.rooms.list_all()]

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
        """Chỉ xoá được phòng trống; phòng còn POI phải chuyển hoặc xoá hết POI trước."""
        room = self.rooms.get_by_id(room_id)
        if room is None:
            raise NotFoundError(f"Không tìm thấy phòng id={room_id}")
        if room.pois:
            raise ConflictError(
                f"Không thể xoá phòng {room.code}: còn {len(room.pois)} điểm tham quan (POI). "
                "Hãy chuyển hoặc xoá các POI này trước."
            )
        self.rooms.delete(room)

    # ---------- POI ----------

    def list_pois(self, language_code: str = "vi") -> list[PoiDetail]:
        return [poi_detail(p, language_code) for p in self.pois.list_all()]

    def lookup_poi(self, code: str, language_code: str = "vi") -> PoiDetail:
        """Luồng chính khi quét mã QR: mã trong QR là mã của POI."""
        poi = self.pois.get_by_code(code)
        if poi is None:
            raise NotFoundError(f"Không tìm thấy điểm tham quan với mã '{code}'")
        return poi_detail(poi, language_code)

    def create_poi(self, payload: PoiCreate) -> PoiDetail:
        if self.pois.get_by_code(payload.code) is not None:
            raise ConflictError(f"Mã POI '{payload.code}' đã tồn tại")
        self._validate_room(payload.room_id)
        created = self.pois.create(Poi(id=str(uuid.uuid4()), **payload.model_dump()))
        return poi_detail(created, "vi")

    def update_poi(self, poi_id: str, payload: PoiUpdate) -> PoiDetail:
        poi = self._get_poi_or_raise(poi_id)
        fields = payload.model_dump(exclude_unset=True)
        if "room_id" in fields:
            self._validate_room(fields["room_id"])
        for field, value in fields.items():
            setattr(poi, field, value)
        return poi_detail(self.pois.update(poi), "vi")

    def delete_poi(self, poi_id: str) -> None:
        """POI còn hiện vật thì không xoá được (artifacts.poi_id là khoá ngoại RESTRICT)."""
        poi = self._get_poi_or_raise(poi_id)
        if poi.artifacts:
            raise ConflictError(
                f"Không thể xoá POI {poi.code}: còn {len(poi.artifacts)} hiện vật. "
                "Hãy chuyển các hiện vật sang POI khác hoặc xoá chúng trước."
            )
        self.pois.delete(poi)

    def list_map_pois(self, language_code: str = "vi") -> list[PoiDetail]:
        """Mỗi POI có GPS hợp lệ là một ghim trên bản đồ, kèm các hiện vật tại đó."""
        return [
            poi_detail(p, language_code, with_description=True)
            for p in self.pois.list_with_location()
            if math.isfinite(p.lat) and math.isfinite(p.lng)
        ]

    # ---------- Geofence: tìm POI gần nhất theo toạ độ GPS ----------

    def find_nearest_poi(self, lat: float, lng: float, language_code: str = "vi") -> PoiDetail | None:
        """
        Dùng công thức Haversine để tính khoảng cách thật (mét) giữa vị trí khách tham
        quan và từng POI, rồi chỉ nhận POI nằm trong bán kính `geofence_radius` của chính nó.
        Trả về POI gần nhất nếu có nhiều điểm cùng thoả điều kiện.
        """
        best, best_distance = None, None
        for poi in self.pois.find_nearby(lat, lng):
            distance_m = self._haversine_meters(lat, lng, poi.lat, poi.lng)
            if distance_m <= (poi.geofence_radius or 10):
                if best_distance is None or distance_m < best_distance:
                    best, best_distance = poi, distance_m
        return poi_detail(best, language_code) if best else None

    @staticmethod
    def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        radius_earth_m = 6_371_000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lng2 - lng1)
        a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        return 2 * radius_earth_m * math.asin(math.sqrt(a))

    # ---------- Tours ----------

    def list_tours(self, language_code: str = "vi") -> list[TourSummary]:
        return [self._to_tour_summary(t, language_code) for t in self.tours.list_all()]

    def get_tour(self, tour_id: str, language_code: str = "vi") -> TourDetail:
        tour = self._get_tour_or_raise(tour_id)
        summary = self._to_tour_summary(tour, language_code)
        return TourDetail(**summary.model_dump(), stops=self._to_tour_stops(tour, language_code))

    def create_tour(self, payload: TourCreate) -> TourDetail:
        self._validate_stop_ids(payload.poi_ids_in_order)
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

        for order, poi_id in enumerate(payload.poi_ids_in_order, start=1):
            self.tours.add_stop(TourPoi(tour_id=created.id, poi_id=poi_id, step_order=order))

        return self.get_tour(created.id, "vi")

    def list_tours_for_admin(self) -> list[TourAdminOut]:
        return [self._to_tour_admin(t) for t in self.tours.list_all()]

    def update_tour(self, tour_id: str, payload: TourUpdate) -> TourAdminOut:
        tour = self._get_tour_or_raise(tour_id)

        fields = payload.model_dump(exclude_unset=True)
        new_order = fields.pop("poi_ids_in_order", None)
        for field, value in fields.items():
            setattr(tour, field, value)

        if new_order is None:
            tour = self.tours.update(tour)
        else:
            self._validate_stop_ids(new_order)
            stops = [
                TourPoi(tour_id=tour.id, poi_id=poi_id, step_order=order)
                for order, poi_id in enumerate(new_order, start=1)
            ]
            tour = self.tours.replace_stops(tour, stops)

        return self._to_tour_admin(tour)

    def delete_tour(self, tour_id: str) -> None:
        self.tours.delete(self._get_tour_or_raise(tour_id))

    # ---------- Nội bộ ----------

    def _validate_room(self, room_id: str | None) -> None:
        """Mỗi POI bắt buộc thuộc một phòng đang tồn tại (pois.room_id NOT NULL + khoá ngoại)."""
        if not room_id:
            raise InvalidDataError("POI bắt buộc phải thuộc một phòng")
        if self.rooms.get_by_id(room_id) is None:
            raise InvalidDataError(f"Không tìm thấy phòng id={room_id}")

    def _get_poi_or_raise(self, poi_id: str) -> Poi:
        poi = self.pois.get_by_id(poi_id)
        if poi is None:
            raise NotFoundError(f"Không tìm thấy POI id={poi_id}")
        return poi

    def _get_tour_or_raise(self, tour_id: str) -> Tour:
        tour = self.tours.get_by_id(tour_id)
        if tour is None:
            raise NotFoundError(f"Không tìm thấy tuyến tham quan id={tour_id}")
        return tour

    def _validate_stop_ids(self, poi_ids: list[str]) -> None:
        if len(poi_ids) != len(set(poi_ids)):
            raise InvalidDataError("Một POI chỉ được xuất hiện một lần trong lộ trình tour")
        missing = set(poi_ids) - self.pois.existing_ids(poi_ids)
        if missing:
            raise InvalidDataError(f"Không tìm thấy POI trong lộ trình: {', '.join(sorted(missing))}")

    def _to_tour_stops(self, tour: Tour, language_code: str) -> list[TourStop]:
        return [
            TourStop(step_order=link.step_order, poi=poi_detail(link.poi, language_code))
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
