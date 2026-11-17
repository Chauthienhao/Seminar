import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, NavLink } from 'react-router-dom'
import { Play, Pause, RotateCcw, RotateCw, Heart, Share2, ChevronDown, Loader2 } from 'lucide-react'

import { api, ApiError } from '../lib/api.js'
import { getSessionId } from '../lib/session.js'
import { pick, useLang } from '../lib/i18n.jsx'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ArtifactDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const fromQr = searchParams.get('src') === 'qr'
  // Dùng chung ngôn ngữ với nút VI/EN trên Header — đổi ở đâu thì cả site đổi theo
  const { lang, setLang, t } = useLang()
  const [artifact, setArtifact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [liked, setLiked] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)

  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const hasLoggedPlay = useRef(false)

  // GET /api/artifacts/{id}?lang=... — gọi lại mỗi khi đổi id (chuyển hiện vật) hoặc đổi ngôn ngữ.
  // Audio đang phát sẽ dừng hẳn (trình phát bị gỡ trong lúc tải) để không phát chồng 2 thứ tiếng.
  useEffect(() => {
    let active = true
    audioRef.current?.pause()
    setLoading(true)
    setError(null)
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    hasLoggedPlay.current = false
    api
      .getArtifact(id, lang)
      .then((data) => active && setArtifact(data))
      .catch((err) =>
        active && setError(err instanceof ApiError && err.status === 404 ? 'not_found' : 'network')
      )
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, lang])

  const togglePlay = () => {
    const audioEl = audioRef.current
    if (!audioEl) return
    if (playing) {
      audioEl.pause()
    } else {
      audioEl.play()
      // Ghi log lượt phát CHỈ MỘT LẦN cho mỗi lần tải trang (POST /api/play-logs)
      if (!hasLoggedPlay.current && artifact) {
        hasLoggedPlay.current = true
        api
          .logPlay({
            artifact_id: artifact.id,
            session_id: getSessionId(),
            // ?src=qr do trang /q/:code (link trong mã QR) gắn vào; vào từ tìm kiếm/bản đồ/tour là MANUAL
            trigger_method: fromQr ? 'QR_SCAN' : 'MANUAL',
            // Ghi ngôn ngữ THỰC SỰ được phát (backend có thể trả bản VI nếu chưa có bản EN)
            language_played: artifact.translation.language_code,
          })
          .catch(() => {
            /* Lỗi ghi log không nên chặn trải nghiệm nghe audio của khách */
          })
      }
    }
  }

  const seek = (deltaSeconds) => {
    const audioEl = audioRef.current
    if (!audioEl) return
    audioEl.currentTime = Math.min(Math.max(audioEl.currentTime + deltaSeconds, 0), duration || Infinity)
  }

  const handleScrub = (e) => {
    const audioEl = audioRef.current
    if (!audioEl) return
    audioEl.currentTime = Number(e.target.value)
  }

  if (loading) {
    return (
      <section className="mx-auto flex max-w-content items-center justify-center gap-2 px-4 py-24 text-sm text-ink-soft">
        <Loader2 size={18} className="animate-spin" /> {t('artifact.loading')}
      </section>
    )
  }

  if (error) {
    return (
      <section className="mx-auto max-w-content px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">
          {error === 'not_found' ? t('artifact.notFoundTitle') : t('artifact.networkTitle')}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {error === 'not_found' ? t('artifact.notFoundDesc') : t('common.serverDown')}
        </p>
        <NavLink to="/tra-cuu-hien-vat" className="mt-6 inline-block text-sm font-semibold text-maroon">
          {t('common.backToLookup')}
        </NavLink>
      </section>
    )
  }

  const { translation, room } = artifact
  const available = artifact.available_languages || []
  // Backend tự lùi về bản có sẵn khi thiếu bản dịch -> báo cho khách biết vì sao nội dung không đúng ngôn ngữ
  const showingFallback = translation.language_code !== lang

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.1fr]">
        {/* Media column */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
            {artifact.image_url && (
              <img src={artifact.image_url} alt={translation.title} className="aspect-[4/3] w-full object-contain" />
            )}
          </div>

          {/* Audio player */}
          <div className="mt-5 rounded-2xl border border-ink/10 bg-paper p-5">
            <audio
              ref={audioRef}
              src={translation.audio_url}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />

            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-maroon">
                <span className="h-1.5 w-1.5 rounded-full bg-maroon" />
                {t('artifact.narration')}{' '}
                {translation.audio_source === 'tts' ? t('artifact.sourceTts') : t('artifact.sourceRecorded')}
              </p>
            </div>

            <div className="mt-4">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleScrub}
                className="h-1.5 w-full accent-maroon"
              />
              <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <button onClick={() => seek(-10)} className="text-ink-soft transition-colors hover:text-maroon" aria-label={t('artifact.rewind')}>
                <RotateCcw size={20} />
              </button>
              <button
                onClick={togglePlay}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream transition-colors hover:bg-maroon-700"
                aria-label={playing ? t('artifact.pause') : t('artifact.play')}
              >
                {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <button onClick={() => seek(10)} className="text-ink-soft transition-colors hover:text-maroon" aria-label={t('artifact.forward')}>
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
                {t('artifact.favorite')}
              </button>
              <button className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-maroon hover:text-maroon">
                <Share2 size={14} />
                {t('artifact.share')}
              </button>
            </div>
          </div>
        </div>

        {/* Info column */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
            {artifact.code}
            {artifact.period ? ` — ${artifact.period}` : ''}
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{translation.title}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {t('artifact.location')}: {pick(artifact.poi, 'name', lang)}
            {room ? ` — ${pick(room, 'name', lang)}` : ''}
          </p>

          <div className="mt-5 flex gap-2">
            {[
              { code: 'vi', label: t('artifact.versionVi') },
              { code: 'en', label: t('artifact.versionEn') },
            ].map((option) => {
              const missing = !available.includes(option.code)
              return (
                <button
                  key={option.code}
                  onClick={() => setLang(option.code)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    lang === option.code ? 'bg-navy-800 text-cream' : 'border border-ink/15 text-ink-soft'
                  } ${missing && lang !== option.code ? 'opacity-50' : ''}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          {showingFallback && (
            <p className="mt-3 rounded-lg bg-sand/60 px-3 py-2 text-xs text-ink-soft">{t('artifact.missingTranslation')}</p>
          )}

          {translation.transcript && (
            <div className="mt-6 rounded-2xl border border-ink/10 bg-paper">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-ink">{t('artifact.transcript')}</span>
                <ChevronDown
                  size={18}
                  className={`text-ink-soft transition-transform ${showTranscript ? 'rotate-180' : ''}`}
                />
              </button>
              {showTranscript && (
                <p className="border-t border-ink/10 px-5 pb-5 pt-4 text-sm italic leading-relaxed text-ink-soft">
                  "{translation.transcript}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
