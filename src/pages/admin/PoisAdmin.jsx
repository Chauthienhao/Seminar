import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, QrCode, Trash2 } from 'lucide-react'

import { api } from '../../lib/api.js'
import { adminApi } from '../../lib/adminApi.js'
import LocationPicker from '../../components/map/LocationPicker.jsx'
import Modal from './components/Modal.jsx'
import QrPrintModal from './components/QrPrintModal.jsx'
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

const DEFAULT_GEOFENCE_RADIUS = 10

const POI_TYPES = [
  { value: 'EXHIBIT', label: 'Điểm trưng bày' },
  { value: 'ENTRANCE', label: 'Lối vào' },
  { value: 'INFO_DESK', label: 'Quầy thông tin' },
  { value: 'EXIT', label: 'Lối ra' },
]
const typeLabel = (value) => POI_TYPES.find((t) => t.value === value)?.label ?? value

// Ghim của các POI khác, hiện mờ trên bản đồ chọn vị trí để dễ canh chỗ
const loadMapPois = () => api.listMapPois('vi')

/**
 * Điểm tham quan (POI) = vị trí vật lý trong bảo tàng: nơi dán mã QR, có toạ độ GPS.
 * Hiện vật được gán vào POI ở trang Hiện vật. POI còn hiện vật thì không xoá được.
 */
export default function PoisAdmin() {
  const [pois, setPois] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | poi
  const [qrPoi, setQrPoi] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(
    () =>
      adminApi
        .listPois()
        .then((list) => {
          setPois(list)
          setError(null)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    load()
    api.listRooms().then(setRooms).catch(() => {})
  }, [load])

  const handleDelete = async (poi) => {
    if (poi.artifacts.length > 0) {
      toast.error(`POI ${poi.code} còn ${poi.artifacts.length} hiện vật. Hãy chuyển hoặc xoá các hiện vật này trước.`)
      return
    }
    const ok = await confirm({
      title: `Xoá điểm tham quan ${poi.code} — ${poi.name_vi}?`,
      message: 'POI sẽ bị gỡ khỏi các tour có chứa nó. Mã QR đã dán tại điểm này sẽ không mở được nữa.',
    })
    if (!ok) return
    try {
      await adminApi.deletePoi(poi.id)
      toast.success(`Đã xoá POI ${poi.code}`)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Điểm tham quan (POI)"
        description="Vị trí trong bảo tàng nơi dán mã QR. Mỗi POI chứa một hoặc nhiều hiện vật, hoặc không có hiện vật nào (lối vào, quầy thông tin...)."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} /> Thêm POI
          </Button>
        }
      />
      <ErrorBox message={error} />

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-sand/40 text-left text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã QR</th>
              <th className="px-4 py-3 font-semibold">Tên điểm</th>
              <th className="px-4 py-3 font-semibold">Loại</th>
              <th className="px-4 py-3 font-semibold">Phòng</th>
              <th className="px-4 py-3 font-semibold">Hiện vật</th>
              <th className="px-4 py-3 font-semibold">GPS</th>
              <th className="w-32 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4">
                  <LoadingRow />
                </td>
              </tr>
            ) : pois.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">
                  Chưa có điểm tham quan nào. Bấm “Thêm POI” để bắt đầu.
                </td>
              </tr>
            ) : (
              pois.map((p) => (
                <tr key={p.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 font-semibold text-ink">{p.code}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditing(p)} className="text-left font-medium text-ink hover:text-maroon">
                      {p.name_vi}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{typeLabel(p.poi_type)}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.room ? `${p.room.code} — ${p.room.name_vi}` : '—'}</td>
                  <td className="px-4 py-3 text-ink-soft" title={p.artifacts.map((a) => a.title).join('\n')}>
                    {p.artifacts.length}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.lat != null && p.lng != null ? 'Đã có' : 'Chưa có'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton label="Sửa" onClick={() => setEditing(p)}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label="In mã QR" onClick={() => setQrPoi(p)}>
                        <QrCode size={15} />
                      </IconButton>
                      <IconButton label="Xoá" variant="danger" onClick={() => handleDelete(p)}>
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
        <PoiModal
          poi={editing === 'new' ? null : editing}
          rooms={rooms}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}

      {qrPoi && <QrPrintModal code={qrPoi.code} title={qrPoi.name_vi} onClose={() => setQrPoi(null)} />}
    </div>
  )
}

const poiForm = (p) => ({
  code: p?.code ?? '',
  room_id: p?.room_id ?? '',
  poi_type: p?.poi_type ?? 'EXHIBIT',
  name_vi: p?.name_vi ?? '',
  name_en: p?.name_en ?? '',
  description_vi: p?.description_vi ?? '',
  description_en: p?.description_en ?? '',
  lat: p?.lat ?? '',
  lng: p?.lng ?? '',
  geofence_radius: p?.geofence_radius ?? DEFAULT_GEOFENCE_RADIUS,
})

