import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, Clock3, Landmark, DoorOpen, MapPin, Route as RouteIcon } from 'lucide-react'

import { api } from '../../lib/api.js'
import { adminApi } from '../../lib/adminApi.js'
import { ErrorBox, LoadingRow, PageHeader } from './components/ui.jsx'

const ARTIFACT_FETCH_LIMIT = 200 // giới hạn tối đa của GET /api/admin/artifacts

export default function AdminOverview({ me }) {
  const [counts, setCounts] = useState(null)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([adminApi.listArtifacts(), adminApi.listPois(), api.listRooms(), adminApi.listTours(), adminApi.topPlayed(5)])
      .then(([artifacts, pois, rooms, tours, top]) => {
        setCounts({ artifacts: artifacts.length, pois: pois.length, rooms: rooms.length, tours: tours.length })
        setStats(top)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const cards = counts && [
    {
      label: 'Hiện vật',
      value: counts.artifacts >= ARTIFACT_FETCH_LIMIT ? `${ARTIFACT_FETCH_LIMIT}+` : counts.artifacts,
      icon: Landmark,
      to: '/admin/hien-vat',
    },
    { label: 'Điểm tham quan', value: counts.pois, icon: MapPin, to: '/admin/diem' },
    { label: 'Phòng trưng bày', value: counts.rooms, icon: DoorOpen, to: '/admin/phong' },
    { label: 'Tuyến tham quan', value: counts.tours, icon: RouteIcon, to: '/admin/tour' },
  ]

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={me ? `Chào ${me.full_name || me.username}` : 'Tổng quan'}
        description="Tình hình nội dung và lượt nghe thuyết minh của bảo tàng."
      />
      <ErrorBox message={error} />

      {loading ? (
        <LoadingRow />
      ) : (
        <>
          {cards && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(({ label, value, icon: Icon, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="rounded-2xl border border-ink/10 bg-paper p-5 transition-colors hover:border-maroon/40"
                >
                  <span className="flex items-center gap-2 text-sm text-ink-soft">
                    <Icon size={16} className="text-maroon" /> {label}
                  </span>
                  <span className="mt-2 block font-serif text-3xl font-semibold text-ink">{value}</span>
                </Link>
              ))}
            </div>
          )}

          <section className="mt-6 rounded-2xl border border-ink/10 bg-paper p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Headphones size={16} className="text-maroon" />
              Top hiện vật được nghe nhiều nhất
            </div>

            {stats.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">Chưa có lượt phát nào được ghi nhận.</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink/10">
                {stats.map((s, i) => (
                  <li key={s.artifact_id} className="flex items-center justify-between py-3 text-sm">
                    <span className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-maroon/10 text-xs font-semibold text-maroon">
                        {i + 1}
                      </span>
                      <span className="font-medium text-ink">{s.title}</span>
                    </span>
                    <span className="flex items-center gap-4 text-ink-soft">
                      <span>{s.play_count} lượt phát</span>
                      <span className="flex items-center gap-1">
                        <Clock3 size={13} /> {Math.round(s.total_listen_seconds / 60)} phút nghe
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
