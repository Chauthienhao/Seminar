# Bản đồ điểm tham quan (POI)

`src/pages/MuseumMap.jsx` dùng `ArtifactMapPage.jsx` và `ArtifactMap.jsx` trong thư mục này để hiển thị trang `/ban-do`.

- Dữ liệu từ `GET /api/map/pois?lang=vi`, đọc bảng `pois` kèm phòng và các hiện vật (cùng bản dịch) đặt tại mỗi POI.
- Mỗi POI có GPS hợp lệ trong khu vực bảo tàng có một marker. Bấm marker xem tên điểm, mã QR, phòng; POI có nhiều hiện vật thì chọn từng hiện vật trong popup (ảnh, mô tả, liên kết `/hien-vat/{id}`); POI không có hiện vật hiện mô tả của điểm và liên kết `/diem/{mã}`.
- Chỉ kéo và thu nhỏ trong vùng cố định tại `museumMapConfig.mjs`; mức thu nhỏ tối thiểu tự điều chỉnh theo kích thước màn hình. Nút “Về bảo tàng” căn lại vùng các điểm tham quan.
- Phần nền bên ngoài vùng xem được che cả trong lúc thu phóng. Popup tự nằm gọn trong khung, không kéo bản đồ ra khỏi vùng giới hạn.
- Vùng xem bao gồm bảo tàng và các GPS mẫu đang có trong `seed_data.sql`, chưa phải ranh giới khuôn viên đo thực tế. Khi cập nhật GPS thật, chỉnh `MUSEUM_BOUNDS` và `MUSEUM_CENTER` trong `museumMapConfig.mjs`. Điểm ngoài vùng không được hiển thị và không làm mở rộng bản đồ.
- Nền OpenStreetMap dùng ảnh tới zoom 19; các mức phóng to hơn phóng lớn ảnh đó để giữ khung nhìn trong khu vực đã giới hạn.
- Rê chuột hoặc chọn bằng bàn phím để xem tên; marker được chọn có màu nổi bật.
- Toạ độ GPS nằm ở POI, không ở hiện vật: hiện vật cùng một tủ trưng bày dùng chung một ghim.
- Không có đường nối, OSRM, routing, quãng đường hay thời gian di chuyển. Không thêm dữ liệu mẫu.
- Trang admin (Thêm/Sửa điểm tham quan) dùng `LocationPicker.jsx`: bấm vào bản đồ để đặt ghim, kéo ghim để chỉnh, form tự điền `lat`/`lng`. Ghim các POI khác hiện mờ để canh vị trí. Phần Leaflet dùng chung (vùng che, giới hạn zoom, icon) nằm trong `museumMapLeaflet.js`.

Chạy frontend từ thư mục gốc `Seminar` bằng `npm run dev`, rồi mở `/ban-do`. Liên kết “Xem chi tiết” dùng `<Link>` của react-router nên chuyển trang không tải lại ứng dụng.

Backend cần chạy trong `backend-thuyet-minh`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Test dữ liệu bản đồ: `node --test src/components/map/artifactMapData.test.mjs`.

Cần Internet cho nền OpenStreetMap và ảnh từ URL trong database. Khi database chưa có POI có GPS hợp lệ, bản đồ thông báo chưa có dữ liệu và không tự sinh marker.
