import { useEffect, useState } from 'react'
import { NavLink, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Loader2, MapPin } from 'lucide-react'

import { api, ApiError } from '../lib/api.js'

/**
 * Route /diem/:code — trang của một điểm tham quan (POI).
 * Mở tới đây khi quét QR tại POI có nhiều hiện vật (tủ trưng bày) hoặc không có hiện vật nào
 * (lối vào, quầy thông tin...). POI chỉ có 1 hiện vật thì /q/:code mở thẳng trang hiện vật.
 * ?src=qr được chuyển tiếp sang trang hiện vật để thống kê ghi đúng QR_SCAN.
 */
export default function PoiDetail() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const fromQr = searchParams.get('src') === 'qr'
  const [poi, setPoi] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setPoi(null)
    setError(null)
    api
      .lookupPoiByCode(code, 'vi')
      .then((data) => active && setPoi(data))
      .catch((err) => active && setError(err instanceof ApiError && err.status === 404 ? 'not_found' : 'network'))
    return () => {
      active = false
    }
  }, [code])

  if (error) {
    return (
      <section className="mx-auto max-w-content px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">
          {error === 'not_found' ? 'Không tìm thấy điểm tham quan này' : 'Không thể kết nối tới máy chủ'}
        </h1>
        <NavLink to="/tra-cuu-hien-vat" className="mt-6 inline-block text-sm font-semibold text-maroon">
          ← Quay lại trang Tra cứu hiện vật
        </NavLink>
      </section>
    )
  }

  if (!poi) {
    return (
      <section className="mx-auto flex max-w-content items-center justify-center gap-2 px-4 py-24 text-sm text-ink-soft">
        <Loader2 size={18} className="animate-spin" /> Đang tải điểm tham quan...
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
        <MapPin size={13} /> {poi.code}
        {poi.room ? ` — ${poi.room.name_vi}` : ''}
      </p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{poi.name_vi}</h1>
      {poi.description_vi && <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{poi.description_vi}</p>}

      {poi.artifacts.length > 0 && (
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
            Hiện vật tại điểm này ({poi.artifacts.length})
          </p>
          <div className="mt-4 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-paper">
            {poi.artifacts.map((a) => (
              <NavLink
                key={a.id}
                to={`/hien-vat/${a.id}${fromQr ? '?src=qr' : ''}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-cream"
              >
                <div className="flex items-center gap-4">
                  {a.image_url && <img src={a.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
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
      )}
    </section>
  )
}
