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
const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const validId = id => (typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id))) && String(id).trim();

function normalizeArtifact(item) {
  const id = isObject(item) && validId(item.id);
  if (!id) return null;
  return {
    id: String(item.id).trim(),
    code: text(item.code),
    title: text(item.title) || 'Hiện vật',
    image_url: text(item.image_url) || null,
    description: text(item.description) || null,
  };
}

/**
 * Mỗi POI (điểm tham quan) có GPS hợp lệ là một ghim. Hiện vật đặt tại POI nằm trong
 * `artifacts`; POI không có hiện vật (lối vào, quầy thông tin) vẫn được giữ lại.
 * `title` = tên POI, dùng cho tooltip và ghim mờ trong LocationPicker.
 */
export function normalizePois(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const pois = [];
  for (const item of input) {
    if (!isObject(item) || !validId(item.id)) continue;
    const id = String(item.id).trim();
    const lat = parseCoordinate(item.lat, 90);
    const lng = parseCoordinate(item.lng, 180);
    // A later valid entry may replace an earlier invalid entry for the same ID.
    if (lat === null || lng === null || seen.has(id)) continue;
    seen.add(id);
    const room = isObject(item.room)
      ? { id: item.room.id, code: text(item.room.code), name_vi: text(item.room.name_vi), name_en: text(item.room.name_en) }
      : null;
    pois.push({
      id,
      code: text(item.code),
      title: text(item.name_vi) || text(item.code) || 'Điểm tham quan',
      poi_type: text(item.poi_type) || 'EXHIBIT',
      description: text(item.description_vi) || null,
      room,
      artifacts: Array.isArray(item.artifacts) ? item.artifacts.map(normalizeArtifact).filter(Boolean) : [],
      lat,
      lng,
    });
  }
  return pois;
}

export const coordinateKey = point => `${point.lat},${point.lng}`;

/** Selection, descriptions, and response ordering do not affect the viewport. */
export function coordinateSignature(points) {
  return [...new Set(points.map(coordinateKey))].sort().join('|');
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