function PoiModal({ poi, rooms, onClose, onSaved }) {
  const isNew = !poi
  const [form, setForm] = useState(poiForm(poi))
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const valid = form.code.trim() && form.room_id && form.name_vi.trim() && form.name_en.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    const payload = {
      room_id: form.room_id,
      poi_type: form.poi_type,
      name_vi: form.name_vi.trim(),
      name_en: form.name_en.trim(),
      description_vi: toTextOrNull(form.description_vi),
      description_en: toTextOrNull(form.description_en),
      lat: toNumberOrNull(form.lat),
      lng: toNumberOrNull(form.lng),
      geofence_radius: toNumberOrNull(form.geofence_radius) ?? DEFAULT_GEOFENCE_RADIUS,
    }
    try {
      if (isNew) {
        await adminApi.createPoi({ code: form.code.trim(), ...payload })
        toast.success(`Đã tạo POI ${form.code.trim()}`)
      } else {
        await adminApi.updatePoi(poi.id, payload)
        toast.success(`Đã lưu POI ${poi.code}`)
      }
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isNew ? 'Thêm điểm tham quan' : `Sửa POI ${poi.code}`} onClose={onClose} size="max-w-3xl">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Mã QR"
            required
            hint={isNew ? 'Mã in trên bảng QR dán tại điểm này, không trùng.' : 'Mã QR không sửa được sau khi tạo.'}
          >
            <input className={inputClass} value={form.code} onChange={set('code')} disabled={!isNew} placeholder="VD: SG-1822" />
          </Field>
          <Field label="Loại điểm" required>
            <select className={inputClass} value={form.poi_type} onChange={set('poi_type')}>
              {POI_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tên điểm (tiếng Việt)" required>
            <input className={inputClass} value={form.name_vi} onChange={set('name_vi')} placeholder="VD: Tủ gốm Sài Gòn xưa" />
          </Field>
          <Field label="Tên điểm (English)" required>
            <input className={inputClass} value={form.name_en} onChange={set('name_en')} />
          </Field>
          <Field label="Phòng" required hint={rooms.length === 0 ? 'Chưa có phòng nào — hãy tạo phòng trước.' : undefined}>
            <select required className={inputClass} value={form.room_id} onChange={set('room_id')}>
              <option value="" disabled>
                — Chọn phòng —
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} — {r.name_vi}
                </option>
              ))}
            </select>
          </Field>
          <div />
          <Field label="Mô tả (tiếng Việt)" hint="Hiện cho khách khi quét QR tại điểm không có hiện vật (lối vào, quầy...).">
            <textarea rows={3} className={inputClass} value={form.description_vi} onChange={set('description_vi')} />
          </Field>
          <Field label="Mô tả (English)">
            <textarea rows={3} className={inputClass} value={form.description_en} onChange={set('description_en')} />
          </Field>

          {/* Không bọc trong <Field>/<label>: bấm vào bản đồ trong label sẽ kích hoạt nút/ô nhập bên trong */}
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-ink">Vị trí trên bản đồ</span>
            <LocationPicker
              lat={form.lat}
              lng={form.lng}
              excludeId={poi?.id}
              loadOthers={loadMapPois}
              onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
            />
            <details className="mt-3 text-xs text-ink-soft">
              <summary className="cursor-pointer select-none font-semibold">Nhập toạ độ thủ công / bán kính kích hoạt</summary>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <Field label="Vĩ độ (lat)">
                  <input type="number" step="any" className={inputClass} value={form.lat} onChange={set('lat')} />
                </Field>
                <Field label="Kinh độ (lng)">
                  <input type="number" step="any" className={inputClass} value={form.lng} onChange={set('lng')} />
                </Field>
                <Field label="Bán kính kích hoạt (m)">
                  <input type="number" min="1" className={inputClass} value={form.geofence_radius} onChange={set('geofence_radius')} />
                </Field>
                <p className="col-span-3 -mt-1">Bán kính dùng cho tính năng tự phát thuyết minh theo GPS ở bản mobile.</p>
              </div>
            </details>
          </div>
        </div>

        {!isNew && poi.artifacts.length > 0 && (
          <p className="mt-4 text-xs text-ink-soft">
            Hiện vật tại điểm này: {poi.artifacts.map((a) => `${a.code} — ${a.title}`).join('; ')}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2 border-t border-ink/10 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" loading={saving} disabled={!valid}>
            {isNew ? 'Tạo POI' : 'Lưu POI'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
