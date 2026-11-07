// Visitor viewing area, including the museum and the GPS samples in seed_data.sql.
// Update these bounds when the sample GPS is replaced with surveyed positions.
// Keep the area fixed: an incorrect API coordinate must never expand the map.
export const MUSEUM_BOUNDS = [
  [10.77495, 106.69832],
  [10.77795, 106.70168],
];
export const MUSEUM_CENTER = [10.77645, 106.7];
export const MUSEUM_MIN_ZOOM = 18;
export const MUSEUM_MAX_ZOOM = 22;
export const MUSEUM_FOCUS_ZOOM = 19.75;
export const MUSEUM_ZOOM_STEP = 0.25;
export const TILE_MAX_ZOOM = 19;

export function isInMuseum(artifact) {
  const [[south, west], [north, east]] = MUSEUM_BOUNDS;
  return artifact.lat >= south && artifact.lat <= north
    && artifact.lng >= west && artifact.lng <= east;
}
