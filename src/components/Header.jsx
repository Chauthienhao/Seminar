import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, Search } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/tra-cuu-hien-vat', label: 'Tra cứu hiện vật' },
  { to: '/hien-vat/an-dong-ta-quan-le-van-duyet', label: 'Chi tiết hiện vật' },
  { to: '/ban-do', label: 'Bản đồ tham quan' },
  { to: '/bo-suu-tap', label: 'Bộ sưu tập & Lộ trình' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState('VI')

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon font-serif text-base font-semibold text-cream">
            M
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-sm font-semibold tracking-tight text-ink sm:text-base">
              BẢO TÀNG THÀNH PHỐ HỒ CHÍ MINH
            </span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              Audio Guide &amp; Digital Map
            </span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-maroon ${
                  isActive ? 'text-maroon' : 'text-ink-soft'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={() => setLang(lang === 'VI' ? 'EN' : 'VI')}
            className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-maroon hover:text-maroon"
            aria-label="Đổi ngôn ngữ"
          >
            {lang} / {lang === 'VI' ? 'EN' : 'VI'}
          </button>
          <NavLink
            to="/tra-cuu-hien-vat"
            className="flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700"
          >
            <Search size={16} />
            Tra cứu hiện vật
          </NavLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Mở menu"
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="border-t border-ink/10 bg-cream px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-sand text-maroon' : 'text-ink-soft'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/tra-cuu-hien-vat"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-maroon px-4 py-2.5 text-sm font-semibold text-cream"
            >
              <Search size={16} />
              Tra cứu hiện vật
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}
