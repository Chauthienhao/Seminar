"""
Tiện ích bảo mật: băm/kiểm tra mật khẩu (bcrypt) và tạo/giải mã JWT.
Dùng cho luồng đăng nhập CMS (bảng `admins`, repo là user_repo.py).
"""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from core.config import settings


def hash_password(plain_password: str) -> str:
    password_bytes = plain_password.encode("utf-8")[:72]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))
    except ValueError:
        # password_hash trong DB không phải bcrypt hash hợp lệ (ví dụ còn để
        # placeholder 'REPLACE_WITH_REAL_BCRYPT_HASH' từ seed_data.sql)
        return False


def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    """Tạo JWT access token. `subject` là user.id (chuỗi UUID)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": subject, "exp": expire}
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
