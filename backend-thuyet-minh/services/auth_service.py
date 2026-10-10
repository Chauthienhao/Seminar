"""
Business logic đăng nhập CMS (bảng `admins`, repo là user_repo.py).
"""
from sqlalchemy.orm import Session

from core.exceptions import InvalidCredentialsError
from core.security import create_access_token, verify_password
from domain.schemas import LoginRequest, TokenResponse, UserOut
from repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.users.get_by_username(payload.username)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise InvalidCredentialsError("Sai tên đăng nhập hoặc mật khẩu")

        self.users.update_last_login(user)
        token = create_access_token(subject=user.id, extra_claims={"role": user.role})
        return TokenResponse(access_token=token)

    def get_current_user(self, user_id: str) -> UserOut:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError("Tài khoản không tồn tại hoặc token không hợp lệ")
        return UserOut.model_validate(user)
