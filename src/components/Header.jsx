import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, Search } from 'lucide-react'

import { useLang } from '../lib/i18n.jsx'

const NAV_LINKS = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/tra-cuu-hien-vat', labelKey: 'nav.lookup' },
  { to: '/ban-do', labelKey: 'nav.map' },
  { to: '/bo-suu-tap', labelKey: 'nav.tours' },
]

/** Nút VI | EN — ngôn ngữ đang chọn được tô đậm, bấm để đổi cho toàn site. */
function LanguageSwitch({ className = '' }) {
  const { lang, toggleLang, t } = useLang()
  return (
    <button
      onClick={toggleLang}
      className={`rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-maroon hover:text-maroon ${className}`}
      aria-label={t('header.switchLang')}
      title={t('header.switchLang')}
    >
      <span className={lang === 'vi' ? 'text-maroon' : 'opacity-60'}>VI</span>
      <span className="mx-1 opacity-40">/</span>
      <span className={lang === 'en' ? 'text-maroon' : 'opacity-60'}>EN</span>
    </button>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const { t } = useLang()

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
              {t('header.museumName')}
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
              {t(link.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch />
          <NavLink
            to="/tra-cuu-hien-vat"
            className="flex items-center gap-2 rounded-full bg-maroon px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700"
          >
            <Search size={16} />
            {t('nav.lookup')}
          </NavLink>
        </div>

        {/* Mobile: nút ngôn ngữ luôn hiện (không cần mở menu) + nút menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitch />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15"
            onClick={() => setOpen((v) => !v)}
            aria-label={t('header.openMenu')}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
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
                {t(link.labelKey)}
              </NavLink>
            ))}
            <NavLink
              to="/tra-cuu-hien-vat"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-maroon px-4 py-2.5 text-sm font-semibold text-cream"
            >
              <Search size={16} />
              {t('nav.lookup')}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}
