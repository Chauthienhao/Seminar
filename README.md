# Bảo tàng Thành phố Hồ Chí Minh — Audio Guide & Digital Map

Hệ thống thuyết minh tự động song ngữ (Việt – Anh), gồm 3 phần chạy riêng:

| Phần | Thư mục | Cổng | Công nghệ |
|---|---|---|---|
| Frontend (khách tham quan + CMS `/admin`) | thư mục gốc, `src/` | 5173 | React, Vite, Tailwind |
| Backend API | `backend-thuyet-minh/` | 8000 | FastAPI, SQLAlchemy, MySQL |
| Dịch vụ giọng nói (TTS) | `src/tts-service/` | 8001 | FastAPI, gTTS (cần Internet) |

## Cài đặt và chạy

**1. Tạo database.** Trong MySQL Workbench, chạy `DB.sql` rồi đến `seed_data.sql`.
Nếu đã có database cũ, chạy `DROP DATABASE museum_audio_guide;` trước (thao tác này xoá toàn bộ dữ liệu cũ).

**2. Cấu hình backend.** Sao chép `backend-thuyet-minh/.env.example` thành `.env` rồi sửa mật khẩu MySQL.

**3. Chạy backend** (terminal 1). Phải chạy `create_admin.py` sau bước 1:

```powershell
cd backend-thuyet-minh
pip install -r requirements.txt
python create_admin.py
uvicorn main:app --reload --port 8000
```

**4. Chạy TTS** (terminal 2):

```powershell
cd src\tts-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**5. Chạy frontend** (terminal 3, ở thư mục gốc):

```powershell
npm install
npm run dev
```

## Địa chỉ sử dụng

- Trang khách tham quan: http://localhost:5173
- Trang quản trị: http://localhost:5173/admin (mặc định `admin` / `Admin@123`, đổi bằng `python create_admin.py --password "..."`)
- Tài liệu API: http://localhost:8000/docs

## Mã QR điểm tham quan (POI)

- Mã QR dán tại mỗi **điểm tham quan (POI)**, không phải từng hiện vật: một POI (VD một tủ trưng bày) có thể chứa nhiều hiện vật, hoặc không có hiện vật nào (lối vào, quầy thông tin).
- Mỗi mã QR chứa link `<VITE_PUBLIC_URL>/q/<mã POI>` (VD `https://baotang.example/q/SG-1822`). Chỉ cột `pois.code` được lưu; ảnh QR được vẽ lại mỗi lần in. Quét QR: POI có 1 hiện vật thì mở thẳng hiện vật, còn lại mở trang `/diem/<mã POI>` liệt kê hiện vật.
- In mã: trang quản trị → Điểm tham quan → nút QR ở mỗi dòng → In hoặc Tải PNG, rồi dán tại điểm đó.
- Quét mã: camera điện thoại mở thẳng link; hoặc trang Tra cứu hiện vật → “Quét mã QR” (camera máy tính, hoặc chọn ảnh có mã QR).
- Trước khi in để dán thật, tạo file `.env` ở thư mục gốc (xem `.env.example`) với `VITE_PUBLIC_URL` là địa chỉ website thật. QR in lúc còn `localhost` chỉ mở được trên chính máy đó.
- Camera chỉ hoạt động trên `https` hoặc `localhost`. Không đổi đường dẫn `/q/`: các tờ QR đã in đều trỏ vào đó.

## Quy tắc dữ liệu

- Mỗi hiện vật bắt buộc thuộc một phòng.
- Phòng còn hiện vật thì không xoá được; phải chuyển hoặc xoá hiện vật trước.
- Xoá hiện vật sẽ xoá luôn bản dịch và điểm dừng trong tour, nhưng giữ lại lịch sử nghe.
