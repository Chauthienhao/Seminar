import { useState } from 'react'
import { ArrowRight, Compass } from 'lucide-react'

import { FLOORS } from '../lib/museumFloors.js'

export default function MuseumMap() {
  const [floor, setFloor] = useState('tret')
  const data = FLOORS[floor]

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Sidebar */}
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Định vị điểm dừng chân</h1>
          <p className="mt-2 text-sm text-ink-soft">Bản đồ tham quan số giúp bạn theo dõi vị trí hiện tại trong bảo tàng.</p>

          <div className="mt-6 inline-flex rounded-full border border-ink/15 p-1">
            {Object.entries(FLOORS).map(([key, f]) => (
              <button
                key={key}
                onClick={() => setFloor(key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  floor === key ? 'bg-navy-800 text-cream' : 'text-ink-soft'
                }`}
              >
                {f.label.toUpperCase()}
              </button>
            ))}
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Lộ trình gợi ý ({data.label})
          </p>
          <ol className="mt-3 space-y-3">
            {data.route.map((stop, i) => (
              <li
                key={stop.room}
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  stop.active ? 'border-maroon bg-maroon/5' : 'border-ink/10 bg-paper'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    stop.active ? 'bg-maroon text-cream' : 'bg-ink/10 text-ink-soft'
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{stop.room}</p>
                  <p className="text-xs text-ink-soft">{stop.meta}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Floor plan */}
        <div>
          <div className="rounded-2xl border border-ink/10 bg-paper p-4 sm:p-6">
            <div className="flex items-center justify-between px-1 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Sơ đồ mặt bằng — {data.label}
              </p>
              <span className="flex items-center gap-1 text-[11px] text-ink-soft">
                <Compass size={13} /> Bắc
              </span>
            </div>

            <svg viewBox="0 0 600 420" className="w-full" role="img" aria-label={`Sơ đồ mặt bằng ${data.label}`}>
              {/* Nền toà nhà */}
              <rect
                x={data.building.x}
                y={data.building.y}
                width={data.building.w}
                height={data.building.h}
                fill="#FBF7EF"
                stroke="#1B2340"
                strokeOpacity="0.35"
                strokeWidth="4"
              />

              {/* Hành lang trung tâm */}
              <rect
                x={data.corridor.x}
                y={data.corridor.y}
                width={data.corridor.w}
                height={data.corridor.h}
                fill="#E8DFC9"
                fillOpacity="0.6"
              />
              <text
                x={data.corridor.x + data.corridor.w / 2}
                y={data.corridor.y + data.corridor.h / 2 + 4}
                textAnchor="middle"
                fontSize="11"
                letterSpacing="1.5"
                fill="#3B4262"
                opacity="0.6"
              >
                HÀNH LANG
              </text>

              {/* Các phòng */}
              {data.rooms.map((room) => (
                <g key={room.id}>
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.w}
                    height={room.h}
                    fill={room.current ? '#A6321E' : room.next ? '#FBF7EF' : '#FFFFFF'}
                    fillOpacity={room.current ? 1 : 1}
                    stroke={room.current || room.next ? '#A6321E' : '#1B2340'}
                    strokeOpacity={room.current || room.next ? 1 : 0.3}
                    strokeWidth={room.next ? 2.5 : 2}
                    strokeDasharray={room.next ? '6 4' : undefined}
                  />
                  <text
                    x={room.x + 10}
                    y={room.y + 22}
                    fontSize="14"
                    fontWeight="700"
                    fill={room.current ? '#FBF7EF' : '#1B2340'}
                  >
                    {room.id}
                  </text>
                  <foreignObject x={room.x + 8} y={room.y + 30} width={room.w - 16} height={room.h - 38}>
                    <p
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        margin: 0,
                        fontSize: '10.5px',
                        lineHeight: 1.35,
                        color: room.current ? '#FBF7EF' : '#3B4262',
                        opacity: room.current ? 0.9 : 0.75,
                      }}
                    >
                      {room.name}
                    </p>
                  </foreignObject>
                  {room.current && (
                    <g>
                      <circle cx={room.x + room.w - 22} cy={room.y + 20} r="9" fill="#101830" />
                      <text
                        x={room.x + room.w - 22}
                        y={room.y + 24}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#FBF7EF"
                      >
                        ●
                      </text>
                    </g>
                  )}
                </g>
              ))}

              {/* Cửa phòng (khoảng mở trên tường) */}
              {data.doors.map((door, i) => (
                <rect
                  key={i}
                  x={door.rot === 90 ? door.x - 14 : door.x - 1}
                  y={door.rot === 90 ? door.y - 1 : door.y - 14}
                  width={door.rot === 90 ? 28 : 2}
                  height={door.rot === 90 ? 2 : 28}
                  fill="#FBF7EF"
                />
              ))}

              {/* Cổng ra vào chính */}
              <rect x={data.entrance.x} y={data.building.y + data.building.h - 2} width={data.entrance.w} height="4" fill="#FBF7EF" />
              <text
                x={data.entrance.x + data.entrance.w / 2}
                y={data.building.y + data.building.h + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#3B4262"
                opacity="0.7"
              >
                Lối vào chính
              </text>

              {/* Lộ trình gợi ý */}
              <polyline
                points={data.routePath.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke="#A6321E"
                strokeWidth="3"
                strokeDasharray="2 7"
                strokeLinecap="round"
              />
              <circle
                cx={data.routePath[data.routePath.length - 1][0]}
                cy={data.routePath[data.routePath.length - 1][1]}
                r="5"
                fill="#A6321E"
              />

              {/* Vị trí hiện tại */}
              <g transform={`translate(${data.routePath[0][0]}, ${data.routePath[0][1]})`}>
                <circle r="10" fill="#A6321E" fillOpacity="0.2" />
                <circle r="5" fill="#A6321E" stroke="#FBF7EF" strokeWidth="2" />
              </g>
            </svg>

            <div className="mt-3 flex flex-wrap gap-4 border-t border-ink/10 pt-3 text-[11px] text-ink-soft">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-maroon" /> Vị trí hiện tại</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-maroon bg-cream" /> Điểm tiếp theo</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-ink/25 bg-white" /> Phòng trưng bày</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-maroon" /> Lộ trình gợi ý</span>
            </div>
          </div>

          {/* Next direction card */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-ink/10 bg-navy-800 p-5 text-cream">
            <ArrowRight size={18} className="mt-0.5 shrink-0 text-maroon" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-cream/70">
                Hướng dẫn di chuyển tiếp theo
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/85">
                Bạn sẽ đi từ {data.route[0].room}, đi thẳng theo hành lang bên trái, rẽ trái tại phòng số{' '}
                {data.rooms.find((r) => r.next)?.id} để đến điểm tiếp theo trong lộ trình.
              </p>
              <p className="mt-2 text-xs font-semibold text-maroon">Đã đi 2/5 điểm</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
