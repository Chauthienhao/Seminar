# Giai đoạn 2 — Dashboard phân tích

Mở `/admin`, đăng nhập và chọn **Tổng quan**. Bộ lọc áp dụng ngày bắt đầu/kết thúc (bao gồm cả ngày cuối, tối đa 366 ngày) và ngôn ngữ hiển thị tên POI. Ngôn ngữ tên không lọc lượt phát: thống kê vẫn gồm tất cả ngôn ngữ đã nghe.

## Dữ liệu và cách tính

Không thay đổi `DB.sql`, ORM hoặc cấu trúc bảng. Dữ liệu sự kiện lấy từ `play_logs`; tên POI/phòng và việc xếp phòng đọc từ các bảng hiện có.

- **Top POI:** số dòng log theo `artifact_id`, giảm dần. Không JOIN trực tiếp bản dịch vào phép đếm nên dữ liệu bản dịch cũ bị trùng không nhân số lượt. POI thiếu bản dịch vẫn hiện bằng tên dự phòng hoặc mã QR.
- **Trung bình:** `AVG(listen_duration)` trên các giá trị khác NULL; log cũ chưa gửi thời lượng không bị coi là 0 giây. 0 giây là thời lượng đã đo nhưng chưa tròn một giây. Dashboard trả cả số lượt đã có thời lượng để người xem hiểu độ đầy đủ của mẫu. Thời lượng của lượt đang phát có thể mới chỉ là checkpoint gần nhất.
- **Ngày/ngôn ngữ:** đếm theo ngày `played_at` và `language_played`. Ngày không phát được giao diện bổ sung với 0 lượt. Thống kê dùng ngày giờ đã lưu trong CSDL, không tự chuyển sang múi giờ trình duyệt; cần vận hành các writer và MySQL với cùng quy ước múi giờ. Khoảng ngày chọn lượt theo thời điểm bắt đầu, không phân bổ lại thời lượng qua nhiều ngày.
- **Lộ trình:** sắp theo `session_id`, `played_at`, `id`, tách hành trình khi cách nhau hơn 30 phút. Gộp POI lặp liên tiếp; chuỗi có ít nhất hai POI được đếm theo toàn bộ thứ tự quan sát, rồi trả 10 chuỗi phổ biến nhất. POI đã xóa (FK NULL) ngắt chuỗi để không suy diễn một chuyển tiếp qua khoảng trống. Không trả `session_id` hoặc danh sách phiên riêng ra browser. Số lượt hành trình có thể lớn hơn số session nếu một session có nhiều lần tham quan cách xa nhau.
- **Heatmap:** tổng lượt theo phòng hiện tại của POI. Phòng không phát vẫn hiện 0. Các POI chưa xếp phòng hoặc đã xóa được báo riêng. Đổi phòng của hiện vật sẽ đổi cách phân nhóm log cũ vì DB hiện không lưu ảnh chụp phòng tại thời điểm phát.

Lộ trình là **thứ tự nghe**, không phải xác nhận đường di chuyển vật lý. `TIMESTAMP` hiện tại có thể chỉ chính xác tới giây; khi hai log cùng thời điểm, `id` chỉ cung cấp thứ tự ổn định, không chứng minh thứ tự thực. Bộ lọc ngày có thể cắt một phần hành trình ở biên cửa sổ.

## Ghi thời lượng từ trình phát

Frontend tạo UUID cho một lượt phát ngay khi audio thực sự phát (`playing`), gửi `POST /api/play-logs` với `id` đó và `listen_duration: null`. Tất cả checkpoint cập nhật cùng dòng qua cùng endpoint; backend chỉ giữ thời lượng lớn nhất, bảo toàn `played_at` và không tăng lượt khi pause/resume hoặc request tới sai thứ tự.

Ví dụ payload:

```json
{
  "id": "90a176b1-a98a-42c7-a1f3-c4eb49f17977",
  "artifact_id": "ID-hiện-vật",
  "session_id": "ID-ẩn-danh-trong-sessionStorage",
  "trigger_method": "MANUAL",
  "language_played": "vi",
  "listen_duration": 27
}
```

