import { useEffect, useRef, useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { Play, Pause, RotateCcw, RotateCw, Heart, Share2, ChevronDown, Loader2 } from 'lucide-react'

import { api, ApiError } from '../lib/api.js'
import { getSessionId } from '../lib/session.js'
import { createPlaybackTracker } from '../lib/playbackTracker.js'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ArtifactDetail() {
  const { id } = useParams()
  const [lang, setLang] = useState('vi')
  const [artifact, setArtifact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [liked, setLiked] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)

  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // GET /api/artifacts/{id}?lang=vi — gọi lại mỗi khi đổi id (chuyển hiện vật) hoặc đổi ngôn ngữ
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    api
      .getArtifact(id, lang)
      .then((data) => { if (!cancelled) setArtifact(data) })
      .catch((err) =>
        !cancelled && setError(err instanceof ApiError && err.status === 404 ? 'not_found' : 'network')
      )
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, lang])

  useEffect(() => {
    const audio = audioRef.current
    if (loading || !artifact || !audio) return
    const tracker = createPlaybackTracker({
      artifact_id: artifact.id,
      session_id: getSessionId(),
      trigger_method: 'MANUAL',
      language_played: artifact.translation.language_code,
    }, api.logPlay)
    const resume = () => { if (!audio.paused && !audio.ended && audio.readyState >= 3) tracker.start() }
    const events = {
      playing: resume, seeked: resume,
      waiting: tracker.suspend, seeking: tracker.suspend,
      pause: tracker.stop, ended: tracker.finish, error: tracker.stop,
    }
    Object.entries(events).forEach(([event, handler]) => audio.addEventListener(event, handler))
    const timer = setInterval(tracker.checkpoint, 15000)
    const checkpoint = () => tracker.checkpoint()
    window.addEventListener('pagehide', checkpoint)
    document.addEventListener('visibilitychange', checkpoint)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', checkpoint)
      document.removeEventListener('visibilitychange', checkpoint)
      Object.entries(events).forEach(([event, handler]) => audio.removeEventListener(event, handler))
      tracker.stop() // navigation, language change or unmount: flush the old POI
      audio.pause()
    }
  }, [artifact, loading])

  const togglePlay = () => {
    const audioEl = audioRef.current
    if (!audioEl) return
    if (playing) {
      audioEl.pause()
    } else {
      audioEl.play().catch(() => setPlaying(false))
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
        <Loader2 size={18} className="animate-spin" /> Đang tải thông tin hiện vật...
      </section>
    )
  }

  if (error) {
    return (
      <section className="mx-auto max-w-content px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">
          {error === 'not_found' ? 'Không tìm thấy hiện vật này' : 'Không thể kết nối tới máy chủ'}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {error === 'not_found'
            ? 'Mã hiện vật không tồn tại hoặc đã bị gỡ khỏi hệ thống.'
            : `Kiểm tra lại backend đã chạy ở http://localhost:8000 chưa.`}
        </p>
        <NavLink to="/tra-cuu-hien-vat" className="mt-6 inline-block text-sm font-semibold text-maroon">
          ← Quay lại trang Tra cứu hiện vật
        </NavLink>
      </section>
    )
  }

  const { translation, room } = artifact

  return (
    <section className="mx-auto max-w-content px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.1fr]">
        {/* Media column */}
        <div>
          <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
            {artifact.image_url && (
              <img src={artifact.image_url} alt={translation.title} className="aspect-[4/3] w-full object-cover" />
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
                Thuyết minh {translation.audio_source === 'tts' ? '(giọng AI tổng hợp)' : '(giọng thu sẵn)'}
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
              <button onClick={() => seek(-10)} className="text-ink-soft transition-colors hover:text-maroon" aria-label="Lùi 10 giây">
                <RotateCcw size={20} />
              </button>
              <button
                onClick={togglePlay}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream transition-colors hover:bg-maroon-700"
                aria-label={playing ? 'Tạm dừng' : 'Phát'}
              >
                {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <button onClick={() => seek(10)} className="text-ink-soft transition-colors hover:text-maroon" aria-label="Tiến 10 giây">
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-maroon">
            {artifact.qr_code}
            {artifact.period ? ` — ${artifact.period}` : ''}
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{translation.title}</h1>
          {room && <p className="mt-2 text-sm text-ink-soft">Khu trưng bày: {room.name_vi}</p>}

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

          {translation.transcript && (
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
