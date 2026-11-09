import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from 'lucide-react'

import { adminApi } from '../../lib/adminApi.js'
import Modal from './components/Modal.jsx'
import { useConfirm, useToast } from './components/Feedback.jsx'
import {
  Button,
  ErrorBox,
  Field,
  IconButton,
  LoadingRow,
  PageHeader,
  inputClass,
  toNumberOrNull,
  toTextOrNull,
} from './components/ui.jsx'

export default function ToursAdmin() {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | tour object
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(
    () =>
      adminApi
        .listTours()
        .then((list) => {
          setTours(list)
          setError(null)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (tour) => {
    const ok = await confirm({
      title: `Xoá tour “${tour.title_vi}”?`,
      message: 'Chỉ xoá tuyến tham quan, các điểm tham quan (POI) trong lộ trình vẫn giữ nguyên.',
    })
    if (!ok) return
    try {
      await adminApi.deleteTour(tour.id)
      toast.success('Đã xoá tour')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Tuyến tham quan"
        description="Các tour gợi ý cho khách: thông tin song ngữ và thứ tự các điểm tham quan (POI) cần đi qua."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} /> Thêm tour
          </Button>
        }
      />
      <ErrorBox message={error} />

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-sand/40 text-left text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Tên tour</th>
              <th className="px-4 py-3 font-semibold">Số điểm dừng</th>
              <th className="px-4 py-3 font-semibold">Thời lượng</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4">
                  <LoadingRow />
                </td>
              </tr>
            ) : tours.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-soft">
                  Chưa có tour nào. Bấm “Thêm tour” để bắt đầu.
                </td>
              </tr>
            ) : (
              tours.map((t) => (
                <tr key={t.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(t)} className="text-left hover:text-maroon">
                      <span className="block font-medium text-ink">{t.title_vi}</span>
                      <span className="block text-xs text-ink-soft">{t.title_en}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{t.stops.length}</td>
                  <td className="px-4 py-3 text-ink-soft">{t.duration_minutes ? `${t.duration_minutes} phút` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton label="Sửa" onClick={() => setEditing(t)}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label="Xoá" variant="danger" onClick={() => handleDelete(t)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <TourModal
          tour={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

const tourForm = (t) => ({
  title_vi: t?.title_vi ?? '',
  title_en: t?.title_en ?? '',
  description_vi: t?.description_vi ?? '',
  description_en: t?.description_en ?? '',
  duration_minutes: t?.duration_minutes ?? '',
  thumbnail_url: t?.thumbnail_url ?? '',
})

function TourModal({ tour, onClose, onSaved }) {
  const isNew = !tour
  const [form, setForm] = useState(tourForm(tour))
  // Mỗi điểm dừng là một POI: { id, code, name_vi, artifacts } — thứ tự trong mảng = thứ tự tham quan
  const [stops, setStops] = useState(tour ? tour.stops.map((s) => s.poi) : [])
  const [pois, setPois] = useState([])
  const [pickId, setPickId] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    adminApi
      .listPois()
      .then(setPois)
      .catch((err) => toast.error(err.message))
  }, [toast])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const valid = form.title_vi.trim() && form.title_en.trim()

  const available = pois.filter((p) => !stops.some((s) => s.id === p.id))

  const addStop = () => {
    const poi = pois.find((x) => x.id === pickId)
    if (!poi) return
    setStops([...stops, poi])
    setPickId('')
  }
  const move = (index, delta) => {
    const next = [...stops]
    ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
    setStops(next)
  }
  const removeStop = (index) => setStops(stops.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    const payload = {
      title_vi: form.title_vi.trim(),
      title_en: form.title_en.trim(),
      description_vi: toTextOrNull(form.description_vi),
      description_en: toTextOrNull(form.description_en),
      duration_minutes: toNumberOrNull(form.duration_minutes),
      thumbnail_url: toTextOrNull(form.thumbnail_url),
      poi_ids_in_order: stops.map((s) => s.id),
    }
    try {
      if (isNew) {
        await adminApi.createTour(payload)
        toast.success('Đã tạo tour mới')
      } else {
        await adminApi.updateTour(tour.id, payload)
        toast.success('Đã lưu tour')
      }
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isNew ? 'Thêm tour' : `Sửa tour “${tour.title_vi}”`} onClose={onClose} size="max-w-3xl">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tên tour (tiếng Việt)" required>
            <input className={inputClass} value={form.title_vi} onChange={set('title_vi')} />
          </Field>
          <Field label="Tên tour (English)" required>
            <input className={inputClass} value={form.title_en} onChange={set('title_en')} />
          </Field>
          <Field label="Mô tả (tiếng Việt)">
            <textarea rows={3} className={inputClass} value={form.description_vi} onChange={set('description_vi')} />
          </Field>
          <Field label="Mô tả (English)">
            <textarea rows={3} className={inputClass} value={form.description_en} onChange={set('description_en')} />
          </Field>
          <Field label="Thời lượng (phút)">
            <input type="number" min="0" className={inputClass} value={form.duration_minutes} onChange={set('duration_minutes')} />
          </Field>
          <Field label="Link ảnh đại diện">
            <input className={inputClass} value={form.thumbnail_url} onChange={set('thumbnail_url')} placeholder="https://..." />
          </Field>
        </div>

        <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Lộ trình ({stops.length} điểm dừng)
        </h3>

        {stops.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink/20 px-4 py-5 text-center text-sm text-ink-soft">
            Chưa có điểm dừng nào. Chọn điểm tham quan (POI) bên dưới để thêm vào lộ trình.
          </p>
        ) : (
          <ol className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-paper">
            {stops.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-maroon text-xs font-semibold text-cream">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold text-ink">{s.code}</span>
                  <span className="text-ink-soft"> — {s.name_vi}</span>
                  {s.artifacts.length > 0 && <span className="text-xs text-ink-soft"> · {s.artifacts.length} hiện vật</span>}
                </span>
                <IconButton label="Đưa lên" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp size={15} />
                </IconButton>
                <IconButton label="Đưa xuống" onClick={() => move(i, 1)} disabled={i === stops.length - 1}>
                  <ArrowDown size={15} />
                </IconButton>
                <IconButton label="Bỏ khỏi lộ trình" variant="danger" onClick={() => removeStop(i)}>
                  <X size={15} />
                </IconButton>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-3 flex gap-2">
          <select className={inputClass} value={pickId} onChange={(e) => setPickId(e.target.value)}>
            <option value="">
              {available.length === 0 ? '— Không còn POI nào để thêm —' : '— Chọn điểm tham quan (POI) để thêm vào lộ trình —'}
            </option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name_vi}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={addStop} disabled={!pickId} className="shrink-0">
            <Plus size={14} /> Thêm điểm dừng
          </Button>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-ink/10 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" loading={saving} disabled={!valid}>
            {isNew ? 'Tạo tour' : 'Lưu tour'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
