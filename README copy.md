# Bảo tàng Thành phố Hồ Chí Minh — Audio Guide & Digital Map

Frontend React (Vite + Tailwind) cho website Audio Guide của bảo tàng, khớp với cấu trúc layer Figma:
`museum-home`, `qr-scanner`, `artifact-audio-guide`, `museum-map`, `tours-and-collections`.

## Cấu trúc thư mục

```
museum-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx            # Entry point, bọc BrowserRouter
    ├── App.jsx             # Khai báo route cho 5 trang
    ├── index.css           # Tailwind + style toàn cục
    ├── components/
    │   ├── Header.jsx      # Header-Nav dùng chung mọi trang
    │   └── Footer.jsx      # Footer dùng chung mọi trang
    └── pages/
        ├── Home.jsx              # museum-home  → "/"
        ├── QRScanner.jsx         # qr-scanner   → "/quet-ma-qr"
        ├── ArtifactDetail.jsx    # artifact-audio-guide → "/hien-vat/:id"
        ├── MuseumMap.jsx         # museum-map   → "/ban-do"
        └── ToursCollections.jsx  # tours-and-collections → "/bo-suu-tap"
```

## Chạy thử cục bộ

```bash
npm install
npm run dev
```

Mặc định chạy tại `http://localhost:5173`.

## Kết nối với backend Python

`vite.config.js` đã cấu hình proxy `/api` → `http://localhost:8000` (sửa lại port cho khớp
FastAPI/Flask của bạn). Trong code, các điểm cần gọi API đã được đánh dấu `// TODO`, ví dụ:

- `QRScanner.jsx`: tra cứu hiện vật theo mã QR/mã nhập tay
  → gợi ý endpoint `GET /api/artifacts/lookup?code=...`
- `ArtifactDetail.jsx`: lấy chi tiết hiện vật theo `slug`
  → gợi ý endpoint `GET /api/artifacts/{slug}`
- `ToursCollections.jsx`: danh sách tour/bộ sưu tập, tìm kiếm, lọc theo chủ đề
  → gợi ý endpoint `GET /api/tours?topic=...&q=...`
- `MuseumMap.jsx`: dữ liệu sơ đồ tầng, lộ trình gợi ý theo vị trí hiện tại
  → gợi ý endpoint `GET /api/map/{floor}`

Hiện tại các trang đang dùng dữ liệu mẫu (mock) khai báo trực tiếp trong file, để bạn có thể
thay bằng `fetch`/`useEffect` hoặc React Query khi backend đã sẵn sàng.

## Ghi chú thiết kế

- Bảng màu: nền kem `#FBF7EF`, chữ chính `#1B2340`, điểm nhấn đỏ gạch `#A6321E`, footer xanh
  navy `#1B2A4A` — theo đúng tông màu trong thiết kế Figma gốc.
- Font: Source Serif 4 cho tiêu đề, Inter cho phần chữ nội dung.
- Đã responsive từ mobile (menu dạng hamburger) đến desktop.
