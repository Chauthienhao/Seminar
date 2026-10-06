"""
Tầng truy xuất dữ liệu cho User (bảng `admins` — tài khoản quản trị CMS).
Dùng bởi services/auth_service.py.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from domain.entities import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_last_login(self, user: User) -> User:
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        return user
