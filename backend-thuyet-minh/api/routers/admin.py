"""
Router CMS — quản trị hiện vật/tuyến tham quan/phòng, xem thống kê.
Toàn bộ endpoint (trừ /admin/login) yêu cầu JWT hợp lệ qua `get_current_user`.
"""
from datetime import date, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from core.database import get_db
from core.exceptions import ConflictError, InvalidCredentialsError, InvalidDataError, NotFoundError
from domain.schemas import (
    AnalyticsDashboard,
    ArtifactAdminOut,
    ArtifactCreate,
    ArtifactDetail,
    ArtifactPlayStat,
    ArtifactTranslationAdminOut,
    ArtifactTranslationIn,
    ArtifactTranslationUpdate,
    ArtifactUpdate,
    LoginRequest,
    RoomCreate,
    RoomOut,
    RoomUpdate,
    TokenResponse,
    TourAdminOut,
    TourCreate,
    TourDetail,
    TourUpdate,
    UserOut,
)
from services.audio_service import AudioService
from services.auth_service import AuthService
from services.map_service import MapService
from services.analytics_service import AnalyticsService

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- Đăng nhập ----------

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService(db).login(payload)
    except InvalidCredentialsError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/me", response_model=UserOut)
def get_me(current_user: UserOut = Depends(get_current_user)):
    return current_user


# ---------- Quản trị hiện vật ----------

@router.get("/artifacts", response_model=list[ArtifactAdminOut])
def list_artifacts_for_admin(
    q: str | None = Query(None, description="Tìm theo mã QR hoặc tiêu đề (mọi ngôn ngữ)"),
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Danh sách hiện vật cho CMS — gồm cả hiện vật chưa có bản dịch, kèm mọi bản dịch."""
    return AudioService(db).list_for_admin(q, skip, limit)


@router.get("/artifacts/{artifact_id}", response_model=ArtifactAdminOut)
def get_artifact_for_admin(
    artifact_id: str,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return AudioService(db).get_for_admin(artifact_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/artifacts", response_model=ArtifactDetail, status_code=status.HTTP_201_CREATED)
def create_artifact(
    payload: ArtifactCreate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return AudioService(db).create_artifact(payload)
    except ConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))


@router.put("/artifacts/{artifact_id}", response_model=ArtifactDetail)
def update_artifact(
    artifact_id: str,
    payload: ArtifactUpdate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return AudioService(db).update_artifact(artifact_id, payload)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/artifacts/{artifact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_artifact(
    artifact_id: str,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        AudioService(db).delete_artifact(artifact_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


# ---------- Quản trị bản dịch của hiện vật ----------

@router.post(
    "/artifacts/{artifact_id}/translations",
    response_model=ArtifactTranslationAdminOut,
    status_code=status.HTTP_201_CREATED,
)
def add_translation(
    artifact_id: str,
    payload: ArtifactTranslationIn,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return AudioService(db).add_translation(artifact_id, payload)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/artifacts/{artifact_id}/translations/{language_code}", response_model=ArtifactTranslationAdminOut)
def update_translation(
    artifact_id: str,
    language_code: str,
    payload: ArtifactTranslationUpdate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return AudioService(db).update_translation(artifact_id, language_code, payload)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/artifacts/{artifact_id}/translations/{language_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_translation(
    artifact_id: str,
    language_code: str,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        AudioService(db).delete_translation(artifact_id, language_code)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


# ---------- Quản trị phòng ----------

@router.post("/rooms", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return MapService(db).create_room(payload)
    except ConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))


@router.put("/rooms/{room_id}", response_model=RoomOut)
def update_room(
    room_id: str,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return MapService(db).update_room(room_id, payload)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: str,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Hiện vật trong phòng không bị xoá, chỉ chuyển sang trạng thái chưa xếp phòng."""
    try:
        MapService(db).delete_room(room_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


# ---------- Quản trị tuyến tham quan ----------

@router.get("/tours", response_model=list[TourAdminOut])
def list_tours_for_admin(
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Khác /api/tours phía khách: trả cả tiêu đề/mô tả vi + en để đổ vào form sửa."""
    return MapService(db).list_tours_for_admin()


@router.get("/tours/{tour_id}", response_model=TourAdminOut)
def get_tour_for_admin(
    tour_id: str,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return MapService(db).get_tour_for_admin(tour_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/tours", response_model=TourDetail, status_code=status.HTTP_201_CREATED)
def create_tour(
    payload: TourCreate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return MapService(db).create_tour(payload)
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/tours/{tour_id}", response_model=TourAdminOut)
def update_tour(
    tour_id: str,
    payload: TourUpdate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """
    Gửi `artifact_ids_in_order` để sắp xếp lại / thêm / bớt điểm dừng (thứ tự trong list
    = step_order). Bỏ trống trường này nếu chỉ sửa tiêu đề, mô tả...
    """
    try:
        return MapService(db).update_tour(tour_id, payload)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/tours/{tour_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tour(
    tour_id: str,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        MapService(db).delete_tour(tour_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))


# ---------- Thống kê ----------

@router.get("/stats/dashboard", response_model=AnalyticsDashboard)
def analytics_dashboard(
    start_date: date | None = None,
    end_date: date | None = None,
    lang: Literal["vi", "en"] = "vi",
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    end = end_date or date.today()
    start = start_date or end - timedelta(days=29)
    if start > end or (end - start).days > 365:
        raise HTTPException(422, detail="Khoảng ngày phải theo thứ tự và không quá 366 ngày")
    return AnalyticsService(db).dashboard(start, end, lang)

@router.get("/stats/top-played", response_model=list[ArtifactPlayStat])
def top_played_artifacts(
    lang: str = "vi",
    limit: int = 10,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    return AudioService(db).top_played(lang, limit)
