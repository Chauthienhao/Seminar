import { useEffect, useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { Search, ScanLine, ArrowRight, Loader2 } from 'lucide-react'

import QrScannerModal from '../components/QrScannerModal.jsx'
import { api, ApiError } from '../lib/api.js'
import { useLang } from '../lib/i18n.jsx'

const DEBOUNCE_MS = 350

export default function ArtifactLookup() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [lookupError, setLookupError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const navigate = useNavigate()
  const { lang, t } = useLang()

  // Quét được mã -> đi qua /q/:code giống hệt khi quét bằng camera điện thoại (ghi QR_SCAN)
  const handleScanned = (code) => navigate(`/q/${encodeURIComponent(code)}`)

  // Gọi GET /api/artifacts?q=...&lang=... mỗi khi query hoặc ngôn ngữ đổi (debounce để không gọi liên tục khi gõ)
  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setLoading(true)
      setListError(null)
      api
        .searchArtifacts(query.trim() || undefined, lang)
        .then((list) => active && setResults(list))
        .catch((err) => active && setListError(err instanceof ApiError ? err.message : t('common.networkError')))
        .finally(() => active && setLoading(false))
    }, DEBOUNCE_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, lang, t])

  // Đổi ngôn ngữ thì thông báo lỗi tra cứu cũ (đang ở ngôn ngữ kia) không còn hợp lệ
  useEffect(() => setLookupError(null), [lang])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = query.trim()
    if (!code) return

    setSubmitting(true)
    setLookupError(null)
    try {
      // Thử tra cứu CHÍNH XÁC theo mã hiện vật trước (GET /api/artifacts/lookup/{code})
      const artifact = await api.lookupArtifactByCode(code, lang)
      navigate(`/hien-vat/${artifact.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLookupError(t('lookup.notFound', { code }))
      } else {
        setLookupError(t('common.networkRetry'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">{t('lookup.eyebrow')}</p>
      <h1 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">{t('lookup.title')}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{t('lookup.desc')}</p>

      {/* Search */}
      <form onSubmit={handleSubmit} className="mt-7 flex max-w-lg gap-2">
        <div className="flex w-full items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 focus-within:border-maroon">
          <Search size={16} className="shrink-0 text-ink-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('lookup.placeholder')}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/60"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700 disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {t('lookup.submit')}
        </button>
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-maroon/40 bg-paper px-4 py-2.5 text-sm font-semibold text-maroon transition-colors hover:bg-maroon/5"
        >
          <ScanLine size={16} />
          <span className="hidden sm:inline">{t('lookup.scanQr')}</span>
        </button>
      </form>
      {lookupError && <p className="mt-2 max-w-lg text-sm text-maroon">{lookupError}</p>}

      {/* Hướng dẫn quét QR tại bảo tàng */}
      <div className="mt-7 flex max-w-xl items-start gap-3 rounded-2xl border border-maroon/20 bg-maroon/5 p-5">
        <ScanLine size={20} className="mt-0.5 shrink-0 text-maroon" />
        <div>
          <p className="text-sm font-semibold text-ink">{t('lookup.atMuseumTitle')}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {t('lookup.atMuseumBefore')} <strong className="text-ink">{t('lookup.atMuseumCamera')}</strong>{' '}
            {t('lookup.atMuseumMiddle')}{' '}
            <button type="button" onClick={() => setScannerOpen(true)} className="font-semibold text-maroon underline-offset-2 hover:underline">
              {t('lookup.scanQr')}
            </button>{' '}
            {t('lookup.atMuseumAfter')}
          </p>
        </div>
      </div>

      {/* Browse list */}
      <div className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
          {query.trim() ? t('lookup.resultsFor', { query: query.trim() }) : t('lookup.mostViewed')}
        </p>

        <div className="mt-4 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-paper">
          {loading && (
            <p className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> {t('lookup.loadingList')}
            </p>
          )}

          {!loading && listError && (
            <p className="px-5 py-8 text-center text-sm text-maroon">
              {listError} — {t('common.serverDown')}
            </p>
          )}

          {!loading && !listError && results.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">
              {t('lookup.noResults')}
            </p>
          )}

          {!loading &&
            !listError &&
            results.map((a) => (
              <NavLink
                key={a.id}
                to={`/hien-vat/${a.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-cream"
              >
                <div className="flex items-center gap-4">
                  {a.image_url && (
                    <img src={a.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      {a.code}
                      {a.period ? ` · ${a.period}` : ''}
                    </p>
                    <p className="mt-1 font-serif text-base font-semibold text-ink">{a.title}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="shrink-0 text-maroon" />
              </NavLink>
            ))}
        </div>
      </div>

      {scannerOpen && <QrScannerModal onClose={() => setScannerOpen(false)} onDetected={handleScanned} />}
    </section>
  )
}
