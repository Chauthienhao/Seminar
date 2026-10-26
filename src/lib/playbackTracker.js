/** One anonymous playback ID, cumulative wall time actually spent playing.
 * Snapshots reuse the ID, so pause/end/checkpoint retries cannot add plays.
 * Seeking and buffering suspend the clock. currentTime is never used as time
 * listened (scrubbing forward must not count as listening).
 */
export function createPlaybackTracker(metadata, send, { now = () => performance.now(), id = crypto.randomUUID(), nextId = () => crypto.randomUUID() } = {}) {
  let started = false
  let runningSince = null
  let elapsed = 0
  let lastSent
  let recordId = id
  let finished = false
  const pending = new Set()

  function persist(duration) {
    if (lastSent === duration && started) return
    lastSent = duration
    const payload = { ...metadata, id: recordId, listen_duration: duration }
    // Start keepalive fetch synchronously: pagehide must not defer it to a
    // microtask which the browser may discard during document navigation.
    let sending
    try { sending = send(payload) } catch (error) { sending = Promise.reject(error) }
    const request = Promise.resolve(sending)
      .catch(() => { if (recordId === payload.id && lastSent === duration) lastSent = undefined })
      .finally(() => pending.delete(request))
    pending.add(request)
  }
  function suspend() {
    if (runningSince !== null) elapsed += Math.max(0, now() - runningSince)
    runningSince = null
  }
  function checkpoint() {
    if (!started) return
    const seconds = (elapsed + (runningSince === null ? 0 : Math.max(0, now() - runningSince))) / 1000
    persist(Math.min(86400, Math.floor(seconds)))
  }
  return {
    start() {
      if (finished) {
        recordId = nextId()
        finished = false
        started = false
        elapsed = 0
        lastSent = undefined
      }
      if (!started) { started = true; persist(null) }
      if (runningSince === null) runningSince = now()
    },
    suspend,
    checkpoint,
    stop() { suspend(); checkpoint() },
    finish() { suspend(); checkpoint(); finished = true },
    // Useful for callers/tests awaiting in-flight telemetry without blocking audio.
    async settled() { await Promise.all([...pending]) },
  }
}
