"""
Điểm khởi chạy FastAPI. Chạy dev: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import admin, visitor
from core.config import settings

app = FastAPI(
    title="Museum Audio Guide API",
    description="Backend cho hệ thống thuyết minh tự động đa ngôn ngữ — Bảo tàng TP.HCM",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(visitor.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health_check():
    """Dùng cho load balancer / CI health-check sau khi deploy."""
    return {"status": "ok", "env": settings.ENV}
