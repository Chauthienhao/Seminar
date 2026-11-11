"""
Đếm số thiết bị đang truy cập website (dùng cho thẻ "Đang truy cập" ở trang Tổng quan CMS).

Cách hoạt động (heartbeat):
- Mỗi trình duyệt của khách có một `device_id` ngẫu nhiên (lưu localStorage, xem src/lib/presence.js).
  Nhiều tab trên cùng một máy dùng chung id nên chỉ tính là 1 thiết bị.
- Trong lúc khách mở web, frontend gửi POST /api/presence/heartbeat mỗi 30 giây.
- Thiết bị được coi là "đang truy cập" nếu gửi heartbeat trong ONLINE_WINDOW_SECONDS gần nhất.

Dữ liệu chỉ nằm trong RAM (không ghi DB): khởi động lại backend thì số đếm về 0 rồi tự đầy lại
sau tối đa 30 giây. Cách này đủ cho backend chạy 1 tiến trình uvicorn như hiện tại.
"""
import time
from threading import Lock

ONLINE_WINDOW_SECONDS = 75   # > 2 lần chu kỳ heartbeat (30s) để không bị nhảy số khi mạng chậm
MAX_TRACKED_DEVICES = 10_000  # chặn việc bị gửi id rác làm đầy bộ nhớ

_last_seen: dict[str, float] = {}
_lock = Lock()


def _prune(now: float) -> None:
    cutoff = now - ONLINE_WINDOW_SECONDS
    for device_id in [d for d, t in _last_seen.items() if t < cutoff]:
        del _last_seen[device_id]


def heartbeat(device_id: str) -> None:
    now = time.monotonic()
    with _lock:
        _prune(now)
        if device_id in _last_seen or len(_last_seen) < MAX_TRACKED_DEVICES:
            _last_seen[device_id] = now


def count_online() -> int:
    with _lock:
        _prune(time.monotonic())
        return len(_last_seen)
