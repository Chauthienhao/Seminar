import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Search, Clock, MapPin, ArrowRight, Loader2 } from 'lucide-react'

import { api } from '../lib/api.js'
import { useLang } from '../lib/i18n.jsx'

export default function Home() {
  const [artifacts, setArtifacts] = useState([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(true)
  const { lang, t } = useLang()

  // Tạm thời lấy 3 hiện vật đầu tiên từ API làm "nổi bật" — backend chưa có cờ
  // is_featured riêng, có thể bổ sung cột này vào bảng `artifacts` sau nếu cần.
  useEffect(() => {
    let active = true
    setLoadingArtifacts(true)
    api
      .searchArtifacts(undefined, lang)
      .then((list) => active && setArtifacts(list.slice(0, 3)))
      .catch(() => active && setArtifacts([]))
      .finally(() => active && setLoadingArtifacts(false))
    return () => {
      active = false
    }
  }, [lang])

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-content px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">{t('home.eyebrow')}</p>
        <div className="mt-4 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{t('home.heroTitle')}</h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">{t('home.heroDesc')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <NavLink
                to="/tra-cuu-hien-vat"
                className="flex items-center gap-2 rounded-full bg-maroon px-5 py-3 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700"
              >
                <Search size={17} />
                {t('home.ctaLookup')}
              </NavLink>
              <NavLink
                to="/bo-suu-tap"
                className="flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-maroon hover:text-maroon"
              >
                {t('home.ctaCollections')}
              </NavLink>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop"
              alt={t('home.heroImageAlt')}
              className="h-72 w-full object-cover sm:h-96"
            />
          </div>
        </div>
      </section>

      {/* 3-step guide */}
      <section className="border-y border-ink/10 bg-paper">
        <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">{t('home.stepsTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-soft">{t('home.stepsSubtitle')}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {t('home.steps').map((step, i) => (
              <div key={i} className="rounded-2xl border border-ink/10 bg-cream p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon/10 text-sm font-semibold text-maroon">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured artifacts */}
      <section className="mx-auto max-w-content px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">{t('home.featuredEyebrow')}</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{t('home.featuredTitle')}</h2>
          </div>
          <NavLink
            to="/bo-suu-tap"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-maroon sm:flex"
          >
            {t('home.seeAllCollections')} <ArrowRight size={15} />
          </NavLink>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {loadingArtifacts && (
            <p className="col-span-3 flex items-center justify-center gap-2 py-10 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> {t('home.loadingArtifacts')}
            </p>
          )}

          {!loadingArtifacts && artifacts.length === 0 && (
            <p className="col-span-3 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink-soft">
              {t('home.noArtifacts')}
            </p>
          )}

          {!loadingArtifacts &&
            artifacts.map((a) => (
              <NavLink
                key={a.id}
                to={`/hien-vat/${a.id}`}
                className="group overflow-hidden rounded-2xl border border-ink/10 bg-paper transition-shadow hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-sand">
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-5">
                  {a.period && <p className="text-xs font-semibold uppercase tracking-wide text-maroon">{a.period}</p>}
                  <h3 className="mt-2 font-serif text-lg font-semibold">{a.title}</h3>
                </div>
              </NavLink>
            ))}
        </div>
      </section>

      {/* Practical info */}
      <section className="border-t border-ink/10 bg-paper">
        <div className="mx-auto grid max-w-content gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">{t('home.infoTitle')}</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{t('home.infoDesc')}</p>
            <div className="mt-6 space-y-3 text-sm text-ink-soft">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-maroon" />
                {t('home.openingHours')}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-maroon" />
                {t('home.address')}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-ink/10 bg-cream p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t('home.ticketLocal')}</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-maroon">30.000 VNĐ</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">{t('home.ticketLocalNote')}</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-cream p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t('home.ticketForeign')}</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-maroon">40.000 VNĐ</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">{t('home.ticketForeignNote')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
