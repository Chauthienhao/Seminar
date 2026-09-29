-- Tạo Database hỗ trợ tiếng Việt (utf8mb4)
CREATE DATABASE IF NOT EXISTS museum_audio_guide 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE museum_audio_guide;

-- 1. Bảng Khu vực / Phòng trưng bày
CREATE TABLE rooms (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name_vi VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL
);

-- 2. Bảng Hiện vật / Điểm POI
CREATE TABLE artifacts (
    id VARCHAR(36) PRIMARY KEY,
    qr_code VARCHAR(50) UNIQUE NOT NULL,
    room_id VARCHAR(36),
    lat FLOAT,
    lng FLOAT,
    geofence_radius INT DEFAULT 10,
    image_url VARCHAR(500),
    period VARCHAR(100),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- 3. Bảng Nội dung đa ngôn ngữ
CREATE TABLE artifact_translations (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36) NOT NULL,
    language_code VARCHAR(10) NOT NULL, -- 'vi' hoặc 'en'
    title VARCHAR(255) NOT NULL,
    transcript TEXT,
    audio_url VARCHAR(500),
    audio_duration INT,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

-- 4. Bảng Tuyến tham quan (Tours)
CREATE TABLE tours (
    id VARCHAR(36) PRIMARY KEY,
    title_vi VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    duration_minutes INT,
    thumbnail_url VARCHAR(500)
);

-- 5. Bảng Trung gian: Lộ trình của Tuyến tham quan
CREATE TABLE tour_artifacts (
    tour_id VARCHAR(36) NOT NULL,
    artifact_id VARCHAR(36) NOT NULL,
    step_order INT NOT NULL, -- Thứ tự điểm đến: 1, 2, 3...
    PRIMARY KEY (tour_id, artifact_id),
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
);

-- 6. Bảng Lịch sử sử dụng (Dùng cho CMS Analytics)
CREATE TABLE play_logs (
    id VARCHAR(36) PRIMARY KEY,
    artifact_id VARCHAR(36),
    session_id VARCHAR(100) NOT NULL, -- ID ẩn danh của thiết bị
    trigger_method VARCHAR(50) NOT NULL, -- 'QR_SCAN' hoặc 'GEOFENCE'
    language_played VARCHAR(10) NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    listen_duration INT, -- Số giây đã nghe
    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
);

-- 7. Bảng Tài khoản Quản trị viên (CMS Users)
CREATE TABLE admins (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Lưu mật khẩu đã được mã hóa (VD: dùng bcrypt)
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'STAFF', -- Phân quyền: 'SUPER_ADMIN' hoặc 'STAFF'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);