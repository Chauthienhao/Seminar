/**
 * Lớp giao tiếp DUY NHẤT giữa frontend và backend-thuyet-minh.
 * Mọi trang (Home, ArtifactLookup, ArtifactDetail, ToursCollections...) đều gọi qua
 * đây thay vì tự viết fetch() rải rác — nếu sau này đổi base URL hay thêm header
 * (ví dụ token đăng nhập CMS) thì chỉ cần sửa một chỗ.
 *
 * '/api' được Vite proxy sang backend thật ở http://localhost:8000 (xem vite.config.js),
 * nên khi code chạy trong trình duyệt, request thực tế là gọi cùng origin — không bị
 * chặn bởi CORS lúc dev.
 */

const BASE_URL = '/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // response không phải JSON hợp lệ -> giữ nguyên statusText
    }
    throw new ApiError(detail, res.status)
  }

  if (res.status === 204) return null
  return res.json()
}

function withQuery(path, params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const qs = search.toString()
  return qs ? `${path}?${qs}` : path
}

export const api = {
  // ---------- Hiện vật ----------
  searchArtifacts: (q, lang = 'vi') => request(withQuery('/artifacts', { q, lang })),
  lookupArtifactByQrCode: (code, lang = 'vi') =>
    request(withQuery(`/artifacts/lookup/${encodeURIComponent(code)}`, { lang })),
  getArtifact: (id, lang = 'vi') => request(withQuery(`/artifacts/${id}`, { lang })),

  // ---------- Phòng & bản đồ ----------
  listArtifactPositions: (lang = 'vi', options = {}) =>
    request(withQuery('/map/artifacts', { lang }), options),
  listRooms: () => request('/rooms'),
  getRoom: (id, lang = 'vi') => request(withQuery(`/rooms/${id}`, { lang })),

  // ---------- Tuyến tham quan ----------
  listTours: (lang = 'vi') => request(withQuery('/tours', { lang })),
  getTour: (id, lang = 'vi') => request(withQuery(`/tours/${id}`, { lang })),

  // ---------- Ghi log lượt phát (Analytics) ----------
  logPlay: (payload) => request('/play-logs', { method: 'POST', body: JSON.stringify(payload) }),
}

export { ApiError }
