/** Normalize database coordinates without inventing locations. */
export function parseCoordinate(value, limit) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string') {
    value = value.trim();
    if (!value || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

const text = value => typeof value === 'string' ? value.trim() : '';

export function normalizeArtifacts(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const artifacts = [];
  for (const item of input) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    if (typeof item.id !== 'string' && typeof item.id !== 'number') continue;
    if (typeof item.id === 'number' && !Number.isFinite(item.id)) continue;
    const id = String(item.id).trim();
    const lat = parseCoordinate(item.lat, 90);
    const lng = parseCoordinate(item.lng, 180);
    // A later valid entry may replace an earlier invalid entry for the same ID.
    if (!id || lat === null || lng === null || seen.has(id)) continue;
    seen.add(id);
    const room = item.room && typeof item.room === 'object' && !Array.isArray(item.room)
      ? { id: item.room.id, code: text(item.room.code), name_vi: text(item.room.name_vi), name_en: text(item.room.name_en) }
      : null;
    artifacts.push({
      id,
      qr_code: text(item.qr_code),
      title: text(item.title) || 'Hiện vật',
      image_url: text(item.image_url) || null,
      room,
      description: text(item.description) || null,
      lat,
      lng,
    });
  }
  return artifacts;
}

export const coordinateKey = artifact => `${artifact.lat},${artifact.lng}`;

export function groupArtifactsByCoordinate(artifacts) {
  const groups = new Map();
  for (const artifact of artifacts) {
    const key = coordinateKey(artifact);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(artifact);
  }
  return groups;
}

/** Selection, descriptions, and response ordering do not affect the viewport. */
export function coordinateSignature(artifacts) {
  return [...new Set(artifacts.map(coordinateKey))].sort().join('|');
}

export function shortDescription(value, limit = 220) {
  const plain = text(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > limit ? plain.slice(0, limit).trimEnd() + '…' : plain;
}
