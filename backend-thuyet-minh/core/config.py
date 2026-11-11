"""
Cấu hình ứng dụng — đọc từ biến môi trường (.env).
Đây là nơi DUY NHẤT nên đọc os.getenv; các module khác import `settings` từ đây
để tránh việc mỗi file tự đọc env riêng lẻ (dễ bị lệch giá trị giữa các module).
"""
import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # --- Database (khớp với DB.sql) ---
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "123456")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "museum_audio_guide")

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # --- JWT cho đăng nhập CMS (bảng admins/users) ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

    # --- CORS: domain frontend được phép gọi API, cách nhau bởi dấu phẩy ---
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    # --- Service TTS/audio riêng biệt (nếu tách microservice) ---
    TTS_SERVICE_URL: str = os.getenv("TTS_SERVICE_URL", "http://localhost:8001")
    # Địa chỉ TTS mà TRÌNH DUYỆT của khách dùng để phát audio (khác TTS_SERVICE_URL là địa chỉ nội bộ).
    # Mặc định '/tts': đi qua proxy của Vite (cùng origin), nên chạy được cả khi public qua
    # Tailscale/https. Nếu để http://localhost:8001 thì máy khác sẽ không phát được audio.
    TTS_PUBLIC_URL: str = os.getenv("TTS_PUBLIC_URL", "/tts").rstrip("/")

    ENV: str = os.getenv("ENV", "development")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
