# Bản đồ vị trí hiện vật

`src/pages/MuseumMap.jsx` dùng `ArtifactMapPage.jsx` và `ArtifactMap.jsx` trong thư mục này để hiển thị trang `/ban-do`.

- Dữ liệu từ `GET /api/map/artifacts?lang=vi`, đọc bảng `artifacts`, phòng và bản dịch trong database hiện tại.
- Mỗi hiện vật có GPS hợp lệ trong khu vực bảo tàng có một marker. Bấm marker xem tên, ảnh, mã, phòng, mô tả và liên kết `/hien-vat/{id}`.
- Chỉ kéo và thu nhỏ trong vùng cố định tại `museumMapConfig.mjs`; mức thu nhỏ tối thiểu tự điều chỉnh theo kích thước màn hình. Nút “Về bảo tàng” căn lại vùng hiện vật.
- Phần nền bên ngoài vùng xem được che cả trong lúc thu phóng. Popup tự nằm gọn trong khung, không kéo bản đồ ra khỏi vùng giới hạn.
- Vùng xem bao gồm bảo tàng và các GPS mẫu đang có trong `seed_data.sql`, chưa phải ranh giới khuôn viên đo thực tế. Khi cập nhật GPS thật, chỉnh `MUSEUM_BOUNDS` và `MUSEUM_CENTER` trong `museumMapConfig.mjs`. Điểm ngoài vùng không được hiển thị và không làm mở rộng bản đồ.
- Nền OpenStreetMap dùng ảnh tới zoom 19; các mức phóng to hơn phóng lớn ảnh đó để giữ khung nhìn trong khu vực đã giới hạn.
- Rê chuột hoặc chọn bằng bàn phím để xem tên; marker được chọn có màu nổi bật.
- Các hiện vật trùng GPS vẫn giữ tọa độ thật và chọn được trong popup.
- Không có đường nối, OSRM, routing, quãng đường hay thời gian di chuyển. Không thêm dữ liệu mẫu.

Chạy frontend từ thư mục gốc `Seminar` bằng `npm run dev`, rồi mở `/ban-do`. Có thể chạy `npm run dev` ngay trong thư mục `map`; script sẽ mở frontend của dự án gốc để liên kết chi tiết hoạt động đúng.

Backend cần chạy trong `backend-thuyet-minh`:

```powershell
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Cần Internet cho nền OpenStreetMap và ảnh từ URL trong database. Khi database chưa có hiện vật có GPS hợp lệ, bản đồ thông báo chưa có dữ liệu và không tự sinh marker.
