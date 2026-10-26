"""
tts-service — microservice độc lập, chỉ làm một việc: tổng hợp giọng nói (TTS).
Backend chính (backend-thuyet-minh) gọi sang service này qua HTTP khi hiện vật
chưa có file audio thu sẵn. Đây là phần thể hiện yêu cầu đề tài:
"BE Dev tạo các services giao tiếp với nhau bao gồm CD/CI".

Chạy dev: uvicorn app.main:app --reload --port 8001
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.config import settings
from app.synthesizer import synthesize

SUPPORTED_LANGUAGES = {"vi", "en"}

app = FastAPI(
    title="TTS Service",
    description="Microservice tổng hợp giọng nói đa ngôn ngữ cho hệ thống thuyết minh tự động",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "env": settings.ENV}


@app.get("/synthesize", tags=["tts"])
def synthesize_speech(
    text: str = Query(..., min_length=1, max_length=2000, description="Nội dung cần đọc"),
    lang: str = Query("vi", description="Mã ngôn ngữ: vi hoặc en"),
):
    """
    Trả trực tiếp file MP3 (audio/mpeg). Backend chính chỉ cần trả URL dạng
    `{TTS_SERVICE_URL}/synthesize?text=...&lang=...` cho frontend, trình phát
    audio (thẻ <audio>) gọi thẳng URL này để stream, không cần qua backend chính.
    """
    if lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Ngôn ngữ '{lang}' chưa được hỗ trợ")

    try:
        audio_bytes = synthesize(text, lang)
    except Exception as exc:  # gTTS có thể lỗi khi mất mạng hoặc bị giới hạn tốc độ
        raise HTTPException(status_code=502, detail=f"Không thể tổng hợp giọng nói: {exc}")

    return Response(content=audio_bytes, media_type="audio/mpeg")
