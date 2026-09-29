import { NavLink } from 'react-router-dom'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-navy-800 text-cream/85">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <h3 className="font-serif text-lg font-semibold text-cream">Bảo tàng Thành phố Hồ Chí Minh</h3>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Tòa nhà Gia Long cổ kính mang dấu ấn di sản kiến trúc, lịch sử đặc sắc của đất Sài Gòn — TP Hồ Chí Minh
            hơn 300 năm hình thành và phát triển.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream">Khám phá</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li><NavLink to="/" className="hover:text-cream">Hiện vật nổi bật</NavLink></li>
            <li><NavLink to="/bo-suu-tap" className="hover:text-cream">Bộ sưu tập nổi bật</NavLink></li>
            <li><NavLink to="/ban-do" className="hover:text-cream">Bản đồ 3D</NavLink></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream">Hỗ trợ</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li><NavLink to="/tra-cuu-hien-vat" className="hover:text-cream">Tra cứu hiện vật</NavLink></li>
            <li><a href="#faq" className="hover:text-cream">Câu hỏi thường gặp</a></li>
            <li><a href="#help" className="hover:text-cream">Giúp đỡ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream">Thông tin liên hệ</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-cream/70">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-maroon" />
              65 Lý Tự Trọng, Bến Nghé, Quận 1, TP Hồ Chí Minh
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-maroon" />
              (028) 3829 9483
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-maroon" />
              info@hcmc-museum.gov.vn
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-cream/50 sm:flex-row sm:px-6">
          <p>© {year} Bảo tàng Thành phố Hồ Chí Minh. Thiết kế bản đường trải nghiệm cho người cao tuổi.</p>
          <div className="flex items-center gap-4">
            <a href="#terms" className="hover:text-cream/80">Điều khoản sử dụng</a>
            <a href="#privacy" className="hover:text-cream/80">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
