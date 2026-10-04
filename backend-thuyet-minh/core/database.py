from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,   # tự kiểm tra kết nối "chết" trước khi dùng (tránh lỗi khi MySQL idle-timeout)
    pool_recycle=3600,
    echo=(settings.ENV == "development"),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency dùng trong FastAPI route: mở session, trả về, và luôn đóng lại sau khi xong request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
