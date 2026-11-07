import ArtifactMapPage from '../components/map/ArtifactMapPage.jsx'
import { api } from '../lib/api.js'

const loadArtifacts = signal => api.listArtifactPositions('vi', { signal })

export default function MuseumMap() {
  return (
    <section
      className="relative isolate z-0 w-full"
      style={{ height: 'calc(100dvh - 65px)', minHeight: 360 }}
      aria-label="Bản đồ vị trí hiện vật"
    >
      <ArtifactMapPage loadArtifacts={loadArtifacts} height="100%" />
    </section>
  )
}
