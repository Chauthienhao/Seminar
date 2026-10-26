import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Landmark, DoorOpen, Route as RouteIcon } from 'lucide-react'

import { api } from '../../lib/api.js'
import { adminApi } from '../../lib/adminApi.js'
import { ErrorBox, LoadingRow, PageHeader } from './components/ui.jsx'
import AdminAnalytics from './AdminAnalytics.jsx'

const ARTIFACT_FETCH_LIMIT = 200 // giới hạn tối đa của GET /api/admin/artifacts

export default function AdminOverview({ me }) {
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([adminApi.listArtifacts(), api.listRooms(), adminApi.listTours()])
      .then(([artifacts, rooms, tours]) => {
        setCounts({ artifacts: artifacts.length, rooms: rooms.length, tours: tours.length })
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
            <div className="grid gap-4 sm:grid-cols-3">
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
        </>
      )}
      <AdminAnalytics />
    </div>
  )
}
