import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Timer, ScanLine } from 'lucide-react'

export default function QRScanner() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!code.trim()) return
    // TODO: gọi API backend Python để tra cứu hiện vật theo mã, ví dụ:
    // const res = await fetch(`/api/artifacts/lookup?code=${code}`)
    navigate(`/hien-vat/${encodeURIComponent(code.trim().toLowerCase())}`)
  }

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Camera viewfinder mock */}
        <div className="overflow-hidden rounded-2xl bg-navy-900 text-cream">
          <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-navy-900 to-navy-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-40 w-40 sm:h-52 sm:w-52">
                <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-maroon" />
                <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-maroon" />
                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-maroon" />
                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-maroon" />
              </div>
            </div>
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-maroon" />
              Đang tìm mã QR...
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-full bg-black/40 px-3 py-1.5 text-[11px] text-cream/80">
              <span className="flex items-center gap-1"><Timer size={12} /> 1/160s</span>
              <span>f/2.0</span>
              <span>ISO 640</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">Quét mã trực tiếp</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Hướng dẫn cấp quyền &amp; quét mã</h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Nếu trình duyệt của bạn yêu cầu, vui lòng chọn <strong className="text-ink">"Cho phép" (Allow)</strong> để
            khởi chạy Camera điện thoại và đồng ý với mã QR dán trên các trưng bày hiện vật.
          </p>

          <ol className="mt-6 space-y-4">
            <li className="flex gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-maroon/10 text-xs font-semibold text-maroon">1</span>
              <span className="text-ink-soft">Hướng camera điện thoại vào mã QR gắn trên trưng bày.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-maroon/10 text-xs font-semibold text-maroon">2</span>
              <span className="text-ink-soft">Giữ camera ổn định khoảng 2 giây để nhận diện tự động.</span>
            </li>
          </ol>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Smartphone size={16} className="text-maroon" />
              Nhập mã hiện vật thủ công
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Trường hợp camera không hoạt động, bạn có thể nhập mã trưng bày cùng hệ thống tra cứu.
            </p>
            <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Nhập mã hiện vật (Ví dụ: SG-1822)..."
                className="w-full rounded-full border border-ink/15 bg-cream px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-maroon"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700"
              >
                <ScanLine size={15} />
                Truy cập
              </button>
            </form>
            <p className="mt-3 text-[11px] text-ink-soft/70">
              Camera hỗ trợ quét bản mềm, dữ liệu chỉ được xử lý cục bộ để đảm bảo quyền riêng tư.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
