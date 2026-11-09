"""
Tầng truy xuất dữ liệu cho Room. Tách riêng khỏi artifact_repo.py vì được dùng
chủ yếu bởi map_service.py (danh sách phòng, kiểm tra phòng của POI), không phải audio_service.py.
"""
from sqlalchemy.orm import Session

from domain.entities import Room


class RoomRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, room_id: str) -> Room | None:
        return (
            self.db.query(Room)
            .filter(Room.id == room_id)
            .first()
        )

    def get_by_code(self, code: str) -> Room | None:
        return self.db.query(Room).filter(Room.code == code).first()

    def list_all(self) -> list[Room]:
        return self.db.query(Room).order_by(Room.code).all()

    def create(self, room: Room) -> Room:
        self.db.add(room)
        self.db.commit()
        self.db.refresh(room)
        return room

    def update(self, room: Room) -> Room:
        self.db.commit()
        self.db.refresh(room)
        return room

    def delete(self, room: Room) -> None:
        self.db.delete(room)
        self.db.commit()
