"""
Exception dùng chung cho tầng service. Router (api/routers/*.py) sẽ bắt các lỗi này
và chuyển thành HTTPException phù hợp — service KHÔNG được biết gì về FastAPI/HTTP.
"""


class NotFoundError(Exception):
    """Không tìm thấy bản ghi (hiện vật, tour, phòng, user...)."""


class ConflictError(Exception):
    """Vi phạm ràng buộc duy nhất, ví dụ trùng mã QR hoặc trùng username."""


class InvalidCredentialsError(Exception):
    """Sai username/password khi đăng nhập CMS."""
