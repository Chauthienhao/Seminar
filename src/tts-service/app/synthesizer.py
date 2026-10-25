"""
Lớp tổng hợp giọng nói (TTS). Dùng gTTS làm bản triển khai mặc định vì nhẹ, hỗ trợ
đa ngôn ngữ và không cần huấn luyện mô hình — đúng tinh thần "linh hoạt, đa ngôn ngữ,
dung lượng nhẹ" trong đề tài. Có thể thay bằng engine khác (Google Cloud TTS, Amazon
Polly, edge-tts...) chỉ bằng cách viết lại hàm `synthesize()` bên dưới — phần còn lại
của service (cache, API) không cần đổi.

Lưu ý: gTTS gọi ra ngoài (Google Translate) ở thời điểm chạy, nên cần máy chủ có
Internet. Nếu triển khai trong mạng nội bộ không có Internet, hãy thay bằng engine
chạy offline.
"""
import hashlib
import io
from collections import OrderedDict

from gtts import gTTS

from app.config import settings

# Cache rất đơn giản (LRU thủ công bằng OrderedDict) để không tổng hợp lại cùng một
# câu nói nhiều lần — giảm tải cho service và tránh phát sinh yêu cầu trùng lặp.
_cache: "OrderedDict[str, bytes]" = OrderedDict()


def _cache_key(text: str, lang: str) -> str:
    raw = f"{lang}:{text}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def synthesize(text: str, lang: str = "vi") -> bytes:
    """Trả về nội dung audio MP3 (bytes) cho đoạn văn bản + ngôn ngữ cho trước."""
    key = _cache_key(text, lang)

    if key in _cache:
        _cache.move_to_end(key)  # đánh dấu vừa dùng, giữ ở cuối hàng LRU
        return _cache[key]

    buffer = io.BytesIO()
    gTTS(text=text, lang=lang).write_to_fp(buffer)
    audio_bytes = buffer.getvalue()

    _cache[key] = audio_bytes
    if len(_cache) > settings.CACHE_MAX_ITEMS:
        _cache.popitem(last=False)  # loại bỏ mục cũ nhất

    return audio_bytes
