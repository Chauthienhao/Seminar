-- ============================================================================
-- DB.sql  (PHIÊN BẢN 3 — tách bảng POI riêng khỏi hiện vật)
-- Hệ thống thuyết minh tự động đa ngôn ngữ — Bảo tàng Thành phố Hồ Chí Minh
-- ============================================================================
--
-- Bảng `pois` là các ĐIỂM THAM QUAN (Point of Interest): vị trí vật lý trong bảo tàng, nơi dán
-- mã QR (code), có toạ độ GPS (lat, lng, geofence_radius) và vị trí ghim trên sơ đồ (map_x, map_y).
-- Bảng `artifacts` là HIỆN VẬT: mỗi hiện vật nằm tại đúng một POI (artifacts.poi_id NOT NULL).
--   POI      = "đứng ở đâu thì nghe"
--   Hiện vật = "nghe về cái gì"
-- Một POI có thể chứa nhiều hiện vật (một tủ trưng bày), hoặc không có hiện vật nào (lối vào,
-- quầy thông tin...).
--
-- Quy tắc xoá dữ liệu:
--   * Xoá PHÒNG (rooms)  -> BỊ CHẶN (RESTRICT) nếu phòng còn POI.
--   * Xoá POI (pois)     -> BỊ CHẶN (RESTRICT) nếu POI còn hiện vật, vì artifacts.poi_id là khoá
--                           ngoại về pois. POI trống thì xoá được: tự rời khỏi các tour (CASCADE),
--                           lịch sử nghe được giữ lại, play_logs.poi_id đặt NULL.
--   * Xoá HIỆN VẬT       -> nội dung thuyết minh (artifact_translations) xoá theo (CASCADE);
--                           lịch sử nghe được giữ lại, play_logs.artifact_id đặt NULL.
--
-- Sơ đồ quan hệ:
--
--   rooms 1───N pois 1───N artifacts 1───N artifact_translations
--                    │ 1───N tour_pois N───1 tours
--                    └ 1───N play_logs N───1 artifacts
--
-- Đang có database cũ? Xoá đi rồi tạo lại:   DROP DATABASE museum_audio_guide;
-- sau đó chạy lại file này, rồi chạy seed_data.sql.
-- ============================================================================

-- Tạo Database hỗ trợ tiếng Việt (utf8mb4)
CREATE DATABASE IF NOT EXISTS museum_audio_guide
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE museum_audio_guide;

-- 1. Bảng Khu vực / Phòng trưng bày (kèm hình chữ nhật của phòng trên sơ đồ mặt bằng)
CREATE TABLE rooms (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name_vi VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    floor_no INT NOT NULL DEFAULT 0,  -- 0 = tầng trệt, 1 = lầu 1, ...
    map_x INT,                        -- góc trên-trái của phòng trên sơ đồ (hệ toạ độ 600x420)
    map_y INT,
    map_w INT,                        -- chiều rộng / cao của phòng trên sơ đồ
    map_h INT
);

-- 2. Bảng Điểm tham quan (POI)
CREATE TABLE pois (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,     -- mã in trên QR dán tại điểm này, vd 'SG-1822' -> link /q/SG-1822
    room_id VARCHAR(36) NOT NULL,         -- POI nằm trong phòng nào (bắt buộc)
    poi_type VARCHAR(20) NOT NULL DEFAULT 'EXHIBIT', -- 'EXHIBIT' | 'ENTRANCE' | 'INFO_DESK' | 'EXIT'
    name_vi VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    lat DOUBLE,                           -- vị trí GPS ngoài đời thật (dùng cho geofence trên app mobile)
    lng DOUBLE,                           -- DOUBLE vì FLOAT làm tròn còn ~6 chữ số, lệch hàng chục mét
    geofence_radius INT DEFAULT 10,       -- bán kính kích hoạt quanh (lat, lng), đơn vị MÉT
    map_x INT,                            -- vị trí điểm ghim trên SƠ ĐỒ MẶT BẰNG (hệ toạ độ 600x420)
    map_y INT,
    CONSTRAINT fk_pois_room
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
);

-- 3. Bảng Hiện vật — mỗi hiện vật bắt buộc nằm tại một POI (phòng của hiện vật = phòng của POI)
CREATE TABLE artifacts (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,     -- mã / số hiệu hiện vật, vd 'SG-1822'
    poi_id VARCHAR(36) NOT NULL,          -- hiện vật đặt tại POI nào (bắt buộc)
    image_url VARCHAR(500),
    period VARCHAR(100),                  -- thời kỳ / niên đại của hiện vật, vd 'Triều Nguyễn, thế kỷ 19'
    CONSTRAINT fk_artifacts_poi
        FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE RESTRICT
);

-- 4. Bảng Nội dung đa ngôn ngữ của hiện vật
CREATE TABLE artifact_translations (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) NOT NULL,
    language_code VARCHAR(10) NOT NULL, -- 'vi' hoặc 'en'
    title VARCHAR(255) NOT NULL,
    transcript TEXT,
    audio_url VARCHAR(500),
    audio_duration INT,
    CONSTRAINT fk_translations_artifact
        FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

-- 5. Bảng Tuyến tham quan (Tours)
CREATE TABLE tours (
    id VARCHAR(36) PRIMARY KEY,
    title_vi VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    duration_minutes INT,
    thumbnail_url VARCHAR(500)
);

-- 6. Bảng Trung gian: Lộ trình của tour = chuỗi POI theo thứ tự
CREATE TABLE tour_pois (
    tour_id VARCHAR(36) NOT NULL,
    poi_id VARCHAR(36) NOT NULL,
    step_order INT NOT NULL, -- Thứ tự điểm đến: 1, 2, 3...
    PRIMARY KEY (tour_id, poi_id),
    CONSTRAINT fk_tour_pois_tour
        FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    CONSTRAINT fk_tour_pois_poi
        FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE
);

-- 7. Bảng Lịch sử sử dụng (Dùng cho CMS Analytics)
CREATE TABLE play_logs (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36),             -- nghe hiện vật nào
    poi_id VARCHAR(36),                  -- khách đang ở POI nào khi nghe
    session_id VARCHAR(100) NOT NULL, -- ID ẩn danh của thiết bị
    trigger_method VARCHAR(50) NOT NULL, -- 'QR_SCAN' | 'GEOFENCE' | 'MANUAL' (mở từ tìm kiếm/bản đồ/tour)
    language_played VARCHAR(10) NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    listen_duration INT, -- Số giây đã nghe
    CONSTRAINT fk_play_logs_artifact
        FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL,
    CONSTRAINT fk_play_logs_poi
        FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE SET NULL
);

-- 8. Bảng Tài khoản Quản trị viên (CMS Users)
CREATE TABLE admins (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Lưu mật khẩu đã được mã hóa (VD: dùng bcrypt)
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'STAFF', -- Phân quyền: 'SUPER_ADMIN' hoặc 'STAFF'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);
