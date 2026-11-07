/**
 * Địa chỉ công khai của website — dùng để tạo link in trong mã QR.
 * Đặt VITE_PUBLIC_URL trong file .env ở thư mục gốc khi deploy (VD: https://baotang.example).
 * Bỏ trống thì dùng địa chỉ đang mở trình duyệt (khi chạy thử là http://localhost:5173).
 */
export const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, '')

// QR in với địa chỉ localhost chỉ mở được trên chính máy này, điện thoại của khách sẽ không vào được
export const PUBLIC_URL_IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(PUBLIC_URL)