- Gửi khi pause, nghe hết, lỗi audio, chuyển POI/ngôn ngữ, rời trang; checkpoint định kỳ mỗi 15 giây và khi thay đổi visibility để giảm mất dữ liệu.
- Dùng thời gian thực đang phát, dừng đồng hồ khi buffering/seeking/paused. Tua 60 giây không cộng thêm 60 giây; thời gian chờ không tính. Số nguyên giây được làm tròn xuống, tối đa 86400 giây/lượt.
- Resume giữ UUID và thời lượng tích lũy; nghe lại từ đầu sau khi đã kết thúc tạo UUID mới. Chuyển ngôn ngữ/POI cũng tạo lượt mới và flush lượt trước.
- Dùng `translation.language_code` thực tế (kể cả khi backend fallback ngôn ngữ), không dùng ngôn ngữ nút chọn để gắn sai log. Nghe trên web là `MANUAL`, không giả là `QR_SCAN`.
- `fetch` có `keepalive`; lỗi telemetry không chặn audio. Retry với cùng `id` là idempotent. Trình duyệt bị tắt cưỡng bức hoặc mất mạng vẫn có thể mất thời lượng sau checkpoint gần nhất; không có hàng đợi offline bền vững.
- Client cũ không gửi `id` vẫn được hỗ trợ: server tạo UUID như trước. Chỉ client mới tái sử dụng `id` mới có cập nhật cùng lượt. Không cho dùng cùng UUID với session/hiện vật/ngôn ngữ khác (409).

## API dashboard

`GET /api/admin/stats/dashboard?start_date=2026-10-01&end_date=2026-10-26&lang=vi`

Yêu cầu Bearer JWT như các API CMS khác. Thiếu ngày kết thúc dùng ngày hiện tại của server; thiếu ngày bắt đầu dùng 30 ngày tính cả ngày cuối. Khoảng ngược, quá 366 ngày hoặc `lang` ngoài vi/en trả 422.

Response gồm `total_plays`, `measured_plays`, `average_listen_seconds`, `pois`, `daily`, `languages`, `popular_routes`, `rooms`, `unassigned_plays`, khoảng ngày và `timezone: "database"`. Không trả dữ liệu phiên thô.

## Ghép mã phòng lên sơ đồ

`src/lib/museumFloors.js` là mặt bằng tham khảo dùng chung với trang bản đồ hiện có. Heatmap ghép `rooms.code` với các mã 101, 102, 103…/201, 204… trên mặt bằng, bỏ khoảng trắng đầu cuối và không phân biệt hoa/thường. Chỉ ghép khi mã tương ứng duy nhất một phòng trong DB. Không đoán vị trí từ tên phòng.

Phòng chưa khớp hoặc mã trùng xuất hiện riêng bên dưới; bảng vẫn hiển thị toàn bộ phòng và số lượt. Xám là chưa ghép, kem là phòng đã ghép có 0 lượt, đỏ đậm hơn là nhiều lượt hơn. Cùng một thang màu tối đa dùng cho cả hai tầng. Đây không phải heatmap GPS và không tự khẳng định sơ đồ hardcode là mặt bằng thực tế.

## Chạy kiểm tra

```powershell
# Từ thư mục repository, backend dependencies đã được cài vào môi trường Python:
python -m pytest backend-thuyet-minh/tests -q
npm ci
npm test
npm run build
```

Test backend dùng SQLite tạm với cùng ORM, không kết nối DB thật: kiểm tra idempotency, thời lượng không giảm, log thiếu thời lượng, biên ngày, nhóm ngôn ngữ/phòng, bản dịch trùng, thứ tự lộ trình/ẩn danh, auth/422/404/409 và response schema. Test frontend dùng Node test runner cho đồng hồ playback, pause/resume, seek/buffering, retry và replay. Truy vấn chỉ dùng SQL chuẩn/`DATE` hỗ trợ bởi MySQL; cần smoke-test trên MySQL của môi trường triển khai để xác nhận dữ liệu và quy ước múi giờ thực tế.
