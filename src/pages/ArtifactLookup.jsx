import { useMemo, useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { Search, Smartphone, ArrowRight } from 'lucide-react'

// Dữ liệu mẫu để duyệt nhanh trên desktop — sau này thay bằng gọi API:
// GET /api/artifacts?q=...
const POPULAR_ARTIFACTS = [
  {
    slug: 'an-dong-ta-quan-le-van-duyet',
    code: 'SG-1822',
    title: 'Ấn đồng Tả quân Lê Văn Duyệt',
    tag: 'Triều Nguyễn — thế kỷ 19',
  },
  {
    slug: 'ban-do-hoa-do-gia-dinh-thanh',
    code: 'SG-1815',
    title: 'Bản đồ họa đồ Gia Định Thành',
    tag: 'Quy hoạch Sài Gòn — đầu thế kỷ 19',
  },
  {
    slug: 'tranh-son-mai-sai-gon-gia-dinh',
    code: 'SG-1930',
    title: 'Tranh sơn mài Sài Gòn — Gia Định',
    tag: 'Nghệ thuật Nam Bộ',
  },
]

export default function ArtifactLookup() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return POPULAR_ARTIFACTS
    return POPULAR_ARTIFACTS.filter(
      (a) => a.title.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
    )
  }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    // TODO: gọi API backend Python để tra cứu chính xác theo mã, ví dụ:
    // const res = await fetch(`/api/artifacts/lookup?code=${q}`)
    const exact = POPULAR_ARTIFACTS.find((a) => a.code.toLowerCase() === q.toLowerCase())
    navigate(`/hien-vat/${exact ? exact.slug : encodeURIComponent(q.toLowerCase())}`)
  }

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">Tra cứu hiện vật</p>
      <h1 className="mt-2 max-w-xl text-3xl font-semibold sm:text-4xl">
        Tìm hiện vật bạn đang quan tâm
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
        Nhập mã hoặc tên hiện vật để xem thông tin chi tiết và nghe thuyết minh — phù hợp khi bạn
        tra cứu trước chuyến đi hoặc xem lại tại nhà bằng máy tính.
      </p>

      {/* Search */}
      <form onSubmit={handleSubmit} className="mt-7 flex max-w-lg gap-2">
        <div className="flex w-full items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 focus-within:border-maroon">
          <Search size={16} className="shrink-0 text-ink-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập mã hoặc tên hiện vật (Ví dụ: SG-1822)..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/60"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700"
        >
          Tra cứu
        </button>
      </form>

      {/* Mobile app callout */}
      <div className="mt-7 flex max-w-xl items-start gap-3 rounded-2xl border border-maroon/20 bg-maroon/5 p-5">
        <Smartphone size={20} className="mt-0.5 shrink-0 text-maroon" />
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            Đang tham quan tại bảo tàng?
            <span className="rounded-full bg-maroon px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
              Sắp ra mắt
            </span>
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Tính năng quét mã QR bằng camera để nghe thuyết minh tức thì sẽ có trên{' '}
            <strong className="text-ink">ứng dụng di động</strong> (React Native), tối ưu riêng cho
            việc di chuyển và quét trực tiếp trong không gian trưng bày.
          </p>
        </div>
      </div>

      {/* Browse list */}
      <div className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
          {query.trim() ? `Kết quả cho "${query.trim()}"` : 'Hiện vật được xem nhiều'}
        </p>
        <div className="mt-4 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-paper">
          {results.map((a) => (
            <NavLink
              key={a.slug}
              to={`/hien-vat/${a.slug}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-cream"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {a.code} · {a.tag}
                </p>
                <p className="mt-1 font-serif text-base font-semibold text-ink">{a.title}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-maroon" />
            </NavLink>
          ))}
          {results.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">
              Không tìm thấy hiện vật phù hợp. Hãy thử mã hoặc từ khoá khác.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
