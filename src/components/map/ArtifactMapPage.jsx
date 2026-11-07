import React, { useEffect, useState } from 'react';
import ArtifactMap from './ArtifactMap.jsx';

async function fetchArtifacts(signal) {
  const response = await fetch('/api/map/artifacts?lang=vi', { signal });
  if (!response.ok) throw new Error('Cannot load artifact positions');
  return response.json();
}

export default function ArtifactMapPage({ loadArtifacts = fetchArtifacts, height = '100%' }) {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setArtifacts([]);
    setLoading(true);
    setError(null);
    Promise.resolve().then(() => loadArtifacts(controller.signal))
      .then(items => {
        if (controller.signal.aborted) throw new Error('Artifact request was canceled');
        if (!Array.isArray(items)) throw new Error('Invalid artifact response');
        if (active) setArtifacts(items);
      })
      .catch(() => { if (active) setError('Không tải được hiện vật.'); })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [loadArtifacts, attempt]);

  return <ArtifactMap artifacts={artifacts} loading={loading} error={error}
    onRetry={() => setAttempt(value => value + 1)} height={height} />;
}
