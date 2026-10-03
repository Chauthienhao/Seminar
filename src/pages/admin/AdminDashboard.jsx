import { useEffect, useState } from 'react'
import { Lock, LogOut, Loader2, Headphones, Clock3 } from 'lucide-react'

/**
 * Trang CMS — gộp cả form đăng nhập lẫn dashboard trong 1 file cho gọn.
 * Logic: nếu CHƯA có token hợp lệ trong sessionStorage -> hiện <LoginForm/>.
 * Sau khi đăng nhập thành công -> hiện <Dashboard/>, mọi request kèm theo
 * header "Authorization: Bearer <token>".
 *
 * Cách gắn vào router (App.jsx):
 *   import AdminDashboard from './pages/admin/AdminDashboard.jsx'
 *   <Route path="/admin" element={<AdminDashboard />} />
 *
 * Trang này KHÔNG dùng chung <Header/>/<Footer/> của site khách tham quan —
 * xem giải thích đầy đủ ở cuối file.
 */

const ADMIN_API = '/api/admin'
const TOKEN_KEY = 'museum_admin_token'

const getToken = () => sessionStorage.getItem(TOKEN_KEY)
const saveToken = (t) => sessionStorage.setItem(TOKEN_KEY, t)
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY)

async function adminRequest(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${ADMIN_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (res.status === 401) {
    clearToken()
    throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
  }
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      /* response không phải JSON */
    }
    throw new Error(detail)
  }
  return res.json()
}

export default function AdminDashboard() {
  const [token, setToken] = useState(getToken())

  if (!token) {
    return (
      <LoginForm
        onSuccess={(newToken) => {
          saveToken(newToken)
          setToken(newToken)
        }}
      />
    )
  }

  return (
    <Dashboard
      onLogout={() => {
        clearToken()
        setToken(null)
      }}
    />
  )
}

