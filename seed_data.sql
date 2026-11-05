-- ============================================================================
-- seed_data.sql — Dữ liệu mẫu cho database museum_audio_guide (cấu trúc phiên bản 2)
-- ============================================================================
-- Cách dùng:
--   1. Chạy DB.sql (bản mới) để tạo database + các bảng.
--   2. Mở file này trong MySQL Workbench / phpMyAdmin / DBeaver rồi Execute.
--      Hoặc dùng CMD (PowerShell không hỗ trợ dấu <, và mysql phải có trong PATH):
--      mysql -u root -p --default-character-set=utf8mb4 museum_audio_guide < seed_data.sql
--
-- Dùng INSERT IGNORE nên chạy lại nhiều lần không bị lỗi "Duplicate entry".
-- Thứ tự INSERT KHÔNG được đổi: bảng được tham chiếu (khoá ngoại) phải có dữ liệu trước:
--   rooms -> artifacts -> artifact_translations ;  tours -> tour_artifacts ;  artifacts -> play_logs
--
-- map_x / map_y: vị trí trên sơ đồ mặt bằng (khung 600x420). lat / lng: GPS MẪU quanh
-- Bảo tàng TP.HCM (65 Lý Tự Trọng, Q.1), suy ra từ vị trí trên sơ đồ — đo lại tại chỗ nếu dùng thật.
-- ============================================================================

USE museum_audio_guide;

-- 1. rooms — Phòng trưng bày (floor_no: 0 = tầng trệt, 1 = lầu 1)
INSERT IGNORE INTO rooms (id, code, name_vi, name_en, floor_no, map_x, map_y, map_w, map_h) VALUES
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa01', '101', 'Sảnh chính', 'Main Hall', 0, 40, 40, 150, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa02', '102', 'Phòng gốm sứ cổ', 'Ancient Ceramics Room', 0, 190, 40, 150, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa03', '103', 'Phòng khảo cổ Sài Gòn xưa', 'Old Saigon Archaeology Room', 0, 340, 40, 220, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa04', '104', 'Phòng Chăm — Óc Eo', 'Cham – Oc Eo Room', 0, 40, 245, 170, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa05', '105', 'Phòng Địa lý & Địa chất Gia Định', 'Gia Dinh Geography & Geology Room', 0, 210, 245, 190, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa06', '107', 'Phòng chuyên đề', 'Thematic Room', 0, 400, 245, 160, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa07', '201', 'Sảnh trưng bày ảnh', 'Photo Gallery Hall', 1, 40, 40, 170, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa08', '204', 'Phòng mỹ thuật Nam Bộ', 'Southern Fine Arts Room', 1, 210, 40, 180, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa09', '205', 'Phòng trang phục lễ hội', 'Festival Costume Room', 1, 390, 40, 170, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa10', '207', 'Phòng thương cảng Sài Gòn', 'Saigon Port Room', 1, 40, 245, 190, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa11', '208', 'Phòng kháng chiến', 'Resistance Room', 1, 230, 245, 170, 135),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa12', '210', 'Phòng tư liệu ảnh', 'Photo Archive Room', 1, 400, 245, 160, 135);

