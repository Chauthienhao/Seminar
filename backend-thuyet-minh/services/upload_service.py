"""
Lưu ảnh hiện vật do admin tải lên.

- File ảnh nằm trong thư mục  backend-thuyet-minh/uploads/artifacts/
- Database (artifacts.image_url) chỉ lưu đường dẫn, VD  /uploads/artifacts/3f9c...e1.jpg
- main.py mount thư mục uploads/ tại /uploads nên trình duyệt mở được đường dẫn đó.
"""
import uuid
from pathlib import Path

from core.exceptions import InvalidDataError

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"   # backend-thuyet-minh/uploads
ARTIFACT_IMAGE_DIR = UPLOAD_ROOT / "artifacts"
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB


def _image_extension(data: bytes) -> str | None:
    """Nhận dạng ảnh bằng vài byte đầu file, không tin tên file do người dùng đặt."""
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return None


def save_artifact_image(data: bytes) -> str:
    """Ghi ảnh vào uploads/artifacts/ với tên ngẫu nhiên, trả về đường dẫn để lưu vào DB."""
    if len(data) > MAX_IMAGE_BYTES:
        raise InvalidDataError("Ảnh quá lớn, tối đa 5MB")
    extension = _image_extension(data)
    if extension is None:
        raise InvalidDataError("Chỉ nhận ảnh JPG, PNG hoặc WEBP")

    ARTIFACT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    filename = uuid.uuid4().hex + extension
    (ARTIFACT_IMAGE_DIR / filename).write_bytes(data)
    return f"/uploads/artifacts/{filename}"


def delete_uploaded_file(url: str | None) -> None:
    """Xoá file đã upload khi đổi ảnh / xoá hiện vật. Link ảnh ngoài (https://...) thì bỏ qua."""
    if not url or not url.startswith("/uploads/"):
        return
    path = (UPLOAD_ROOT / url.removeprefix("/uploads/")).resolve()
    # Chặn đường dẫn kiểu /uploads/../main.py: chỉ được xoá file nằm trong thư mục uploads
    if UPLOAD_ROOT.resolve() not in path.parents:
        return
    path.unlink(missing_ok=True)
