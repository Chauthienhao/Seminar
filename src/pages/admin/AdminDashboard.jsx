import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Lock, LogOut, Loader2, LayoutDashboard, Landmark, DoorOpen, MapPin, Route as RouteIcon } from 'lucide-react'

import { adminApi, AUTH_EXPIRED_EVENT, clearToken, getToken, login, saveToken } from '../../lib/adminApi.js'
import { FeedbackProvider } from './components/Feedback.jsx'
import AdminOverview from './AdminOverview.jsx'
import ArtifactsAdmin from './ArtifactsAdmin.jsx'
import PoisAdmin from './PoisAdmin.jsx'
import RoomsAdmin from './RoomsAdmin.jsx'
import ToursAdmin from './ToursAdmin.jsx'

/**
 * Điểm vào khu CMS (route /admin/*).
 * Logic: nếu CHƯA có token trong sessionStorage -> hiện <LoginForm/>.
 * Sau khi đăng nhập -> khung CMS gồm menu bên trái + các trang con:
 *   /admin           Tổng quan
 *   /admin/hien-vat  Hiện vật + bản dịch
 *   /admin/diem      Điểm tham quan (POI): mã QR, vị trí GPS
 *   /admin/phong     Phòng trưng bày
 *   /admin/tour      Tuyến tham quan
 * Mọi request đi qua src/lib/adminApi.js (tự kèm header Authorization).
 *
 * Khu này KHÔNG dùng chung <Header/>/<Footer/> của site khách tham quan —
 * xem giải thích đầy đủ ở cuối file.
 */

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/hien-vat', label: 'Hiện vật', icon: Landmark },
  { to: '/admin/diem', label: 'Điểm tham quan', icon: MapPin },
  { to: '/admin/phong', label: 'Phòng', icon: DoorOpen },
  { to: '/admin/tour', label: 'Tour', icon: RouteIcon },
]

export default function AdminDashboard() {
  const [token, setToken] = useState(getToken())

  // adminApi phát sự kiện này khi backend trả 401 -> quay về form đăng nhập
  useEffect(() => {
    const onExpired = () => setToken(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

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
    <FeedbackProvider>
      <AdminLayout
        onLogout={() => {
          clearToken()
          setToken(null)
        }}
      />
    </FeedbackProvider>
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
      onSuccess(await login(username, password))
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
          Tạo tài khoản bằng lệnh <code>python create_admin.py</code> trong thư mục backend.
        </p>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------
// Khung CMS sau khi đăng nhập: menu trái + nội dung trang con
// ---------------------------------------------------------------------
function AdminLayout({ onLogout }) {
  const [me, setMe] = useState(null)

  useEffect(() => {
    adminApi.me().then(setMe).catch(() => {}) // lỗi 401 đã được adminApi xử lý (quay về đăng nhập)
  }, [])

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-navy-800 text-cream">
        <div className="flex items-center gap-2.5 border-b border-cream/10 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon font-serif font-semibold">M</span>
          <span className="leading-tight">
            <span className="block font-serif text-sm font-semibold">BẢO TÀNG TP.HCM</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-cream/60">Quản trị nội dung</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-cream/10 text-cream' : 'text-cream/70 hover:bg-cream/5 hover:text-cream'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-cream/10 px-5 py-4">
          {me && (
            <p className="mb-3 text-sm">
              <span className="block font-semibold">{me.full_name || me.username}</span>
              <span className="text-xs text-cream/60">{me.role}</span>
            </p>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-full border border-cream/20 px-3 py-1.5 text-xs font-semibold text-cream/80 transition-colors hover:border-cream/50 hover:text-cream"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-8">
        <Routes>
          <Route index element={<AdminOverview me={me} />} />
          <Route path="hien-vat" element={<ArtifactsAdmin />} />
          <Route path="diem" element={<PoisAdmin />} />
          <Route path="phong" element={<RoomsAdmin />} />
          <Route path="tour" element={<ToursAdmin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
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
 * Cách tổ chức (xem App.jsx):
 *   /            -> site khách, dùng <Header/>/<Footer/> công khai
 *   /tra-cuu...  -> site khách
 *   /admin/*     -> ĐƯỜNG DẪN RIÊNG, route thẳng tới trang này
 *                   (không lồng trong <Header/>/<Footer/> của khách)
 *
 * Vì sao tách riêng thay vì cho nút "Đăng nhập" lên Header công khai:
 * - Khách tham quan không cần thấy nút đăng nhập — đỡ rối giao diện và
 *   tránh gây hiểu lầm "phải đăng nhập mới xem được".
 * - CMS có layout khác hẳn (sidebar, bảng dữ liệu...) thay vì
 *   Header/Footer kiểu landing page — nên tách hẳn cây component.
 * - Bảo mật: route /admin/* có thể dễ dàng chặn index bởi công cụ tìm
 *   kiếm (robots.txt), hoặc giới hạn theo IP nội bộ sau này mà không
 *   ảnh hưởng gì tới site công khai.
 *
 * Token lưu ở đâu? sessionStorage (tự xoá khi đóng tab) — phù hợp với máy
 * dùng chung (quầy lễ tân bảo tàng). Nếu muốn nhân viên khỏi đăng nhập lại
 * mỗi lần mở trình duyệt, đổi sessionStorage thành localStorage trong
 * src/lib/adminApi.js — đánh đổi là token tồn tại lâu hơn trên máy đó.
 */
