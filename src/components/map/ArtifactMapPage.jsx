import React, { useEffect, useState } from 'react';
import ArtifactMap from './ArtifactMap.jsx';

/** `loadPois(signal)` trả về danh sách POI (VD api.listMapPois) — trang cha quyết định nguồn dữ liệu. */
export default function ArtifactMapPage({ loadPois, height = '100%' }) {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setPois([]);
    setLoading(true);
    setError(null);
    Promise.resolve().then(() => loadPois(controller.signal))
      .then(items => {
        if (controller.signal.aborted) throw new Error('POI request was canceled');
        if (!Array.isArray(items)) throw new Error('Invalid POI response');
        if (active) setPois(items);
      })
      .catch(() => { if (active) setError('Không tải được điểm tham quan.'); })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [loadPois, attempt]);

  return <ArtifactMap pois={pois} loading={loading} error={error}
    onRetry={() => setAttempt(value => value + 1)} height={height} />;
}
