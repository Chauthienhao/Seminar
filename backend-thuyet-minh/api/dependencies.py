"""
Dependency dùng chung cho các router: lấy DB session, xác thực JWT, kiểm tra vai trò.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import decode_access_token
from domain.schemas import UserOut
from repositories.user_repo import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserOut:
    """Bắt buộc phải có JWT hợp lệ trong header Authorization: Bearer <token>."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Thiếu token đăng nhập")

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Token không hợp lệ hoặc đã hết hạn")

    user = UserRepository(db).get_by_id(payload["sub"])
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Tài khoản không tồn tại")

    return UserOut.model_validate(user)


def require_super_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    """Dùng cho các thao tác nhạy cảm (VD: tạo tài khoản admin khác)."""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Chỉ SUPER_ADMIN được thực hiện thao tác này")
    return current_user


def get_language(lang: str = "vi") -> str:
    """Chuẩn hoá query param ?lang=vi|en dùng chung cho mọi endpoint công khai."""
    return lang if lang in ("vi", "en") else "vi"
