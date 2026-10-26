import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlaybackTracker } from '../src/lib/playbackTracker.js'

function fixture(sendOverride) {
  let time = 0
  const sent = []
  const tracker = createPlaybackTracker({ artifact_id: 'a', session_id: 'anon', language_played: 'en' },
    sendOverride || (payload => { sent.push(payload); return Promise.resolve(payload) }),
    { now: () => time, id: 'play-one', nextId: () => 'play-two' })
  return { tracker, sent, advance: ms => { time += ms } }
}

test('never logs until actual playing; pause/resume retains one ID with cumulative duration', async () => {
  const { tracker, sent, advance } = fixture()
  tracker.stop()
  await tracker.settled()
  assert.equal(sent.length, 0)
  tracker.start()
  await tracker.settled()
  assert.equal(sent[0].listen_duration, null)
  advance(10200)
  tracker.stop()
  await tracker.settled()
  advance(60000) // time paused is excluded
  tracker.start()
  advance(5900)
  tracker.finish()
  tracker.stop() // browser may emit pause and ended for the same playback
  await tracker.settled()
  assert.deepEqual(sent.map(p => p.listen_duration), [null, 10, 16])
  assert.equal(new Set(sent.map(p => p.id)).size, 1)
})

test('buffering/seeking do not count; checkpoints preserve cumulative clock', async () => {
  const { tracker, sent, advance } = fixture()
  tracker.start()
  advance(4000)
  tracker.suspend()
  advance(30000)
  tracker.start()
  advance(2000)
  tracker.checkpoint()
  advance(3000)
  tracker.stop()
  await tracker.settled()
  assert.deepEqual(sent.map(p => p.listen_duration), [null, 6, 9])
})

test('full replay creates a new ID; requests capture the original ID before replay', async () => {
  const { tracker, sent, advance } = fixture()
  tracker.start()
  advance(5000)
  tracker.finish()
  tracker.start()
  advance(1000)
  tracker.stop()
  await tracker.settled()
  assert.deepEqual(sent.map(p => [p.id, p.listen_duration]), [['play-one', null], ['play-one', 5], ['play-two', null], ['play-two', 1]])
})

test('failed snapshot is retried without generating another play ID', async () => {
  let calls = 0
  const sent = []
  const { tracker, advance } = fixture(payload => { calls++; sent.push(payload); return calls === 2 ? Promise.reject(Error('offline')) : Promise.resolve() })
  tracker.start()
  await tracker.settled()
  advance(7000)
  tracker.stop()
  await tracker.settled()
  tracker.checkpoint()
  await tracker.settled()
  assert.deepEqual(sent.map(p => p.listen_duration), [null, 7, 7])
  assert.ok(sent.every(p => p.id === 'play-one'))
})
