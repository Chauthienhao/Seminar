import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000",
    )
    CACHE_MAX_ITEMS: int = int(os.getenv("CACHE_MAX_ITEMS", "200"))
    ENV: str = os.getenv("ENV", "development")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
