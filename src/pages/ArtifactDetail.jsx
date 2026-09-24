import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Pause, RotateCcw, RotateCw, Heart, Share2, ChevronDown } from 'lucide-react'

// Dữ liệu mẫu — trong thực tế sẽ được lấy từ backend Python, ví dụ:
// GET /api/artifacts/{slug}
const ARTIFACT = {
  tag: 'Bảo vật quốc gia — Niên đại 1822',
  title: 'Ấn đồng Tả quân Lê Văn Duyệt',
  zone: 'Khu trưng bày: Sài Gòn - Gia Định thế kỷ 19-20',
  summary:
    'Ấn đồng Tả quân Lê Văn Duyệt đúc dưới triều Minh Mạng thứ 3 (1822), có khắc chữ "Tả quân chi ấn". Lê Văn Duyệt là vị tổng trấn nổi tiếng, làm chính công lao to lớn đối với vùng đất Nam Bộ. Ấn có tạo tác rất tinh xảo, tập trung thể hiện quyền lực cao thời bấy giờ, phản ánh kỹ thuật đúc đồng tinh tế của cư dân Nam Bộ thế kỷ 19.',
  transcript:
    'Ấn đồng phát hiện trong công trình nghiên cứu của các nhà khảo cổ tại Sài Gòn. Đây là một trong những hiện vật tiêu biểu, lưu giữ trọng vẹn dấu ấn quyền lực hành chính, tôn vinh vai trò của Tả quân Lê Văn Duyệt trong tiến trình khai phá và phát triển vùng đất Nam Bộ.',
  audioTitle: 'Thuyết minh giọng đọc AI',
}

export default function ArtifactDetail() {
  const { id } = useParams()
  const [playing, setPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)
  const [lang, setLang] = useState('vi')

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.1fr]">
        {/* Media column */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-ink/10">
            <img
              src="https://images.unsplash.com/photo-1610375461369-d613b564f4c4?q=80&w=1000&auto=format&fit=crop"
              alt={ARTIFACT.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          {/* Audio player */}
          <div className="mt-5 rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-maroon">
                <span className="h-1.5 w-1.5 rounded-full bg-maroon" />
                {ARTIFACT.audioTitle}
              </p>
              <span className="text-xs font-medium text-ink-soft">Tốc độ: 1.0x</span>
            </div>

            <div className="mt-4">
              <div className="h-1.5 w-full rounded-full bg-ink/10">
                <div className="h-1.5 w-1/3 rounded-full bg-maroon" />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-ink-soft">
                <span>0:34</span>
                <span>1:45</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <button className="text-ink-soft transition-colors hover:text-maroon" aria-label="Lùi 10 giây">
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream transition-colors hover:bg-maroon-700"
                aria-label={playing ? 'Tạm dừng' : 'Phát'}
              >
                {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <button className="text-ink-soft transition-colors hover:text-maroon" aria-label="Tiến 10 giây">
                <RotateCw size={20} />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 border-t border-ink/10 pt-4">
              <button
                onClick={() => setLiked((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  liked ? 'border-maroon bg-maroon/10 text-maroon' : 'border-ink/15 text-ink-soft hover:border-maroon hover:text-maroon'
                }`}
              >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                Yêu thích hiện vật
              </button>
              <button className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-maroon hover:text-maroon">
                <Share2 size={14} />
                Chia sẻ tư liệu
              </button>
            </div>
          </div>
        </div>

        {/* Info column */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">{ARTIFACT.tag}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{ARTIFACT.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{ARTIFACT.zone}</p>
          {id && <p className="mt-1 text-[11px] text-ink-soft/60">Mã tra cứu: {id}</p>}

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setLang('vi')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                lang === 'vi' ? 'bg-navy-800 text-cream' : 'border border-ink/15 text-ink-soft'
              }`}
            >
              Bản tiếng Việt
            </button>
            <button
              onClick={() => setLang('en')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                lang === 'en' ? 'bg-navy-800 text-cream' : 'border border-ink/15 text-ink-soft'
              }`}
            >
              English Version
            </button>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-ink-soft">{ARTIFACT.summary}</p>

          <div className="mt-6 rounded-2xl border border-ink/10 bg-paper">
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-ink">Toàn văn thuyết minh (Transcript)</span>
              <ChevronDown
                size={18}
                className={`text-ink-soft transition-transform ${showTranscript ? 'rotate-180' : ''}`}
              />
            </button>
            {showTranscript && (
              <p className="border-t border-ink/10 px-5 pb-5 pt-4 text-sm italic leading-relaxed text-ink-soft">
                "{ARTIFACT.transcript}"
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
