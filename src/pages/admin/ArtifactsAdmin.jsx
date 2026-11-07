import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Loader2, Pencil, Plus, QrCode, Search, Square, Trash2, Upload, Volume2 } from 'lucide-react'

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

const DEBOUNCE_MS = 300
const DEFAULT_GEOFENCE_RADIUS = 10
const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
]

const titleOf = (artifact) =>
  artifact.translations.find((t) => t.language_code === 'vi')?.title ||
  artifact.translations[0]?.title ||
  '(chưa có bản dịch)'

export default function ArtifactsAdmin() {
  const [query, setQuery] = useState('')
  const [artifacts, setArtifacts] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [qrArtifact, setQrArtifact] = useState(null) // hiện vật đang mở modal In mã QR
  const toast = useToast()
  const confirm = useConfirm()

  const loadArtifacts = useCallback(
    (q) =>
      adminApi
        .listArtifacts(q)
        .then((list) => {
          setArtifacts(list)
          setError(null)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    api.listRooms().then(setRooms).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadArtifacts(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, loadArtifacts])

  const refresh = () => loadArtifacts(query.trim())

  const handleDelete = async (artifact) => {
    const ok = await confirm({
      title: `Xoá hiện vật ${artifact.qr_code} — ${titleOf(artifact)}?`,
      message: 'Toàn bộ bản dịch của hiện vật và các điểm dừng trong tour liên quan cũng bị xoá. Không thể hoàn tác.',
    })
    if (!ok) return
    try {
      await adminApi.deleteArtifact(artifact.id)
      toast.success(`Đã xoá hiện vật ${artifact.qr_code}`)
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Hiện vật"
        description="Điểm thuyết minh (POI): thông tin chung, bản dịch đa ngôn ngữ và audio."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> Thêm hiện vật
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo mã QR hoặc tên hiện vật..."
          className={`${inputClass} pl-9`}
        />
      </div>

      <ErrorBox message={error} />

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-sand/40 text-left text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã QR</th>
              <th className="px-4 py-3 font-semibold">Tên hiện vật</th>
              <th className="px-4 py-3 font-semibold">Phòng</th>
              <th className="px-4 py-3 font-semibold">Thời kỳ</th>
              <th className="px-4 py-3 font-semibold">Ngôn ngữ</th>
              <th className="w-40 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4">
                  <LoadingRow />
                </td>
              </tr>
            ) : artifacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                  {query ? 'Không tìm thấy hiện vật phù hợp.' : 'Chưa có hiện vật nào. Bấm “Thêm hiện vật” để bắt đầu.'}
                </td>
              </tr>
            ) : (
              artifacts.map((a) => (
                <tr key={a.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 font-semibold text-ink">{a.qr_code}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditingId(a.id)} className="text-left font-medium text-ink hover:text-maroon">
                      {titleOf(a)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {a.room ? `${a.room.code} — ${a.room.name_vi}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{a.period || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {LANGUAGES.map(({ code }) => {
                        const has = a.translations.some((t) => t.language_code === code)
                        return (
                          <span
                            key={code}
                            title={has ? 'Đã có bản dịch' : 'Chưa có bản dịch'}
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                              has ? 'bg-navy-800 text-cream' : 'border border-dashed border-ink/25 text-ink-soft/60'
                            }`}
                          >
                            {code}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconButton label="Sửa" onClick={() => setEditingId(a.id)}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label="In mã QR" onClick={() => setQrArtifact(a)}>
                        <QrCode size={15} />
                      </IconButton>
                      <a
                        href={`/hien-vat/${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Xem trang khách"
                        aria-label="Xem trang khách"
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand/60 hover:text-ink ${
                          a.translations.length === 0 ? 'pointer-events-none opacity-40' : ''
                        }`}
                      >
                        <ExternalLink size={15} />
                      </a>
                      <IconButton label="Xoá" variant="danger" onClick={() => handleDelete(a)}>
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

      {creating && (
        <CreateArtifactModal
          rooms={rooms}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false)
            refresh()
            setEditingId(id) // mở luôn form sửa để thêm bản dịch tiếng Anh nếu cần
          }}
        />
      )}

      {qrArtifact && (
        <QrPrintModal
          code={qrArtifact.qr_code}
          title={qrArtifact.translations.length ? titleOf(qrArtifact) : ''}
          onClose={() => setQrArtifact(null)}
        />
      )}

      {editingId && (
        <EditArtifactModal artifactId={editingId} rooms={rooms} onClose={() => setEditingId(null)} onChanged={refresh} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------
// Thông tin chung của hiện vật — dùng chung cho form thêm và form sửa
// ---------------------------------------------------------------------
const generalFromArtifact = (a) => ({
  qr_code: a?.qr_code ?? '',
  room_id: a?.room_id ?? '',
  period: a?.period ?? '',
  image_url: a?.image_url ?? '',
  lat: a?.lat ?? '',
  lng: a?.lng ?? '',
  geofence_radius: a?.geofence_radius ?? DEFAULT_GEOFENCE_RADIUS,
})

const generalToPayload = (g) => ({
  room_id: g.room_id,
  period: toTextOrNull(g.period),
  image_url: toTextOrNull(g.image_url),
  lat: toNumberOrNull(g.lat),
  lng: toNumberOrNull(g.lng),
  geofence_radius: toNumberOrNull(g.geofence_radius) ?? DEFAULT_GEOFENCE_RADIUS,
})

// Ghim của các hiện vật khác, hiện mờ trên bản đồ chọn vị trí để dễ canh chỗ
const loadMapArtifacts = () => api.listArtifactPositions('vi')

const MAX_IMAGE_MB = 5 // khớp MAX_IMAGE_BYTES ở backend (services/upload_service.py)

/**
 * Ảnh minh hoạ: bấm "Tải ảnh" -> file được lưu vào backend-thuyet-minh/uploads/artifacts/,
 * ô bên cạnh tự điền đường dẫn /uploads/artifacts/... ; bấm Lưu thì DB lưu đường dẫn đó.
 * Vẫn có thể dán link ảnh trên mạng (https://...) vào ô như trước.
 * (Không dùng <Field>: nó là thẻ <label>, không lồng được nút chọn file vào trong.)
 */
function ImageField({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  const handleFile = async (file) => {
    if (!file) return
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Ảnh quá lớn, tối đa ${MAX_IMAGE_MB}MB`)
      return
    }
    setUploading(true)
    try {
      const { url } = await adminApi.uploadImage(file)
      onChange(url)
      toast.success('Đã tải ảnh lên. Bấm Lưu để lưu vào hiện vật.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-ink">Ảnh minh hoạ</span>
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tải ảnh lên hoặc dán link https://..."
        />
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3 py-2 text-sm font-semibold text-ink hover:border-maroon hover:text-maroon">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Tải ảnh
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              handleFile(e.target.files?.[0])
              e.target.value = '' // cho phép chọn lại cùng một file
            }}
          />
        </label>
      </div>
      {value ? (
        <div className="mt-2 flex items-start gap-3">
          <img
            key={value}
            src={value}
            alt="Ảnh xem trước"
            className="h-20 w-20 rounded-lg border border-ink/10 bg-sand/40 object-cover"
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          />
          <button type="button" onClick={() => onChange('')} className="text-xs font-semibold text-maroon hover:underline">
            Bỏ ảnh
          </button>
        </div>
      ) : (
        <span className="mt-1 block text-xs text-ink-soft">JPG, PNG hoặc WEBP, tối đa {MAX_IMAGE_MB}MB.</span>
      )}
    </div>
  )
}

function GeneralFields({ value, onChange, rooms, qrLocked, artifactId = null }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Mã QR" required hint={qrLocked ? 'Mã QR không sửa được sau khi tạo.' : 'Mã in trên bảng QR, không trùng.'}>
        <input className={inputClass} value={value.qr_code} onChange={set('qr_code')} disabled={qrLocked} placeholder="VD: HV-101-01" />
      </Field>
      <Field label="Phòng" required hint={rooms.length === 0 ? 'Chưa có phòng nào — hãy tạo phòng trước.' : undefined}>
        <select required className={inputClass} value={value.room_id} onChange={set('room_id')}>
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
      <Field label="Thời kỳ">
        <input className={inputClass} value={value.period} onChange={set('period')} placeholder="VD: Thế kỷ XIX" />
      </Field>
      <ImageField value={value.image_url} onChange={(url) => onChange({ ...value, image_url: url })} />
      {/* Không bọc trong <Field>/<label>: bấm vào bản đồ trong label sẽ kích hoạt nút/ô nhập bên trong */}
      <div className="sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold text-ink">Vị trí trên bản đồ</span>
        <LocationPicker
          lat={value.lat}
          lng={value.lng}
          excludeId={artifactId}
          loadOthers={loadMapArtifacts}
          onChange={({ lat, lng }) => onChange({ ...value, lat, lng })}
        />
        <details className="mt-3 text-xs text-ink-soft">
          <summary className="cursor-pointer select-none font-semibold">Nhập toạ độ thủ công / bán kính kích hoạt</summary>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="Vĩ độ (lat)">
              <input type="number" step="any" className={inputClass} value={value.lat} onChange={set('lat')} />
            </Field>
            <Field label="Kinh độ (lng)">
              <input type="number" step="any" className={inputClass} value={value.lng} onChange={set('lng')} />
            </Field>
            <Field label="Bán kính kích hoạt (m)">
              <input type="number" min="1" className={inputClass} value={value.geofence_radius} onChange={set('geofence_radius')} />
            </Field>
            <p className="col-span-3 -mt-1">
              Bán kính dùng cho tính năng tự phát thuyết minh theo GPS ở bản mobile.
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Thêm hiện vật mới (kèm bản dịch tiếng Việt bắt buộc)
// ---------------------------------------------------------------------
function CreateArtifactModal({ rooms, onClose, onCreated }) {
  const [general, setGeneral] = useState(generalFromArtifact(null))
  const [vi, setVi] = useState({ title: '', transcript: '', audio_url: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const valid = general.qr_code.trim() && general.room_id && vi.title.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    try {
      const created = await adminApi.createArtifact({
        qr_code: general.qr_code.trim(),
        ...generalToPayload(general),
        translations: [
          {
            language_code: 'vi',
            title: vi.title.trim(),
            transcript: toTextOrNull(vi.transcript),
            audio_url: toTextOrNull(vi.audio_url),
          },
        ],
      })
      toast.success(`Đã tạo hiện vật ${created.qr_code}`)
      onCreated(created.id)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Thêm hiện vật" onClose={onClose} size="max-w-3xl">
      <form onSubmit={handleSubmit}>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Thông tin chung</h3>
        <GeneralFields value={general} onChange={setGeneral} rooms={rooms} />

        <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-ink-soft">Bản dịch tiếng Việt</h3>
        <div className="space-y-4">
          <Field label="Tên hiện vật" required>
            <input className={inputClass} value={vi.title} onChange={(e) => setVi({ ...vi, title: e.target.value })} />
          </Field>
          <Field label="Nội dung thuyết minh" hint="Dùng để đọc bằng giọng TTS khi hiện vật chưa có file audio thu sẵn.">
            <textarea
              rows={5}
              className={inputClass}
              value={vi.transcript}
              onChange={(e) => setVi({ ...vi, transcript: e.target.value })}
            />
          </Field>
          <Field label="Link file audio thu sẵn" hint="Bỏ trống để dùng giọng TTS tự động.">
            <input
              className={inputClass}
              value={vi.audio_url}
              onChange={(e) => setVi({ ...vi, audio_url: e.target.value })}
              placeholder="https://.../audio.mp3"
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-ink-soft">Bản tiếng Anh có thể thêm ngay sau khi tạo.</p>

        <div className="mt-6 flex justify-end gap-2 border-t border-ink/10 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" loading={saving} disabled={!valid}>
            Tạo hiện vật
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------
// Sửa hiện vật: thông tin chung + bản dịch từng ngôn ngữ
// ---------------------------------------------------------------------
function EditArtifactModal({ artifactId, rooms, onClose, onChanged }) {
  const [artifact, setArtifact] = useState(null)
  const [general, setGeneral] = useState(null)
  const [activeLang, setActiveLang] = useState('vi')
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const reload = useCallback(
    () =>
      adminApi
        .getArtifact(artifactId)
        .then((a) => {
          setArtifact(a)
          setGeneral(generalFromArtifact(a))
        })
        .catch((err) => setLoadError(err.message)),
    [artifactId],
  )

  useEffect(() => {
    reload()
  }, [reload])

  const handleSaveGeneral = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApi.updateArtifact(artifactId, generalToPayload(general))
      toast.success('Đã lưu thông tin chung')
      await reload()
      onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const afterTranslationChange = async () => {
    await reload()
    onChanged()
  }

  return (
    <Modal title={artifact ? `Sửa hiện vật ${artifact.qr_code}` : 'Sửa hiện vật'} onClose={onClose} size="max-w-3xl">
      {loadError ? (
        <ErrorBox message={loadError} />
      ) : !artifact ? (
        <LoadingRow />
      ) : (
        <>
          <form onSubmit={handleSaveGeneral}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Thông tin chung</h3>
            <GeneralFields value={general} onChange={setGeneral} rooms={rooms} qrLocked artifactId={artifactId} />
            <div className="mt-4 flex justify-end">
              <Button type="submit" loading={saving}>
                Lưu thông tin chung
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">Bản dịch &amp; audio</h3>
            <div className="mb-4 flex gap-1 border-b border-ink/10" role="tablist">
              {LANGUAGES.map(({ code, label }) => {
                const has = artifact.translations.some((t) => t.language_code === code)
                return (
                  <button
                    key={code}
                    role="tab"
                    aria-selected={activeLang === code}
                    onClick={() => setActiveLang(code)}
                    className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                      activeLang === code ? 'border-maroon text-maroon' : 'border-transparent text-ink-soft hover:text-ink'
                    }`}
                  >
                    {label}
                    {!has && <span className="rounded-full bg-sand px-1.5 text-[10px] font-semibold text-ink-soft">chưa có</span>}
                  </button>
                )
              })}
            </div>

            {LANGUAGES.filter(({ code }) => code === activeLang).map(({ code, label }) => {
              const translation = artifact.translations.find((t) => t.language_code === code)
              return (
                <TranslationPanel
                  key={`${code}-${translation?.id ?? 'new'}`}
                  artifactId={artifactId}
                  lang={code}
                  langLabel={label}
                  translation={translation}
                  isLast={artifact.translations.length <= 1}
                  onChanged={afterTranslationChange}
                />
              )
            })}
          </div>
        </>
      )}
    </Modal>
  )
}

const translationForm = (t) => ({
  title: t?.title ?? '',
  transcript: t?.transcript ?? '',
  audio_url: t?.audio_url ?? '',
  audio_duration: t?.audio_duration ?? '',
})

function TranslationPanel({ artifactId, lang, langLabel, translation, isLast, onChanged }) {
  const initial = translationForm(translation)
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(null) // 'save' | 'delete' | null
  const toast = useToast()
  const confirm = useConfirm()

  const exists = Boolean(translation)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const payload = () => ({
    title: form.title.trim(),
    transcript: toTextOrNull(form.transcript),
    audio_url: toTextOrNull(form.audio_url),
    audio_duration: toNumberOrNull(form.audio_duration),
  })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setBusy('save')
    try {
      if (exists) {
        await adminApi.updateTranslation(artifactId, lang, payload())
        toast.success(`Đã lưu bản dịch ${langLabel}`)
      } else {
        await adminApi.addTranslation(artifactId, { language_code: lang, ...payload() })
        toast.success(`Đã thêm bản dịch ${langLabel}`)
      }
      await onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: `Xoá bản dịch ${langLabel}?`, message: 'Nội dung thuyết minh của ngôn ngữ này sẽ bị xoá.' })
    if (!ok) return
    setBusy('delete')
    try {
      await adminApi.deleteTranslation(artifactId, lang)
      toast.success(`Đã xoá bản dịch ${langLabel}`)
      await onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {!exists && (
        <p className="rounded-lg bg-sand/50 px-3 py-2 text-sm text-ink-soft">
          Hiện vật chưa có bản dịch {langLabel}. Điền nội dung bên dưới rồi bấm “Thêm bản dịch”.
        </p>
      )}
      <Field label="Tên hiện vật" required>
        <input className={inputClass} value={form.title} onChange={set('title')} />
      </Field>
      <Field label="Nội dung thuyết minh" hint="Dùng để đọc bằng giọng TTS khi chưa có file audio thu sẵn.">
        <textarea rows={6} className={inputClass} value={form.transcript} onChange={set('transcript')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="Link file audio thu sẵn" hint="Bỏ trống để dùng giọng TTS tự động.">
          <input className={inputClass} value={form.audio_url} onChange={set('audio_url')} placeholder="https://.../audio.mp3" />
        </Field>
        <Field label="Thời lượng audio (giây)">
          <input type="number" min="0" className={inputClass} value={form.audio_duration} onChange={set('audio_duration')} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <div className="flex items-center gap-3">
          {exists && <AudioPreviewButton artifactId={artifactId} lang={lang} />}
          {exists && dirty && <span className="text-xs text-ink-soft">Nghe thử phát nội dung đã lưu — hãy lưu trước.</span>}
        </div>
        <div className="flex gap-2">
          {exists && (
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={busy === 'delete'}
              disabled={isLast || busy !== null}
              title={isLast ? 'Không thể xoá bản dịch cuối cùng của hiện vật' : undefined}
            >
              <Trash2 size={14} /> Xoá bản dịch
            </Button>
          )}
          <Button type="submit" loading={busy === 'save'} disabled={!form.title.trim() || (exists && !dirty) || busy !== null}>
            {exists ? 'Lưu bản dịch' : 'Thêm bản dịch'}
          </Button>
        </div>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------
// Nghe thử: lấy URL audio đã resolve từ API công khai (file thu sẵn hoặc
// link tts-service) — đúng nguồn audio khách tham quan sẽ nghe.
// ---------------------------------------------------------------------
function AudioPreviewButton({ artifactId, lang }) {
  const [state, setState] = useState('idle') // 'idle' | 'loading' | 'playing'
  const audioRef = useRef(null)
  const toast = useToast()

  const stop = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setState('idle')
  }

  useEffect(() => () => audioRef.current?.pause(), []) // dừng khi đóng modal / đổi tab ngôn ngữ

  const play = async () => {
    setState('loading')
    let source = null
    try {
      const detail = await api.getArtifact(artifactId, lang)
      source = detail.translation.audio_source
      const audio = new Audio(detail.translation.audio_url)
      audioRef.current = audio
      audio.onended = () => setState('idle')
      await audio.play() // bị reject với NotSupportedError nếu không tải được nguồn audio
      setState('playing')
    } catch (err) {
      if (err.name === 'NotSupportedError') {
        toast.error(
          source === 'tts'
            ? 'Không phát được giọng TTS — kiểm tra tts-service (cổng 8001) đã chạy và máy có Internet.'
            : 'Không phát được file audio — kiểm tra lại link audio.',
        )
      } else {
        toast.error(err.message)
      }
      stop()
    }
  }

  if (state === 'playing') {
    return (
      <Button variant="secondary" onClick={stop}>
        <Square size={13} /> Dừng
      </Button>
    )
  }
  return (
    <Button variant="secondary" onClick={play} disabled={state === 'loading'}>
      {state === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />} Nghe thử
    </Button>
  )
}
