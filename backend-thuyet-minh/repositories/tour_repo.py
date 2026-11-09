"""
Tầng truy xuất dữ liệu cho Tour / TourPoi (lộ trình tham quan = chuỗi POI).
Dùng bởi services/map_service.py.
"""
from sqlalchemy.orm import Session, joinedload

from domain.entities import Artifact, Poi, Tour, TourPoi


class TourRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, tour_id: str) -> Tour | None:
        return (
            self.db.query(Tour)
            .options(
                joinedload(Tour.stops).joinedload(TourPoi.poi).joinedload(Poi.artifacts).joinedload(Artifact.translations),
                joinedload(Tour.stops).joinedload(TourPoi.poi).joinedload(Poi.room),
            )
            .filter(Tour.id == tour_id)
            .first()
        )

    def list_all(self, skip: int = 0, limit: int = 50) -> list[Tour]:
        return (
            self.db.query(Tour)
            .options(joinedload(Tour.stops))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, tour: Tour) -> Tour:
        self.db.add(tour)
        self.db.commit()
        self.db.refresh(tour)
        return tour

    def update(self, tour: Tour) -> Tour:
        self.db.commit()
        self.db.refresh(tour)
        return tour

    def delete(self, tour: Tour) -> None:
        self.db.delete(tour)
        self.db.commit()

    def add_stop(self, stop: TourPoi) -> TourPoi:
        self.db.add(stop)
        self.db.commit()
        self.db.refresh(stop)
        return stop

    def replace_stops(self, tour: Tour, stops: list[TourPoi]) -> Tour:
        """
        Thay toàn bộ lộ trình trong MỘT lần commit — nếu lỗi giữa chừng thì tour giữ
        nguyên lộ trình cũ, không bị mất một nửa điểm dừng.
        """
        tour.stops.clear()  # cascade delete-orphan sẽ xoá các dòng tour_pois cũ
        self.db.flush()
        tour.stops.extend(stops)
        self.db.commit()
        self.db.refresh(tour)
        return tour
