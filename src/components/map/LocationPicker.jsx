import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './ArtifactMap.css';
import { normalizeArtifacts, parseCoordinate } from './artifactMapData.mjs';
import {
  isInMuseum,
  MUSEUM_BOUNDS,
  MUSEUM_CENTER,
  MUSEUM_FOCUS_ZOOM,
  MUSEUM_MAX_ZOOM,
  MUSEUM_MIN_ZOOM,
  MUSEUM_ZOOM_STEP,
  TILE_MAX_ZOOM,
} from './museumMapConfig.mjs';
import {
  OUTSIDE_MUSEUM,
  SELECTED_ICON,
  TILE_ATTRIBUTION,
  TILE_URL,
  updateMuseumLimits,
} from './museumMapLeaflet.js';

// 6 decimals ~ 0.1 m: more than enough for a marker, and short to store.
const round = (value) => Math.round(value * 1e6) / 1e6;

/** Keeps the zoom limits right for the (small) picker box and centers once on mount. */
function PickerView({ position }) {
  const map = useMap();
  const initial = useRef(position);
  useEffect(() => {
    updateMuseumLimits(map);
    if (initial.current) map.setView(initial.current, Math.max(map.getMinZoom(), MUSEUM_FOCUS_ZOOM), { animate: false });
    else map.setView(MUSEUM_CENTER, map.getMinZoom(), { animate: false });
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      updateMuseumLimits(map);
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (event) => onPick(event.latlng) });
  return null;
}

/**
 * Admin control: click the map (or drag the pin) to set an artifact's position.
 * `lat` / `lng` are the form's raw values ('' when empty); `onChange` receives
 * numbers, or '' for both when the position is cleared.
 */
export default function LocationPicker({ lat, lng, onChange, excludeId = null, loadOthers }) {
  const parsedLat = parseCoordinate(lat, 90);
  const parsedLng = parseCoordinate(lng, 180);
  const hasPosition = parsedLat !== null && parsedLng !== null;
  const position = hasPosition ? [parsedLat, parsedLng] : null;
  const outside = hasPosition && !isInMuseum({ lat: parsedLat, lng: parsedLng });
  const partial = !hasPosition && (String(lat ?? '').trim() !== '' || String(lng ?? '').trim() !== '');

  const [others, setOthers] = useState([]);
  useEffect(() => {
    if (typeof loadOthers !== 'function') return undefined;
    let active = true;
    Promise.resolve()
      .then(loadOthers)
      .then((items) => { if (active) setOthers(normalizeArtifacts(items)); })
      .catch(() => {}); // the other pins are only a visual aid
    return () => { active = false; };
  }, [loadOthers]);

  const visibleOthers = useMemo(
    () => others.filter((a) => a.id !== String(excludeId ?? '') && isInMuseum(a)),
    [others, excludeId],
  );

  const pick = (latlng) => {
    if (!isInMuseum({ lat: latlng.lat, lng: latlng.lng })) return;
    onChange({ lat: round(latlng.lat), lng: round(latlng.lng) });
  };

  const markerHandlers = useMemo(() => ({
    dragend: (event) => {
      const latlng = event.target.getLatLng();
      if (isInMuseum({ lat: latlng.lat, lng: latlng.lng })) {
        onChange({ lat: round(latlng.lat), lng: round(latlng.lng) });
      } else if (position) {
        event.target.setLatLng(position); // dropped outside the museum: put it back
      }
    },
  }), [onChange, position]);

  return (
    <div className="location-picker">
      <div className="artifact-map location-picker-map" style={{ height: 300 }}>
        <MapContainer center={MUSEUM_CENTER} zoom={MUSEUM_MIN_ZOOM}
          minZoom={MUSEUM_MIN_ZOOM} maxZoom={MUSEUM_MAX_ZOOM}
          zoomSnap={MUSEUM_ZOOM_STEP} zoomDelta={MUSEUM_ZOOM_STEP}
          maxBounds={MUSEUM_BOUNDS} maxBoundsViscosity={1} bounceAtZoomLimits={false}
          scrollWheelZoom={false} doubleClickZoom={false}
          className="artifact-map-canvas" style={{ height: '100%', width: '100%', cursor: 'crosshair' }}>
          <TileLayer url={TILE_URL} maxNativeZoom={TILE_MAX_ZOOM} maxZoom={Infinity}
            bounds={MUSEUM_BOUNDS} noWrap attribution={TILE_ATTRIBUTION} />
          <Polygon positions={OUTSIDE_MUSEUM} stroke={false} fillColor="#edf0eb" fillOpacity={1}
            fillRule="evenodd" interactive={false} />
          <PickerView position={position} />
          <ClickToPlace onPick={pick} />
          {visibleOthers.map((a) => (
            <CircleMarker key={a.id} center={[a.lat, a.lng]} radius={6}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#2878ce', fillOpacity: 0.55 }}>
              <Tooltip direction="top" offset={[0, -6]} className="artifact-map-tooltip">{a.title}</Tooltip>
            </CircleMarker>
          ))}
          {position && !outside && (
            <Marker position={position} icon={SELECTED_ICON} draggable
              eventHandlers={markerHandlers} zIndexOffset={1000} title="Kéo để chỉnh vị trí" />
          )}
        </MapContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className={outside || partial ? 'text-maroon' : 'text-ink-soft'}>
          {outside
            ? 'Toạ độ đang lưu nằm ngoài khu vực bảo tàng nên không hiện trên bản đồ. Bấm vào bản đồ để chọn lại.'
            : partial
              ? 'Toạ độ chưa đủ (thiếu vĩ độ hoặc kinh độ). Bấm vào bản đồ để chọn lại.'
              : hasPosition
                ? `Đã chọn vị trí (${parsedLat}, ${parsedLng}). Kéo ghim hoặc bấm chỗ khác để đổi.`
                : 'Chưa chọn vị trí: bấm vào bản đồ tại nơi đặt hiện vật. Bỏ trống thì hiện vật không hiện trên bản đồ.'}
        </p>
        {(hasPosition || partial) && (
          <button type="button" onClick={() => onChange({ lat: '', lng: '' })}
            className="rounded-full border border-ink/15 px-3 py-1 font-semibold text-ink-soft hover:border-maroon hover:text-maroon">
            Xoá vị trí
          </button>
        )}
      </div>
    </div>
  );
}
