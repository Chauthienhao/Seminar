import { useCallback } from 'react'

import ArtifactMapPage from '../components/map/ArtifactMapPage.jsx'
import { api } from '../lib/api.js'
import { useLang } from '../lib/i18n.jsx'

export default function MuseumMap() {
  const { lang, t } = useLang()
  // loadPois đổi khi đổi ngôn ngữ -> ArtifactMapPage tự tải lại ghim theo ngôn ngữ mới
  const loadPois = useCallback((signal) => api.listMapPois(lang, { signal }), [lang])
  return (
    <section
      className="relative isolate z-0 w-full"
      style={{ height: 'calc(100dvh - 65px)', minHeight: 360 }}
      aria-label={t('map.ariaLabel')}
    >
      <ArtifactMapPage loadPois={loadPois} height="100%" />
    </section>
  )
}
