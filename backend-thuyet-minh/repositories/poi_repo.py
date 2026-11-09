"""
Tầng truy xuất dữ liệu cho Poi (điểm tham quan). Dùng bởi services/map_service.py.
Khi đọc POI luôn nạp sẵn phòng + các hiện vật (kèm bản dịch) đặt tại POI đó.
"""
from sqlalchemy.orm import Session, joinedload

from domain.entities import Artifact, Poi


class PoiRepository:
    def __init__(self, db: Session):
        self.db = db

    def _query(self):
        return self.db.query(Poi).options(
            joinedload(Poi.room),
            joinedload(Poi.artifacts).joinedload(Artifact.translations),
        )

    def get_by_id(self, poi_id: str) -> Poi | None:
        return self._query().filter(Poi.id == poi_id).first()

    def get_by_code(self, code: str) -> Poi | None:
        return self._query().filter(Poi.code == code).first()

    def list_all(self) -> list[Poi]:
        return self._query().order_by(Poi.code).all()

    def list_with_location(self) -> list[Poi]:
        """Mọi POI có GPS hợp lệ — dùng cho bản đồ (không phân trang để không mất ghim)."""
        return (
            self._query()
            .filter(
                Poi.lat.isnot(None),
                Poi.lng.isnot(None),
                Poi.lat.between(-90, 90),
                Poi.lng.between(-180, 180),
            )
            .order_by(Poi.code)
            .all()
        )

    def find_nearby(self, lat: float, lng: float) -> list[Poi]:
        """
        Lọc thô các POI quanh (lat, lng) bằng bounding box ~1km; khoảng cách chính xác
        (Haversine) được tính ở tầng service vì MySQL không có hàm khoảng cách sẵn.
        """
        delta = 0.01
        return (
            self._query()
            .filter(
                Poi.lat.between(lat - delta, lat + delta),
                Poi.lng.between(lng - delta, lng + delta),
            )
            .all()
        )

    def existing_ids(self, poi_ids: list[str]) -> set[str]:
        """Trả về những id trong danh sách thực sự tồn tại — dùng để kiểm tra lộ trình tour."""
        if not poi_ids:
            return set()
        rows = self.db.query(Poi.id).filter(Poi.id.in_(poi_ids)).all()
        return {row.id for row in rows}

    def create(self, poi: Poi) -> Poi:
        self.db.add(poi)
        self.db.commit()
        return self.get_by_id(poi.id)

    def update(self, poi: Poi) -> Poi:
        self.db.commit()
        self.db.refresh(poi)
        return poi

    def delete(self, poi: Poi) -> None:
        self.db.delete(poi)
        self.db.commit()