-- 2. artifacts — Hiện vật / Điểm POI. room_id là khoá ngoại tới rooms (RESTRICT)
-- image_url để NULL: nhập đường dẫn ảnh thật sau. SG-ENTRANCE là điểm sảnh đón tiếp (không có niên đại).
INSERT IGNORE INTO artifacts (id, qr_code, room_id, lat, lng, geofence_radius, map_x, map_y, image_url, period) VALUES
('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb01', 'SG-ENTRANCE', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa01', 10.777137, 106.700669, 15, 115, 110, NULL, NULL),
('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02', 'SG-1815', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa02', 10.777137, 106.700806, 8, 265, 110, NULL, 'Thế kỷ 18 - 19'),
('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03', 'SG-1822', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa03', 10.777141, 106.700975, 8, 450, 105, NULL, 'Triều Nguyễn, thế kỷ 19'),
('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb04', 'SG-1930', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa05', 10.776951, 106.700842, 8, 305, 315, NULL, 'Thời Pháp thuộc, 1930'),
('bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb05', 'SG-2041', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaa08', 10.777137, 106.700838, 8, 300, 110, NULL, 'Thế kỷ 20');

-- 3. artifact_translations — Nội dung VI + EN của mỗi POI (audio_url = NULL -> backend dùng tts-service)
INSERT IGNORE INTO artifact_translations (id, artifact_id, language_code, title, transcript, audio_url, audio_duration) VALUES
('cccccccc-cccc-4ccc-accc-cccccccccc01', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02', 'vi', 'Bình gốm Sài Gòn xưa',
 'Bình gốm được khai quật tại khu vực Sài Gòn, minh chứng cho kỹ thuật gốm sứ và đời sống sinh hoạt của cư dân vùng đất này vào thế kỷ 18-19.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc02', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02', 'en', 'Old Saigon Ceramic Vase',
 'A ceramic vase excavated in the Saigon area, evidence of the pottery techniques and daily life of residents in this region during the 18th-19th century.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc03', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03', 'vi', 'Ấn đồng Tả quân Lê Văn Duyệt',
 'Ấn đồng của Tả quân Lê Văn Duyệt, một trong những vị quan có công lớn trong việc khai phá và trấn giữ vùng đất Gia Định - Sài Gòn dưới triều Nguyễn.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc04', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03', 'en', 'Bronze Seal of General Le Van Duyet',
 'The bronze seal of General Le Van Duyet, a prominent official who contributed greatly to developing and defending the Gia Dinh - Saigon region under the Nguyen dynasty.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc05', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb04', 'vi', 'Bản đồ Gia Định thời Pháp thuộc',
 'Bản đồ địa chính khu vực Gia Định được lập dưới thời Pháp thuộc năm 1930, thể hiện quy hoạch đô thị và địa lý khu vực lúc bấy giờ.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc06', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb04', 'en', 'Map of Gia Dinh under French Colonial Rule',
 'A cadastral map of the Gia Dinh region made in 1930 under French colonial rule, showing the urban planning and geography of the area at the time.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc07', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb05', 'vi', 'Tranh sơn mài phong cảnh Nam Bộ',
 'Bức tranh sơn mài thể hiện phong cảnh sông nước Nam Bộ, một trong những chất liệu đặc trưng của mỹ thuật Việt Nam thế kỷ 20.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc08', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb05', 'en', 'Southern Landscape Lacquer Painting',
 'A lacquer painting depicting the riverside landscape of Southern Vietnam, a signature medium of 20th-century Vietnamese fine art.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc09', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb01', 'vi', 'Sảnh đón tiếp',
 'Chào mừng quý khách đến với Bảo tàng Thành phố Hồ Chí Minh. Hãy quét mã QR tại mỗi điểm tham quan để nghe thuyết minh.',
 NULL, NULL),
('cccccccc-cccc-4ccc-accc-cccccccccc10', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb01', 'en', 'Reception Hall',
 'Welcome to the Ho Chi Minh City Museum. Scan the QR code at each point of interest to listen to the audio guide.',
 NULL, NULL);

-- 4. tours — Tuyến tham quan
INSERT IGNORE INTO tours (id, title_vi, title_en, description_vi, description_en, duration_minutes, thumbnail_url) VALUES
('dddddddd-dddd-4ddd-addd-dddddddddd01', 'Dấu ấn kiến trúc Gia Long', 'Marks of Gia Long Architecture',
 'Hành trình khám phá các hiện vật tiêu biểu cho giai đoạn hình thành và phát triển của vùng đất Sài Gòn - Gia Định.',
 'A journey exploring artifacts representing the formation and development of the Saigon - Gia Dinh region.',
 20, NULL);

-- 5. tour_artifacts — Lộ trình = chuỗi POI theo thứ tự
INSERT IGNORE INTO tour_artifacts (tour_id, artifact_id, step_order) VALUES
('dddddddd-dddd-4ddd-addd-dddddddddd01', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03', 1),
('dddddddd-dddd-4ddd-addd-dddddddddd01', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02', 2),
('dddddddd-dddd-4ddd-addd-dddddddddd01', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb04', 3);

-- 6. play_logs — Lịch sử nghe (dữ liệu mẫu để thử thống kê CMS)
INSERT IGNORE INTO play_logs (id, artifact_id, session_id, trigger_method, language_played, listen_duration) VALUES
('ffffffff-ffff-4fff-afff-ffffffffff01', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03', 'demo-session-0001', 'QR_SCAN', 'vi', 95),
('ffffffff-ffff-4fff-afff-ffffffffff02', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb03', 'demo-session-0002', 'QR_SCAN', 'vi', 60),
('ffffffff-ffff-4fff-afff-ffffffffff03', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb02', 'demo-session-0001', 'QR_SCAN', 'en', 80),
('ffffffff-ffff-4fff-afff-ffffffffff04', 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbb04', 'demo-session-0003', 'GEOFENCE', 'vi', 110);

-- 7. admins — Tài khoản quản trị CMS
-- password_hash chỉ là CHỖ TRỐNG (MySQL không tự băm bcrypt). Sau khi chạy file này, tại thư mục
-- backend-thuyet-minh (đã bật venv nếu có) chạy:   python create_admin.py
-- để ghi đè bằng hash thật; mật khẩu mặc định sẽ là  Admin@123
INSERT IGNORE INTO admins (id, username, password_hash, full_name, role) VALUES
('eeeeeeee-eeee-4eee-aeee-eeeeeeeeee01', 'admin', 'REPLACE_WITH_REAL_BCRYPT_HASH', 'Quản trị viên', 'SUPER_ADMIN');

-- Thử khoá ngoại: xoá phòng còn POI PHẢI báo lỗi 1451 (cannot delete a parent row)
--   DELETE FROM rooms WHERE code = '103';
-- Xoá POI thì được (nội dung + vị trí trong tour xoá theo, lịch sử nghe giữ lại):
--   DELETE FROM artifacts WHERE qr_code = 'SG-1822';
