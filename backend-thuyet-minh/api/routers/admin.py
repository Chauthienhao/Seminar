"""
Router CMS — quản trị hiện vật/điểm tham quan (POI)/tuyến tham quan/phòng, xem thống kê.
Toàn bộ endpoint (trừ /admin/login) yêu cầu JWT hợp lệ qua `get_current_user`.
"""
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from api.dependencies import get_current_user
from core.database import get_db
from core.exceptions import ConflictError, InvalidCredentialsError, InvalidDataError, NotFoundError
from domain.schemas import (
    ArtifactAdminOut,
    ArtifactCreate,
    ArtifactDetail,
    ArtifactPlayStat,
    ArtifactTranslationAdminOut,
    ArtifactTranslationIn,
    ArtifactTranslationUpdate,
    ArtifactUpdate,
    LoginRequest,
    OnlineStat,
    PoiCreate,
    PoiDetail,
    PoiUpdate,
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
from services import presence_service
from services.audio_service import AudioService
from services.auth_service import AuthService
from services.map_service import MapService
from services.upload_service import MAX_IMAGE_BYTES, save_artifact_image

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
    q: str | None = Query(None, description="Tìm theo mã hiện vật hoặc tiêu đề (mọi ngôn ngữ)"),
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
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


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
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


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


# ---------- Tải ảnh hiện vật ----------

@router.post("/uploads/image", status_code=status.HTTP_201_CREATED)
def upload_artifact_image(
    file: UploadFile = File(...),
    _: UserOut = Depends(get_current_user),
):
    """
    Nhận 1 file ảnh, lưu vào backend-thuyet-minh/uploads/artifacts/ và trả về đường dẫn,
    VD {"url": "/uploads/artifacts/3f9c...e1.jpg"}. Form hiện vật điền đường dẫn này vào
    image_url rồi lưu như bình thường — DB chỉ lưu đường dẫn, không lưu file.
    """
    data = file.file.read(MAX_IMAGE_BYTES + 1)  # đọc dư 1 byte để biết file có vượt giới hạn không
    try:
        return {"url": save_artifact_image(data)}
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


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
    """Phòng còn POI sẽ bị từ chối (409) — phải chuyển hoặc xoá hết POI trước."""
    try:
        MapService(db).delete_room(room_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))


# ---------- Quản trị điểm tham quan (POI) ----------

@router.get("/pois", response_model=list[PoiDetail])
def list_pois_for_admin(
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Mọi POI (kể cả POI chưa có GPS) kèm các hiện vật đặt tại đó."""
    return MapService(db).list_pois()


@router.post("/pois", response_model=PoiDetail, status_code=status.HTTP_201_CREATED)
def create_poi(
    payload: PoiCreate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    try:
        return MapService(db).create_poi(payload)
    except ConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/pois/{poi_id}", response_model=PoiDetail)
def update_poi(
    poi_id: str,
    payload: PoiUpdate,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Mã POI (in trên QR) không sửa được — PoiUpdate không có trường `code`."""
    try:
        return MapService(db).update_poi(poi_id, payload)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except InvalidDataError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/pois/{poi_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poi(
    poi_id: str,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """POI còn hiện vật sẽ bị từ chối (409) — phải chuyển hoặc xoá hết hiện vật trước."""
    try:
        MapService(db).delete_poi(poi_id)
    except NotFoundError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except ConflictError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))


# ---------- Quản trị tuyến tham quan ----------

@router.get("/tours", response_model=list[TourAdminOut])
def list_tours_for_admin(
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Khác /api/tours phía khách: trả cả tiêu đề/mô tả vi + en để đổ vào form sửa."""
    return MapService(db).list_tours_for_admin()


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
    Gửi `poi_ids_in_order` để sắp xếp lại / thêm / bớt điểm dừng (thứ tự trong list
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

@router.get("/stats/top-played", response_model=list[ArtifactPlayStat])
def top_played_artifacts(
    lang: str = "vi",
    limit: int = 10,
    db: Session = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    return AudioService(db).top_played(lang, limit)


@router.get("/stats/online", response_model=OnlineStat)
def online_devices(_: UserOut = Depends(get_current_user)):
    """Số thiết bị (trình duyệt) đang mở website khách tham quan."""
    return OnlineStat(
        online_devices=presence_service.count_online(),
        window_seconds=presence_service.ONLINE_WINDOW_SECONDS,
    )
