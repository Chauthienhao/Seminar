import { useEffect, useState } from 'react'
import { adminApi } from '../../lib/adminApi.js'
import { Button, ErrorBox, Field, inputClass, LoadingRow } from './components/ui.jsx'
import RoomHeatmap from './components/RoomHeatmap.jsx'

function initialDates() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  const format = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start_date: format(start), end_date: format(end), lang: 'vi' }
}
const seconds = value => value === null ? 'Chưa có dữ liệu' : `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giây`
const languageName = code => ({ vi: 'Tiếng Việt', en: 'English' }[code] || code)
const languageColor = code => code === 'vi' ? '#A6321E' : code === 'en' ? '#1B2340' : '#786747'

export default function AdminAnalytics() {
  const [filters, setFilters] = useState(initialDates)
  const [query, setQuery] = useState(filters)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    adminApi.analytics(query).then(result => { if (active) setData(result) })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query])

  const daily = new Map()
  if (data) {
    // Include zero-listen dates rather than leaving misleading gaps in the chart.
    const end = new Date(`${data.end_date}T00:00:00Z`)
    for (let day = new Date(`${data.start_date}T00:00:00Z`); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
      daily.set(day.toISOString().slice(0, 10), {})
    }
    data.daily.forEach(row => { daily.get(row.day)[row.language] = row.play_count })
  }
  const maxDaily = Math.max(1, ...[...daily.values()].map(counts => Object.values(counts).reduce((a, b) => a + b, 0)))
  const pois = data ? (showAll ? data.pois : data.pois.slice(0, 10)) : []

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard phân tích lượt nghe</h2>
        <p className="mt-1 text-sm text-ink-soft">Theo ngày lưu trong hệ thống. Thời lượng trung bình chỉ tính lượt đã gửi thời gian nghe; log cũ chưa có thời lượng được bỏ qua.</p>
      </div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); setShowAll(false); setQuery({ ...filters }) }}>
        <Field label="Từ ngày"><input type="date" required className={inputClass} value={filters.start_date} max={filters.end_date} onChange={e => setFilters({ ...filters, start_date: e.target.value })} /></Field>
        <Field label="Đến ngày"><input type="date" required className={inputClass} value={filters.end_date} min={filters.start_date} onChange={e => setFilters({ ...filters, end_date: e.target.value })} /></Field>
        <Field label="Ngôn ngữ tên POI"><select className={inputClass} value={filters.lang} onChange={e => setFilters({ ...filters, lang: e.target.value })}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></Field>
        <Button type="submit" loading={loading}>Xem thống kê</Button>
      </form>
      <ErrorBox message={error} />
      <div aria-live="polite">{loading && <LoadingRow text="Đang tổng hợp lượt nghe..." />}</div>
      {!loading && !error && data && <>
        <p className="text-xs text-ink-soft">Khoảng đang xem: {data.start_date} → {data.end_date}, gồm cả ngày cuối. Tối đa 366 ngày. Chọn ngôn ngữ tên không lọc bỏ lượt nghe ngôn ngữ khác.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[['Tổng lượt nghe', data.total_plays], ['Lượt có thời lượng', data.measured_plays], ['Thời gian nghe trung bình', seconds(data.average_listen_seconds)]].map(([label, value]) =>
            <div key={label} className="rounded-2xl border border-ink/10 bg-paper p-5"><p className="text-sm text-ink-soft">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p></div>)}
        </div>
        {data.total_plays === 0 && <p className="rounded-xl bg-sand/50 p-4 text-sm">Chưa có lượt nghe trong khoảng ngày này. Hãy chọn khoảng ngày khác hoặc mở một POI và nghe thuyết minh.</p>}

        <section className="rounded-2xl border border-ink/10 bg-paper p-4 sm:p-6">
          <h3 className="font-semibold">Top POI được nghe nhiều nhất & thời lượng trung bình</h3>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
            <caption className="sr-only">POI sắp xếp theo lượt nghe giảm dần</caption>
            <thead><tr className="border-b border-ink/10"><th className="py-2 pr-4">POI</th><th className="py-2 pr-4 text-right">Lượt nghe</th><th className="py-2 pr-4 text-right">Có thời lượng</th><th className="py-2 text-right">Trung bình</th></tr></thead>
            <tbody>{pois.map(p => <tr key={p.artifact_id} className="border-b border-ink/5"><td className="py-3 pr-4">{p.title}</td><td className="pr-4 text-right tabular-nums">{p.play_count}</td><td className="pr-4 text-right tabular-nums">{p.measured_plays}</td><td className="text-right tabular-nums">{seconds(p.average_listen_seconds)}</td></tr>)}</tbody>
          </table></div>
          {data.pois.length === 0 && <p className="py-4 text-sm text-ink-soft">Chưa có lượt nghe gắn với POI còn tồn tại.</p>}
          {data.pois.length > 10 && <Button className="mt-4" variant="secondary" onClick={() => setShowAll(!showAll)}>{showAll ? 'Thu gọn' : `Xem tất cả ${data.pois.length} POI`}</Button>}
        </section>

        <section className="rounded-2xl border border-ink/10 bg-paper p-4 sm:p-6">
          <h3 className="font-semibold">Lượt nghe theo ngày và ngôn ngữ</h3>
          <div className="my-4 flex flex-wrap gap-4 text-sm">{data.languages.map(l => <span key={l.language} className="flex items-center gap-2"><span className="h-3 w-3" style={{ backgroundColor: languageColor(l.language) }} />{languageName(l.language)}: <strong className="tabular-nums">{l.play_count}</strong></span>)}</div>
          <div className="max-h-96 overflow-auto"><table className="w-full text-left text-sm">
            <caption className="sr-only">Lượt nghe từng ngày, phân chia theo ngôn ngữ; bao gồm ngày không có lượt</caption>
            <thead><tr><th className="pb-3 pr-3">Ngày</th><th className="pb-3">Phân bố ngôn ngữ</th><th className="pb-3 pl-3 text-right">Tổng</th></tr></thead>
            <tbody>{[...daily].map(([day, counts]) => {
              const total = Object.values(counts).reduce((a, b) => a + b, 0)
              return <tr key={day} className="border-t border-ink/5"><td className="whitespace-nowrap py-3 pr-3 tabular-nums">{day}</td><td className="w-full">
                <div className="flex h-4 min-w-16 overflow-hidden rounded bg-ink/5" aria-hidden="true">{data.languages.map(l => <span key={l.language} style={{ width: `${(counts[l.language] || 0) / maxDaily * 100}%`, backgroundColor: languageColor(l.language) }} />)}</div>
                <p className="mt-1 text-xs text-ink-soft">{total ? data.languages.filter(l => counts[l.language]).map(l => `${languageName(l.language)} ${counts[l.language]}`).join(' · ') : 'Không có lượt nghe'}</p>
              </td><td className="pl-3 text-right tabular-nums">{total}</td></tr>
            })}</tbody>
          </table></div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-paper p-4 sm:p-6">
          <h3 className="font-semibold">Lộ trình nghe phổ biến · ẩn danh</h3>
          <p className="mt-1 text-sm text-ink-soft">Chuỗi POI theo thứ tự nghe trong mỗi phiên, tách sau 30 phút không có lượt mới và gộp POI lặp liên tiếp. Đây là dấu vết nghe tham khảo, chưa xác minh khách thực sự di chuyển.</p>
          {data.popular_routes.length ? <ol className="mt-4 divide-y divide-ink/10">{data.popular_routes.map((r, i) => <li key={i} className="py-3 text-sm"><p className="break-words">{i + 1}. {r.stops.map(s => s.title).join(' → ')}</p><p className="mt-1 font-semibold text-maroon">{r.journey_count} lượt hành trình</p></li>)}</ol> : <p className="mt-4 text-sm text-ink-soft">Chưa có phiên nghe ít nhất hai POI khác nhau trong khoảng ngày này.</p>}
        </section>
        <RoomHeatmap rooms={data.rooms} unassigned={data.unassigned_plays} />
      </>}
    </div>
  )
}
