"""
Router công khai — dùng bởi website (desktop) và sau này là app mobile (React Native).
Không yêu cầu đăng nhập.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.dependencies import get_language
from core.database import get_db
from core.exceptions import NotFoundError
from domain.schemas import (
    ArtifactDetail,
    ArtifactSummary,
    PlayLogCreate,
    PlayLogOut,
    RoomDetail,
    RoomOut,
    TourDetail,
    TourSummary,
)
from services.audio_service import AudioService
from services.map_service import MapService

router = APIRouter(tags=["visitor"])


# ---------- Hiện vật & thuyết minh ----------

@router.get("/artifacts", response_model=list[ArtifactSummary])
def search_artifacts(
    q: str | None = Query(None, description="Từ khoá tìm theo mã QR hoặc tên hiện vật"),
    lang: str = Depends(get_language),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Dùng cho trang Tra cứu hiện vật (ArtifactLookup.jsx)."""
    return AudioService(db).search(q, lang, skip, limit)


@router.get("/artifacts/lookup/{qr_code}", response_model=ArtifactDetail)
def lookup_artifact_by_qr(qr_code: str, lang: str = Depends(get_language), db: Session = Depends(get_db)):
    """
    Luồng chính: quét mã QR (mobile) hoặc nhập mã thủ công (web) -> trả về chi tiết + audio.
    """
    try:
        return AudioService(db).lookup_by_qr_code(qr_code, lang)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/artifacts/{artifact_id}", response_model=ArtifactDetail)
def get_artifact(artifact_id: str, lang: str = Depends(get_language), db: Session = Depends(get_db)):
    """Dùng cho trang chi tiết hiện vật (ArtifactDetail.jsx) khi đã biết id."""
    try:
        return AudioService(db).get_detail(artifact_id, lang)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/play-logs", response_model=PlayLogOut, status_code=status.HTTP_201_CREATED)
def log_play(payload: PlayLogCreate, db: Session = Depends(get_db)):
    """Frontend gọi mỗi khi bắt đầu/kết thúc phát audio, phục vụ thống kê CMS."""
    try:
        return AudioService(db).log_play(payload)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


# ---------- Phòng & bản đồ ----------

@router.get("/rooms", response_model=list[RoomOut])
def list_rooms(db: Session = Depends(get_db)):
    return MapService(db).list_rooms()


@router.get("/rooms/{room_id}", response_model=RoomDetail)
def get_room(room_id: str, lang: str = Depends(get_language), db: Session = Depends(get_db)):
    try:
        return MapService(db).get_room(room_id, lang)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/map/nearby", response_model=ArtifactSummary | None)
def find_nearby_artifact(
    lat: float,
    lng: float,
    lang: str = Depends(get_language),
    db: Session = Depends(get_db),
):
    """
    Dành cho bản mobile (React Native) sau này: tự động phát hiện hiện vật gần nhất
    dựa trên GPS (trigger_method = 'GEOFENCE'), không cần khách quét QR thủ công.
    """
    return MapService(db).find_nearest_artifact(lat, lng, lang)


# ---------- Tuyến tham quan ----------

@router.get("/tours", response_model=list[TourSummary])
def list_tours(lang: str = Depends(get_language), db: Session = Depends(get_db)):
    return MapService(db).list_tours(lang)


@router.get("/tours/{tour_id}", response_model=TourDetail)
def get_tour(tour_id: str, lang: str = Depends(get_language), db: Session = Depends(get_db)):
    try:
        return MapService(db).get_tour(tour_id, lang)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