// ---------------------------------------------------------------------
// Form đăng nhập
// ---------------------------------------------------------------------
function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // POST /api/admin/login — không cần token, trả về { access_token, token_type }
      const res = await fetch(`${ADMIN_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Sai tên đăng nhập hoặc mật khẩu.')
      }
      const data = await res.json()
      onSuccess(data.access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-paper p-8 shadow-sm">
        <div className="mb-5 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream">
            <Lock size={20} />
          </span>
        </div>
        <h1 className="text-center text-xl font-semibold text-ink">Đăng nhập quản trị</h1>
        <p className="mt-1 text-center text-sm text-ink-soft">Bảo tàng Thành phố Hồ Chí Minh — CMS</p>

        <label className="mt-6 block text-sm font-medium text-ink" htmlFor="username">
          Tên đăng nhập
        </label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-maroon"
        />

        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="password">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-maroon"
        />

        {error && <p className="mt-3 text-sm text-maroon">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700 disabled:opacity-60"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Đăng nhập
        </button>

        <p className="mt-4 text-center text-xs text-ink-soft">
          Tài khoản mẫu sau khi seed dữ liệu: <code>admin</code> / mật khẩu bạn đã đặt khi tạo hash.
        </p>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------
// Dashboard sau khi đăng nhập
// ---------------------------------------------------------------------
function Dashboard({ onLogout }) {
  const [me, setMe] = useState(null)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      adminRequest('/me'), // GET /api/admin/me
      adminRequest('/stats/top-played?lang=vi&limit=5'), // GET /api/admin/stats/top-played
    ])
      .then(([meData, statsData]) => {
        setMe(meData)
        setStats(statsData)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      {/* Thanh điều hướng riêng của khu CMS — KHÔNG dùng chung Header của site khách */}
      <header className="border-b border-ink/10 bg-navy-800 text-cream">
        <div className="mx-auto flex max-w-content items-center justify-between px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold">Bảo tàng TP.HCM — Trang quản trị</p>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1.5 text-xs font-semibold text-cream/80 transition-colors hover:border-cream/50 hover:text-cream"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-content px-4 py-10 sm:px-6">
        {error && (
          <div className="mb-6 rounded-xl border border-maroon/30 bg-maroon/5 p-4 text-sm text-maroon">{error}</div>
        )}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Đang tải dữ liệu...
          </p>
        ) : (
          <>
            {me && (
              <h1 className="text-2xl font-semibold text-ink">
                Chào {me.full_name || me.username} <span className="text-ink-soft">({me.role})</span>
              </h1>
            )}

            <p className="mt-1 text-sm text-ink-soft">
              Đây là bản demo tối giản — chỉ đọc thống kê. Các form tạo/sửa hiện vật, tour, phòng
              (gọi <code>POST/PUT/DELETE /api/admin/...</code>) có thể bổ sung thêm theo cùng mẫu
              <code> adminRequest()</code> trong file này.
            </p>

            <section className="mt-8 rounded-2xl border border-ink/10 bg-paper p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Headphones size={16} className="text-maroon" />
                Top hiện vật được nghe nhiều nhất
              </div>

              {stats.length === 0 ? (
                <p className="mt-4 text-sm text-ink-soft">Chưa có lượt phát nào được ghi nhận.</p>
              ) : (
                <ul className="mt-4 divide-y divide-ink/10">
                  {stats.map((s, i) => (
                    <li key={s.artifact_id} className="flex items-center justify-between py-3 text-sm">
                      <span className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-maroon/10 text-xs font-semibold text-maroon">
                          {i + 1}
                        </span>
                        <span className="font-medium text-ink">{s.title}</span>
                      </span>
                      <span className="flex items-center gap-4 text-ink-soft">
                        <span>{s.play_count} lượt phát</span>
                        <span className="flex items-center gap-1">
                          <Clock3 size={13} /> {Math.round(s.total_listen_seconds / 60)} phút nghe
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

/**
 * ---------------------------------------------------------------------
 * VÌ SAO FORM ĐĂNG NHẬP KHÔNG NẰM Ở HEADER CHUNG?
 * ---------------------------------------------------------------------
 * Site khách tham quan (Home, ArtifactLookup, ArtifactDetail, MuseumMap,
 * ToursCollections) là nội dung CÔNG KHAI — khách không cần biết đăng
 * nhập là gì để xem hiện vật, nghe thuyết minh. Vì vậy Header.jsx hiện
 * tại KHÔNG có nút đăng nhập — đúng như đề bài: chỉ CMS (admin) mới cần
 * xác thực.
 *
 * Cách tổ chức phổ biến cho 1 web vừa có site công khai vừa có CMS:
 *   /            -> site khách, dùng <Header/>/<Footer/> công khai
 *   /tra-cuu...  -> site khách
 *   /admin       -> ĐƯỜNG DẪN RIÊNG, route thẳng tới trang này
 *                   (không lồng trong <Header/>/<Footer/> của khách)
 *   /admin/login -> (tuỳ chọn) có thể tách thành route riêng thay vì
 *                   gộp chung 1 file như ở đây, khi CMS phình to hơn
 *
 * Vì sao tách riêng thay vì cho nút "Đăng nhập" lên Header công khai:
 * - Khách tham quan không cần thấy nút đăng nhập — đỡ rối giao diện và
 *   tránh gây hiểu lầm "phải đăng nhập mới xem được".
 * - CMS thường có layout khác hẳn (sidebar, bảng dữ liệu...) thay vì
 *   Header/Footer kiểu landing page — nên tách hẳn cây component.
 * - Bảo mật: route /admin/* có thể dễ dàng chặn index bởi công cụ tìm
 *   kiếm (robots.txt), hoặc giới hạn theo IP nội bộ sau này mà không
 *   ảnh hưởng gì tới site công khai.
 *
 * Token lưu ở đâu? File này dùng sessionStorage (tự xoá khi đóng tab) —
 * phù hợp với máy dùng chung (quầy lễ tân bảo tàng). Nếu muốn nhân viên
 * khỏi đăng nhập lại mỗi lần mở trình duyệt, đổi sessionStorage thành
 * localStorage — đánh đổi là token tồn tại lâu hơn trên máy đó.
 */
