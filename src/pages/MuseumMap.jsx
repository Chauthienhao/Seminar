import ArtifactMapPage from '../components/map/ArtifactMapPage.jsx'
import { api } from '../lib/api.js'

const loadPois = signal => api.listMapPois('vi', { signal })

export default function MuseumMap() {
  return (
    <section
      className="relative isolate z-0 w-full"
      style={{ height: 'calc(100dvh - 65px)', minHeight: 360 }}
      aria-label="Bản đồ điểm tham quan"
    >
      <ArtifactMapPage loadPois={loadPois} height="100%" />
    </section>
  )
}
