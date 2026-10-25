import { useCallback, useEffect, useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'

import { api } from '../../lib/api.js'
import { adminApi } from '../../lib/adminApi.js'
import { useConfirm, useToast } from './components/Feedback.jsx'
import { Button, ErrorBox, IconButton, LoadingRow, PageHeader, inputClass } from './components/ui.jsx'

const EMPTY_ROOM = { code: '', name_vi: '', name_en: '' }

export default function RoomsAdmin() {
  const [rooms, setRooms] = useState([])
  const [artifactCountByRoom, setArtifactCountByRoom] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newRoom, setNewRoom] = useState(null) // null = đang ẩn dòng thêm mới
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(EMPTY_ROOM)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(() => {
    setError(null)
    return Promise.all([api.listRooms(), adminApi.listArtifacts()])
      .then(([roomList, artifacts]) => {
        setRooms(roomList)
        const counts = {}
        artifacts.forEach((a) => {
          if (a.room_id) counts[a.room_id] = (counts[a.room_id] || 0) + 1
        })
        setArtifactCountByRoom(counts)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const isValid = (r) => r.code.trim() && r.name_vi.trim() && r.name_en.trim()
  const trimmed = (r) => ({ code: r.code.trim(), name_vi: r.name_vi.trim(), name_en: r.name_en.trim() })

  const handleCreate = async () => {
    setBusy(true)
    try {
      await adminApi.createRoom(trimmed(newRoom))
      toast.success(`Đã thêm phòng ${newRoom.code.trim()}`)
      setNewRoom(null)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleUpdate = async () => {
    setBusy(true)
    try {
      await adminApi.updateRoom(editingId, trimmed(draft))
      toast.success('Đã lưu thay đổi')
      setEditingId(null)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (room) => {
    const count = artifactCountByRoom[room.id] || 0
    const ok = await confirm({
      title: `Xoá phòng ${room.code} — ${room.name_vi}?`,
      message:
        count > 0
          ? `Có ${count} hiện vật trong phòng này sẽ chuyển sang trạng thái chưa xếp phòng (hiện vật không bị xoá).`
          : 'Phòng này chưa có hiện vật nào.',
    })
    if (!ok) return
    try {
      await adminApi.deleteRoom(room.id)
      toast.success(`Đã xoá phòng ${room.code}`)
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const startEdit = (room) => {
    setEditingId(room.id)
    setDraft({ code: room.code, name_vi: room.name_vi, name_en: room.name_en })
  }

  const onKeyDown = (submit, cancel, valid) => (e) => {
    if (e.key === 'Enter' && valid) submit()
    if (e.key === 'Escape') cancel()
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Phòng trưng bày"
        description="Khu vực / phòng dùng để xếp hiện vật và hiển thị trên sơ đồ."
        action={
          <Button onClick={() => setNewRoom(EMPTY_ROOM)} disabled={newRoom !== null}>
            <Plus size={16} /> Thêm phòng
          </Button>
        }
      />
      <ErrorBox message={error} />

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-sand/40 text-left text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã phòng</th>
              <th className="px-4 py-3 font-semibold">Tên tiếng Việt</th>
              <th className="px-4 py-3 font-semibold">Tên tiếng Anh</th>
              <th className="px-4 py-3 font-semibold">Số hiện vật</th>
              <th className="w-28 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {newRoom && (
              <RoomInputRow
                value={newRoom}
                onChange={setNewRoom}
                onKeyDown={onKeyDown(handleCreate, () => setNewRoom(null), isValid(newRoom))}
                countLabel="—"
                actions={
                  <>
                    <IconButton label="Lưu phòng mới" variant="primary" onClick={handleCreate} disabled={busy || !isValid(newRoom)}>
                      <Check size={15} />
                    </IconButton>
                    <IconButton label="Huỷ" onClick={() => setNewRoom(null)}>
                      <X size={15} />
                    </IconButton>
                  </>
                }
              />
            )}

            {loading ? (
              <tr>
                <td colSpan={5} className="px-4">
                  <LoadingRow />
                </td>
              </tr>
            ) : rooms.length === 0 && !newRoom ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  Chưa có phòng nào. Bấm “Thêm phòng” để bắt đầu.
                </td>
              </tr>
            ) : (
              rooms.map((room) =>
                editingId === room.id ? (
                  <RoomInputRow
                    key={room.id}
                    value={draft}
                    onChange={setDraft}
                    onKeyDown={onKeyDown(handleUpdate, () => setEditingId(null), isValid(draft))}
                    countLabel={artifactCountByRoom[room.id] || 0}
                    actions={
                      <>
                        <IconButton label="Lưu" variant="primary" onClick={handleUpdate} disabled={busy || !isValid(draft)}>
                          <Check size={15} />
                        </IconButton>
                        <IconButton label="Huỷ" onClick={() => setEditingId(null)}>
                          <X size={15} />
                        </IconButton>
                      </>
                    }
                  />
                ) : (
                  <tr key={room.id} className="hover:bg-cream/60">
                    <td className="px-4 py-3 font-semibold text-ink">{room.code}</td>
                    <td className="px-4 py-3">{room.name_vi}</td>
                    <td className="px-4 py-3 text-ink-soft">{room.name_en}</td>
                    <td className="px-4 py-3 text-ink-soft">{artifactCountByRoom[room.id] || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label="Sửa" onClick={() => startEdit(room)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton label="Xoá" variant="danger" onClick={() => handleDelete(room)}>
                          <Trash2 size={15} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RoomInputRow({ value, onChange, onKeyDown, countLabel, actions }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value })
  return (
    <tr className="bg-cream/70">
      <td className="px-3 py-2">
        <input autoFocus className={inputClass} placeholder="VD: 101" value={value.code} onChange={set('code')} onKeyDown={onKeyDown} />
      </td>
      <td className="px-3 py-2">
        <input className={inputClass} placeholder="Tên tiếng Việt" value={value.name_vi} onChange={set('name_vi')} onKeyDown={onKeyDown} />
      </td>
      <td className="px-3 py-2">
        <input className={inputClass} placeholder="English name" value={value.name_en} onChange={set('name_en')} onKeyDown={onKeyDown} />
      </td>
      <td className="px-4 py-2 text-ink-soft">{countLabel}</td>
      <td className="px-4 py-2">
        <div className="flex justify-end gap-1">{actions}</div>
      </td>
    </tr>
  )
}
