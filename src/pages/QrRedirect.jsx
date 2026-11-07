import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Loader2, QrCode } from 'lucide-react'

import { api, ApiError } from '../lib/api.js'
import { extractQrCode } from '../lib/qrCode.mjs'

/**
 * Route /q/:code — đích đến của link in trong mã QR dán tại hiện vật.
 * Tra hiện vật theo mã rồi chuyển sang trang chi tiết với ?src=qr (để thống kê ghi đúng
 * trigger_method = QR_SCAN). Dùng `replace` để nút Back không quay lại trang trung gian này.
 *
 * KHÔNG đổi/xoá route này: các tờ QR đã in đều trỏ vào đây.
 */
export default function QrRedirect() {
  const { code: rawCode } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const code = extractQrCode(rawCode)

  useEffect(() => {
    if (!code) {
      setError('invalid')
      return undefined
    }
    let active = true
    setError(null)
    api
      .lookupArtifactByQrCode(code, 'vi')
      .then((artifact) => {
        if (active) navigate(`/hien-vat/${artifact.id}?src=qr`, { replace: true })
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError && err.status === 404 ? 'not_found' : 'network')
      })
    return () => {
      active = false
    }
  }, [code, navigate])

  if (!error) {
    return (
      <section className="mx-auto flex max-w-content items-center justify-center gap-2 px-4 py-24 text-sm text-ink-soft">
        <Loader2 size={18} className="animate-spin" /> Đang mở hiện vật {code}...
      </section>
    )
  }

  const message = {
    invalid: 'Mã QR này không phải mã hiện vật của bảo tàng.',
    not_found: `Không tìm thấy hiện vật với mã "${code}". Mã có thể đã bị gỡ hoặc in sai.`,
    network: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
  }[error]

  return (
    <section className="mx-auto max-w-content px-4 py-20 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-maroon/10 text-maroon">
        <QrCode size={22} />
      </span>
      <p className="mx-auto mt-4 max-w-md text-sm text-ink">{message}</p>
      <NavLink
        to="/tra-cuu-hien-vat"
        className="mt-6 inline-block rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-700"
      >
        Tra cứu hiện vật bằng mã
      </NavLink>
    </section>
  )
}
