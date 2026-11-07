import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { CameraOff, ImagePlus, Loader2, X } from 'lucide-react'

import { extractQrCode } from '../lib/qrCode.mjs'

const INVALID_QR = 'Mã QR này không phải mã hiện vật của bảo tàng.'

function cameraErrorMessage(err) {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Trình duyệt chỉ cho dùng camera trên trang https hoặc localhost.'
  }
  const name = err?.name || ''
  const text = String(err?.message || err || '')
  if (name === 'NotAllowedError' || /permission|denied/i.test(text)) {
    return 'Bạn chưa cho phép website dùng camera. Bấm biểu tượng camera trên thanh địa chỉ để cho phép, rồi mở lại.'
  }
  if (name === 'NotFoundError' || /no camera|not found/i.test(text)) {
    return 'Không tìm thấy camera trên máy này.'
  }
  if (name === 'NotReadableError') {
    return 'Camera đang được ứng dụng khác sử dụng (Zoom, Teams...). Hãy tắt ứng dụng đó rồi thử lại.'
  }
  return 'Không mở được camera.'
}

/**
 * Cửa sổ quét mã QR bằng camera (webcam máy tính hoặc camera điện thoại).
 * Đọc được link /q/<mã> hoặc mã thô; gọi onDetected(mã) ĐÚNG MỘT LẦN rồi tắt camera.
 * Không có camera thì vẫn quét được từ ảnh chụp mã QR.
 */
export default function QrScannerModal({ onClose, onDetected }) {
  const videoRef = useRef(null)
  const scannerRef = useRef(null)
  const doneRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  const [status, setStatus] = useState('starting') // 'starting' | 'scanning' | 'error' | 'done'
  const [cameraError, setCameraError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [cameras, setCameras] = useState([])
  const [cameraId, setCameraId] = useState('')
  const [scanningImage, setScanningImage] = useState(false)

  // Trả về true nếu là mã của bảo tàng (đã xử lý), false nếu là QR lạ
  const handleData = (data) => {
    if (doneRef.current) return true
    const code = extractQrCode(data)
    if (!code) {
      setNotice(INVALID_QR)
      return false
    }
    doneRef.current = true
    setStatus('done')
    scannerRef.current?.stop()
    onDetectedRef.current(code)
    return true
  }
  const handleDataRef = useRef(handleData)
  handleDataRef.current = handleData

  // Esc để đóng + khoá cuộn trang phía sau
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Bật camera khi mở, LUÔN tắt khi đóng (nếu không đèn webcam vẫn sáng)
  useEffect(() => {
    let active = true
    const scanner = new QrScanner(videoRef.current, (result) => handleDataRef.current(result.data), {
      returnDetailedScanResult: true,
      preferredCamera: 'environment', // điện thoại: camera sau
      highlightScanRegion: true,
      highlightCodeOutline: true,
      maxScansPerSecond: 8,
      onDecodeError: () => {}, // khung hình chưa có QR — bình thường, bỏ qua
    })
    scannerRef.current = scanner
    scanner
      .start()
      .then(async () => {
        if (!active) return
        setStatus('scanning')
        const list = await QrScanner.listCameras(true).catch(() => [])
        if (active) setCameras(list)
      })
      .catch((err) => {
        if (!active) return
        setCameraError(cameraErrorMessage(err))
        setStatus('error')
      })
    return () => {
      active = false
      scanner.destroy()
      scannerRef.current = null
    }
  }, [])

  // QR lạ: thông báo tự ẩn sau vài giây, camera vẫn tiếp tục quét
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 2500)
    return () => clearTimeout(timer)
  }, [notice])

  const switchCamera = (id) => {
    setCameraId(id)
    scannerRef.current?.setCamera(id).catch((err) => {
      setCameraError(cameraErrorMessage(err))
      setStatus('error')
    })
  }

  const scanFile = async (file) => {
    if (!file) return
    setScanningImage(true)
    setNotice(null)
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      handleData(result.data)
    } catch {
      setNotice('Không tìm thấy mã QR trong ảnh. Hãy chọn ảnh rõ nét, chụp thẳng mã QR.')
    } finally {
      setScanningImage(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/60 px-4 py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label="Quét mã QR" className="w-full max-w-lg rounded-2xl bg-cream shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-semibold">Quét mã QR hiện vật</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-sand/60 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* qr-scanner vẽ khung quét chồng lên video nên phần tử cha phải là relative */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-900">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />

            {status === 'starting' && (
              <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-cream/80">
                <Loader2 size={16} className="animate-spin" /> Đang mở camera...
              </p>
            )}
            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-cream/90">
                <CameraOff size={26} />
                <p>{cameraError}</p>
              </div>
            )}
            {status === 'done' && (
              <p className="absolute inset-0 flex items-center justify-center gap-2 bg-navy-900/70 text-sm text-cream">
                <Loader2 size={16} className="animate-spin" /> Đã đọc mã, đang mở hiện vật...
              </p>
            )}
            {notice && (
              <p role="status" className="absolute inset-x-3 bottom-3 rounded-lg bg-paper/95 px-3 py-2 text-center text-xs font-semibold text-maroon">
                {notice}
              </p>
            )}
          </div>

          <p className="mt-3 text-sm text-ink-soft">
            Đưa mã QR dán cạnh hiện vật vào giữa khung hình, giữ yên khoảng 1–2 giây.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {cameras.length > 1 && status !== 'error' && (
              <select
                value={cameraId}
                onChange={(e) => switchCamera(e.target.value)}
                aria-label="Chọn camera"
                className="min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm outline-none focus:border-maroon"
              >
                <option value="" disabled>
                  Chọn camera...
                </option>
                {cameras.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
            <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-maroon hover:text-maroon">
              {scanningImage ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              Chọn ảnh có mã QR
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={scanningImage || status === 'done'}
                onChange={(e) => {
                  scanFile(e.target.files?.[0])
                  e.target.value = '' // cho phép chọn lại cùng một ảnh
                }}
              />
            </label>
          </div>

          <p className="mt-4 text-xs text-ink-soft">
            Không quét được? Đóng cửa sổ này và nhập mã in dưới mã QR (VD: SG-1822) vào ô tra cứu.
          </p>
        </div>
      </div>
    </div>
  )
}
