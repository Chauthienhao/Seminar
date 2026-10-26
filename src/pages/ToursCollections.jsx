import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Search, Clock, MapPin, Loader2, ChevronDown } from 'lucide-react'

import { api } from '../lib/api.js'

export default function ToursCollections() {
  const [query, setQuery] = useState('')
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [expandedId, setExpandedId] = useState(null)
  const [stopsByTour, setStopsByTour] = useState({}) // cache: { [tourId]: TourStop[] }
  const [loadingStops, setLoadingStops] = useState(null)

  // GET /api/tours?lang=vi — chỉ cần gọi 1 lần, lọc theo từ khoá làm ngay trên client
  useEffect(() => {
    api
      .listTours('vi')
      .then(setTours)
      .catch(() => setError('Không thể kết nối tới máy chủ.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tours
    return tours.filter((t) => t.title.toLowerCase().includes(q))
  }, [query, tours])

  const toggleExpand = async (tourId) => {
    if (expandedId === tourId) {
      setExpandedId(null)
      return
    }
    setExpandedId(tourId)
    if (!stopsByTour[tourId]) {
      setLoadingStops(tourId)
      try {
        // Chỉ gọi GET /api/tours/{id} (có danh sách điểm dừng) khi người dùng thực sự mở ra xem
        const detail = await api.getTour(tourId, 'vi')
        setStopsByTour((prev) => ({ ...prev, [tourId]: detail.stops }))
      } catch {
        setStopsByTour((prev) => ({ ...prev, [tourId]: [] }))
      } finally {
        setLoadingStops(null)
      }
    }
  }

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold sm:text-4xl">Kho tàng tư liệu &amp; Tour tham quan</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-soft">
        Khám phá các lộ trình tour tham quan có sẵn của bảo tàng — bấm vào một tour để xem các điểm dừng theo thứ tự.
      </p>

      {/* Search */}
      <div className="mt-6 flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 sm:max-w-md">
        <Search size={16} className="text-ink-soft" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm tour theo tên..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/60"
        />
      </div>

      {/* Tours */}
      <div className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
          Lộ trình tour có sẵn nổi bật
        </p>

        {loading && (
          <p className="mt-4 flex items-center justify-center gap-2 py-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Đang tải danh sách tour...
          </p>
        )}

        {!loading && error && (
          <p className="mt-4 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-maroon">
            {error} Kiểm tra lại backend đã chạy ở <code>http://localhost:8000</code> chưa.
          </p>
        )}

        {!loading && !error && (
          <div className="mt-4 space-y-4">
            {filtered.map((tour) => (
              <div key={tour.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
                <button
                  onClick={() => toggleExpand(tour.id)}
                  className="group flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center"
                >
                  <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:w-40">
                    {tour.thumbnail_url && (
                      <img
                        src={tour.thumbnail_url}
                        alt={tour.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                      {tour.duration_minutes && (
                        <span className="flex items-center gap-1"><Clock size={12} /> Thời lượng {tour.duration_minutes} phút</span>
                      )}
                      <span className="flex items-center gap-1"><MapPin size={12} /> {tour.stop_count} điểm dừng</span>
                    </div>
                    <h3 className="mt-2 font-serif text-lg font-semibold">{tour.title}</h3>
                    {tour.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{tour.description}</p>}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 self-start text-ink-soft transition-transform sm:self-center ${
                      expandedId === tour.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedId === tour.id && (
                  <div className="border-t border-ink/10 bg-cream px-5 py-4">
                    {loadingStops === tour.id && (
                      <p className="flex items-center gap-2 text-sm text-ink-soft">
                        <Loader2 size={14} className="animate-spin" /> Đang tải điểm dừng...
                      </p>
                    )}
                    {loadingStops !== tour.id && (stopsByTour[tour.id]?.length ?? 0) === 0 && (
                      <p className="text-sm text-ink-soft">Tour này chưa có điểm dừng nào.</p>
                    )}
                    {loadingStops !== tour.id && (stopsByTour[tour.id]?.length ?? 0) > 0 && (
                      <ol className="space-y-2">
                        {stopsByTour[tour.id].map((stop) => (
                          <li key={stop.artifact.id}>
                            <NavLink
                              to={`/hien-vat/${stop.artifact.id}`}
                              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-paper"
                            >
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon/10 text-[11px] font-semibold text-maroon">
                                {stop.step_order}
                              </span>
                              <span className="font-medium text-ink">{stop.artifact.title}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink-soft">
                Không tìm thấy tour phù hợp. Hãy thử từ khoá khác.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
