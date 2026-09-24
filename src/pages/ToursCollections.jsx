import { useMemo, useState } from 'react'
import { Search, Clock, MapPin } from 'lucide-react'

const TOPICS = [
  'Tất cả chủ đề',
  'Lịch sử kiến trúc Gia Long (30p)',
  'Kháng chiến Sài Gòn (45p)',
  'Thương mại và Dịch vụ Gia Định (30p)',
]

const TOURS = [
  {
    id: 'dau-an-kien-truc-gia-long',
    title: 'Dấu ấn kiến trúc Gia Long',
    desc: 'Khám phá kiệt tác kiến trúc Pháp cổ điển và di sản của toà nhà Gia Long xuyên suốt hơn 100 năm lịch sử.',
    duration: '30 phút',
    stops: '8 điểm dừng',
    topic: TOPICS[1],
  },
  {
    id: 'thuong-cang-sai-gon-hon-ngoc-vien-dong',
    title: 'Thương cảng Sài Gòn - Hòn ngọc Viễn Đông',
    desc: 'Tìm hiểu quá trình thương cảng nhộn nhịp bậc nhất Đông Dương, dấu tích thời kỳ vàng son của giao thương quốc tế.',
    duration: '45 phút',
    stops: '10 điểm dừng',
    topic: TOPICS[3],
  },
  {
    id: 'khang-chien-sai-gon-gia-dinh',
    title: 'Kháng chiến Sài Gòn — Gia Định',
    desc: 'Theo dấu những sự kiện lịch sử quan trọng của Sài Gòn trong hai cuộc kháng chiến giữ nước.',
    duration: '45 phút',
    stops: '9 điểm dừng',
    topic: TOPICS[2],
  },
]

export default function ToursCollections() {
  const [query, setQuery] = useState('')
  const [activeTopic, setActiveTopic] = useState(TOPICS[0])

  const filtered = useMemo(() => {
    return TOURS.filter((t) => {
      const matchesTopic = activeTopic === TOPICS[0] || t.topic === activeTopic
      const matchesQuery = t.title.toLowerCase().includes(query.trim().toLowerCase())
      return matchesTopic && matchesQuery
    })
  }, [query, activeTopic])

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold sm:text-4xl">Kho tàng tư liệu &amp; Tour tham quan</h1>
      <p className="mt-2 max-w-lg text-sm text-ink-soft">
        Lưu theo chủ đề, khám phá về lịch sử quan tâm bằng các lộ trình tour tham quan có sẵn của bảo tàng.
      </p>

      {/* Search */}
      <div className="mt-6 flex items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 sm:max-w-md">
        <Search size={16} className="text-ink-soft" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm hiện vật, chủ đề, tour..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/60"
        />
      </div>

      {/* Topic filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeTopic === topic
                ? 'border-maroon bg-maroon text-cream'
                : 'border-ink/15 text-ink-soft hover:border-maroon hover:text-maroon'
            }`}
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Tours */}
      <div className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
          Lộ trình tour có sẵn nổi bật
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {filtered.map((tour) => (
            <a
              key={tour.id}
              href={`#tour-${tour.id}`}
              className="group overflow-hidden rounded-2xl border border-ink/10 bg-paper transition-shadow hover:shadow-md sm:flex"
            >
              <div className="aspect-[4/3] shrink-0 overflow-hidden bg-sand sm:w-44">
                <img
                  src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop"
                  alt={tour.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-5">
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  <span className="flex items-center gap-1"><Clock size={12} /> Thời lượng {tour.duration}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {tour.stops}</span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-semibold">{tour.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{tour.desc}</p>
              </div>
            </a>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink-soft">
              Không tìm thấy tour phù hợp. Hãy thử từ khoá hoặc chủ đề khác.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
