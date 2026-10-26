/**
 * Mỗi lượt phát audio cần một `session_id` ẩn danh để backend gộp thống kê
 * (không gắn với tài khoản người dùng vì khách tham quan không cần đăng nhập).
 * Lưu trong sessionStorage: tồn tại trong suốt 1 tab trình duyệt, tự xoá khi đóng tab.
 */
const SESSION_KEY = 'museum_session_id'

export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}
