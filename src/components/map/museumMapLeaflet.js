import L from 'leaflet';
import { MUSEUM_BOUNDS, MUSEUM_MAX_ZOOM, MUSEUM_MIN_ZOOM, MUSEUM_ZOOM_STEP } from './museumMapConfig.mjs';

/** Leaflet pieces shared by the visitor map and the admin location picker. */
export const MUSEUM_AREA = L.latLngBounds(MUSEUM_BOUNDS);

export const OUTSIDE_MUSEUM = [
  [[-85, -180], [-85, 180], [85, 180], [85, -180]],
  [MUSEUM_AREA.getSouthWest(), MUSEUM_AREA.getNorthWest(), MUSEUM_AREA.getNorthEast(), MUSEUM_AREA.getSouthEast()],
];

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export function updateMuseumLimits(map) {
  const size = map.getSize();
  if (!size.x || !size.y) return;
  // Compute at zoom 0 so the previous minZoom cannot prevent relaxing the
  // limit when a desktop viewport becomes a smaller mobile viewport.
  const northWest = map.project(MUSEUM_AREA.getNorthWest(), 0);
  const southEast = map.project(MUSEUM_AREA.getSouthEast(), 0);
  const scale = Math.max(size.x / (southEast.x - northWest.x), size.y / (southEast.y - northWest.y));
  const minZoom = Math.max(MUSEUM_MIN_ZOOM,
    Math.ceil(map.getScaleZoom(scale, 0) / MUSEUM_ZOOM_STEP) * MUSEUM_ZOOM_STEP);
  map.setMaxZoom(Math.max(MUSEUM_MAX_ZOOM, minZoom));
  map.setMinZoom(minZoom);
  map.panInsideBounds(MUSEUM_AREA, { animate: false });
}

function makeIcon(selected) {
  // Only static SVG and application-owned colors enter divIcon HTML.
  const color = selected ? '#7c2741' : '#2878ce';
  return L.divIcon({
    className: 'artifact-map-marker' + (selected ? ' is-selected' : ''),
    html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 40S2 25.5 2 16a14 14 0 1 1 28 0c0 9.5-14 24-14 24Z" fill="${color}" stroke="#fff" stroke-width="2.5"/><circle cx="16" cy="15.5" r="5" fill="#fff"/></svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 40],
    popupAnchor: [0, -35],
    tooltipAnchor: [15, -24],
  });
}

export const DEFAULT_ICON = makeIcon(false);
export const SELECTED_ICON = makeIcon(true);
