/**
 * Lớp giao tiếp giữa trang CMS (/admin/*) và các endpoint /api/admin/* của backend.
 * Tách riêng khỏi api.js vì mọi request ở đây đều phải kèm JWT, còn api.js dành cho
 * khách tham quan (không đăng nhập).
 *
 * Khi backend trả 401 (token hết hạn / sai), file này xoá token và phát sự kiện
 * AUTH_EXPIRED_EVENT — AdminDashboard lắng nghe sự kiện đó để quay về form đăng nhập.
 */

const ADMIN_API = '/api/admin'
const TOKEN_KEY = 'museum_admin_token'

export const AUTH_EXPIRED_EVENT = 'museum-admin-auth-expired'

export const getToken = () => sessionStorage.getItem(TOKEN_KEY)
export const saveToken = (t) => sessionStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)

// FastAPI trả `detail` là chuỗi với lỗi nghiệp vụ, nhưng là mảng khi body sai kiểu (422)
function formatDetail(detail, fallback) {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => `${(d.loc || []).slice(-1)[0] ?? ''}: ${d.msg}`).join('; ')
  }
  return fallback
}

async function adminRequest(path, options = {}) {
  const token = getToken()
  // Gửi file (FormData) thì để trình duyệt tự đặt Content-Type kèm boundary
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
  }
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = formatDetail(body.detail, detail)
    } catch {
      /* response không phải JSON */
    }
    throw new Error(detail)
  }

  // Các lệnh DELETE trả 204 không có body — gọi res.json() sẽ lỗi dù thao tác đã thành công
  if (res.status === 204) return null
  return res.json()
}

const json = (method, body) => ({ method, body: JSON.stringify(body) })

export async function login(username, password) {
  const res = await fetch(`${ADMIN_API}/login`, {
    ...json('POST', { username, password }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(formatDetail(body.detail, 'Sai tên đăng nhập hoặc mật khẩu.'))
  }
  const data = await res.json()
  return data.access_token
}

export const adminApi = {
  me: () => adminRequest('/me'),
  topPlayed: (limit = 5, lang = 'vi') => adminRequest(`/stats/top-played?lang=${lang}&limit=${limit}`),

  // ---------- Hiện vật ----------
  listArtifacts: (q = '', limit = 200) => {
    const params = new URLSearchParams({ limit })
    if (q) params.set('q', q)
    return adminRequest(`/artifacts?${params}`)
  },
  getArtifact: (id) => adminRequest(`/artifacts/${id}`),
  createArtifact: (payload) => adminRequest('/artifacts', json('POST', payload)),
  updateArtifact: (id, payload) => adminRequest(`/artifacts/${id}`, json('PUT', payload)),
  deleteArtifact: (id) => adminRequest(`/artifacts/${id}`, { method: 'DELETE' }),

  // Tải ảnh lên -> trả về { url: '/uploads/artifacts/...' } để điền vào image_url
  uploadImage: (file) => {
    const form = new FormData()
    form.append('file', file)
    return adminRequest('/uploads/image', { method: 'POST', body: form })
  },

  // ---------- Bản dịch ----------
  addTranslation: (artifactId, payload) =>
    adminRequest(`/artifacts/${artifactId}/translations`, json('POST', payload)),
  updateTranslation: (artifactId, lang, payload) =>
    adminRequest(`/artifacts/${artifactId}/translations/${lang}`, json('PUT', payload)),
  deleteTranslation: (artifactId, lang) =>
    adminRequest(`/artifacts/${artifactId}/translations/${lang}`, { method: 'DELETE' }),

  // ---------- Phòng (danh sách phòng dùng chung API công khai GET /api/rooms) ----------
  createRoom: (payload) => adminRequest('/rooms', json('POST', payload)),
  updateRoom: (id, payload) => adminRequest(`/rooms/${id}`, json('PUT', payload)),
  deleteRoom: (id) => adminRequest(`/rooms/${id}`, { method: 'DELETE' }),

  // ---------- Tour ----------
  listTours: () => adminRequest('/tours'),
  getTour: (id) => adminRequest(`/tours/${id}`),
  createTour: (payload) => adminRequest('/tours', json('POST', payload)),
  updateTour: (id, payload) => adminRequest(`/tours/${id}`, json('PUT', payload)),
  deleteTour: (id) => adminRequest(`/tours/${id}`, { method: 'DELETE' }),
}
