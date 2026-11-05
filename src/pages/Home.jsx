import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Search, Clock, MapPin, ArrowRight, Loader2 } from 'lucide-react'

import { api } from '../lib/api.js'

const STEPS = [
  {
    n: '01',
    title: 'Quét mã QR hiện vật',
    desc: 'Tìm các thẻ QR được gắn cạnh tủ trưng bày hiện vật. Dùng camera trên ứng dụng di động (sắp ra mắt) để quét, hoặc tra cứu bằng mã trên website.',
  },
  {
    n: '02',
    title: 'Chọn ngôn ngữ & Nghe',
    desc: 'Hệ thống thuyết minh sẽ tự phát nội dung. Bạn có thể chọn chuyển sang tiếng Việt hoặc tiếng Anh (VI/EN) mọi lúc.',
  },
  {
    n: '03',
    title: 'Khám phá theo lộ trình',
    desc: 'Dựa trên vị trí bạn tham quan, hệ thống sẽ gợi ý các lộ trình phù hợp giúp bạn khám phá trọn vẹn bảo tàng.',
  },
]

export default function Home() {
  const [artifacts, setArtifacts] = useState([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(true)

  // Tạm thời lấy 3 hiện vật đầu tiên từ API làm "nổi bật" — backend chưa có cờ
  // is_featured riêng, có thể bổ sung cột này vào bảng `artifacts` sau nếu cần.
  useEffect(() => {
    api
      .searchArtifacts(undefined, 'vi')
      .then((list) => setArtifacts(list.slice(0, 3)))
      .catch(() => setArtifacts([]))
      .finally(() => setLoadingArtifacts(false))
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-content px-4 pb-12 pt-10 sm:px-6 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
          Hệ thống thuyết minh tự động song ngữ
        </p>
        <div className="mt-4 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Lắng nghe câu chuyện lịch sử Sài Gòn xưa
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              Chào mừng quý khách đến với Bảo tàng Thành phố Hồ Chí Minh. Ứng dụng thuyết minh tự động (Audio Guide)
              giúp bạn tự do khám phá kho tàng di sản qua chiếc điện thoại cá nhân bằng hai ngôn ngữ Việt – Anh.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <NavLink
                to="/tra-cuu-hien-vat"
                className="flex items-center gap-2 rounded-full bg-maroon px-5 py-3 text-sm font-semibold text-cream transition-colors hover:bg-maroon-700"
              >
                <Search size={17} />
                Tra cứu hiện vật ngay
              </NavLink>
              <NavLink
                to="/bo-suu-tap"
                className="flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-maroon hover:text-maroon"
              >
                Xem bộ sưu tập
              </NavLink>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop"
              alt="Trụ sở Bảo tàng Thành phố Hồ Chí Minh, tòa nhà Gia Long"
              className="h-72 w-full object-cover sm:h-96"
            />
          </div>
        </div>
      </section>

      {/* 3-step guide */}
      <section className="border-y border-ink/10 bg-paper">
        <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-semibold sm:text-3xl">Hướng dẫn 3 bước sử dụng đơn giản</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-ink-soft">
            Không cần tải ứng dụng, thao tác ngay trên trình duyệt web
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="rounded-2xl border border-ink/10 bg-cream p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon/10 text-sm font-semibold text-maroon">
                  {step.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured artifacts */}
      <section className="mx-auto max-w-content px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
              Bảo vật &amp; Chủ đề nổi bật
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Hiện vật không thể bỏ qua</h2>
          </div>
          <NavLink
            to="/bo-suu-tap"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-maroon sm:flex"
          >
            Xem tất cả bộ sưu tập <ArrowRight size={15} />
          </NavLink>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {loadingArtifacts && (
            <p className="col-span-3 flex items-center justify-center gap-2 py-10 text-sm text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> Đang tải hiện vật...
            </p>
          )}

          {!loadingArtifacts && artifacts.length === 0 && (
            <p className="col-span-3 rounded-2xl border border-dashed border-ink/15 p-8 text-center text-sm text-ink-soft">
              Chưa có dữ liệu hiện vật. Hãy chạy <code>DB.sql</code> rồi <code>seed_data.sql</code> để tạo dữ liệu mẫu.
            </p>
          )}

          {!loadingArtifacts &&
            artifacts.map((a) => (
              <NavLink
                key={a.id}
                to={`/hien-vat/${a.id}`}
                className="group overflow-hidden rounded-2xl border border-ink/10 bg-paper transition-shadow hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-sand">
                  {a.image_url && (
                    <img
                      src={a.image_url}
                      alt={a.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="p-5">
                  {a.period && <p className="text-xs font-semibold uppercase tracking-wide text-maroon">{a.period}</p>}
                  <h3 className="mt-2 font-serif text-lg font-semibold">{a.title}</h3>
                </div>
              </NavLink>
            ))}
        </div>
      </section>

      {/* Practical info */}
      <section className="border-t border-ink/10 bg-paper">
        <div className="mx-auto grid max-w-content gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">Thông tin tham quan thực tế</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
              Hãy đăng ký trực tiếp nhân viên bảo tàng để hỗ trợ vay và kết hợp cùng hệ thống thuyết minh thông
              minh của chúng tôi để trải nghiệm trọn vẹn nhất khi tham quan.
            </p>
            <div className="mt-6 space-y-3 text-sm text-ink-soft">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-maroon" />
                Giờ mở cửa: 08:00 – 17:00 (Hằng ngày, kể cả Lễ, Tết)
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-maroon" />
                Địa chỉ: 65 Lý Tự Trọng, Quận 1, TP Hồ Chí Minh
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-ink/10 bg-cream p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Vé khách Việt Nam</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-maroon">30.000 VNĐ</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Giảm 50% cho học sinh, sinh viên. Miễn phí cho người cao tuổi và trẻ em.
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-cream p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Vé khách quốc tế</p>
              <p className="mt-2 font-serif text-3xl font-semibold text-maroon">40.000 VNĐ</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Miễn phí truy cập hệ thống thuyết minh Audio Guide đi kèm.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
