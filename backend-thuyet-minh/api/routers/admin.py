"""
Router CMS — quản trị hiện vật/tuyến tham quan/phòng, xem thống kê.
Toàn bộ endpoint (trừ /admin/login) yêu cầu JWT hợp lệ qua `get_current_user`.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from core.database import get_db
from core.exceptions import ConflictError, InvalidCredentialsError, NotFoundError
from domain.schemas import (
    ArtifactCreate,
    ArtifactDetail,
    ArtifactPlayStat,
    ArtifactUpdate,
    LoginRequest,
    RoomCreate,
    RoomOut,
    TokenResponse,
    TourCreate,
    TourDetail,
    UserOut,
)
from services.audio_service import AudioService
from services.auth_service import AuthService
from services.map_service import MapService

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


# ---------- Quản trị phòng ----------

@router.post("/rooms", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    return MapService(db).create_room(payload)


# ---------- Quản trị tuyến tham quan ----------

@router.post("/tours", response_model=TourDetail, status_code=status.HTTP_201_CREATED)
def create_tour(
    payload: TourCreate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    return MapService(db).create_tour(payload)


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

@router.get("/stats/top-played", response_model=list[ArtifactPlayStat])
def top_played_artifacts(
    lang: str = "vi",
    limit: int = 10,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    return AudioService(db).top_played(lang, limit)
