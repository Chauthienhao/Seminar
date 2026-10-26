import { useState } from 'react'
import { FLOORS } from '../../../lib/museumFloors.js'

const normalize = (code) => code.trim().toUpperCase()
const knownCodes = new Set(Object.values(FLOORS).flatMap(f => f.rooms.map(r => r.id)))

export default function RoomHeatmap({ rooms, unassigned }) {
  const [floor, setFloor] = useState('tret')
  const layout = FLOORS[floor]
  const byCode = new Map()
  rooms.forEach(room => {
    const code = normalize(room.code)
    byCode.set(code, [...(byCode.get(code) || []), room])
  })
  const max = Math.max(1, ...rooms.map(r => r.play_count))
  const unmapped = rooms.filter(r => !knownCodes.has(normalize(r.code)) || byCode.get(normalize(r.code)).length !== 1)

  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 sm:p-6" aria-labelledby="heatmap-title">
      <h2 id="heatmap-title" className="font-semibold">Heatmap lượt nghe theo phòng</h2>
      <p className="mt-1 text-sm text-ink-soft">Màu đậm hơn tương ứng nhiều lượt nghe hơn. Đây là sơ đồ phòng tham khảo, không dùng GPS.</p>
      <div className="my-4 flex flex-wrap gap-2" aria-label="Chọn tầng">
        {Object.entries(FLOORS).map(([key, f]) => <button key={key} type="button" aria-pressed={floor === key}
          onClick={() => setFloor(key)} className={`rounded-full border px-4 py-2 text-sm ${floor === key ? 'border-maroon bg-maroon text-cream' : 'border-ink/15'}`}>{f.label}</button>)}
      </div>
      <svg viewBox="0 0 600 420" className="w-full" role="img" aria-label={`Heatmap ${layout.label}. Số lượt nghe chi tiết nằm trong bảng bên dưới.`}>
        <rect x="40" y="40" width="520" height="340" fill="#E8DFC9" stroke="#1B2340" />
        <text x="300" y="215" textAnchor="middle" fontSize="12" fill="#1B2340">HÀNH LANG</text>
        {layout.rooms.map(room => {
          const matches = byCode.get(room.id) || []
          const data = matches.length === 1 ? matches[0] : null
          const ratio = data ? data.play_count / max : 0
          return <g key={room.id}>
            <title>{data ? `${data.code} — ${data.name}: ${data.play_count} lượt nghe` : `Phòng ${room.id}: chưa ghép mã phòng CSDL`}</title>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} fill={data ? '#FBF7EF' : '#E5E7EB'} stroke="#1B2340" strokeWidth="1.5" />
            {data && <rect x={room.x + 1} y={room.y + 1} width={room.w - 2} height={room.h - 2} fill="#A6321E" fillOpacity={ratio === 0 ? 0 : 0.12 + ratio * 0.78} />}
            <text x={room.x + 10} y={room.y + 30} fontSize="16" fontWeight="600" fill={ratio > 0.55 ? '#FBF7EF' : '#1B2340'}>{room.id}</text>
            <text x={room.x + 10} y={room.y + 58} fontSize="12" fill={ratio > 0.55 ? '#FBF7EF' : '#1B2340'}>{data ? `${data.play_count} lượt nghe` : 'Chưa ghép mã'}</text>
          </g>
        })}
        <text x="300" y="405" textAnchor="middle" fontSize="12" fill="#1B2340">Lối vào · {layout.label}</text>
      </svg>
      <div className="my-3 flex flex-wrap gap-4 text-xs text-ink-soft">
        <span>Không lượt nghe: nền kem</span><span>Ít → nhiều: đỏ nhạt → đỏ đậm</span><span>Chưa ghép mã: xám</span>
      </div>
      <p className="text-xs text-ink-soft">Ghép theo mã phòng trên sơ đồ (101, 102, …); mã không khớp hoặc trùng được liệt kê riêng. {unassigned} lượt nghe chưa gắn phòng hoặc thuộc POI đã xóa.</p>
      {unmapped.length > 0 && <p className="mt-3 text-sm">Chưa đặt được trên sơ đồ: {unmapped.map(r => `${r.code} (${r.name}): ${r.play_count}`).join(' · ')}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Số lượt nghe của tất cả phòng trong khoảng ngày đã chọn</caption>
          <thead><tr className="border-b border-ink/10"><th className="py-2 pr-3">Mã phòng</th><th className="py-2 pr-3">Tên phòng</th><th className="py-2 text-right">Lượt nghe</th></tr></thead>
          <tbody>{rooms.map(r => <tr key={r.room_id} className="border-b border-ink/5"><td className="py-2 pr-3">{r.code}</td><td className="py-2 pr-3">{r.name}</td><td className="py-2 text-right tabular-nums">{r.play_count}</td></tr>)}</tbody>
        </table>
        {rooms.length === 0 && <p className="py-4 text-sm text-ink-soft">Chưa có phòng trong hệ thống.</p>}
      </div>
    </section>
  )
}
