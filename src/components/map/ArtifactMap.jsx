import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ArtifactMap.css';
import {
  coordinateKey,
  coordinateSignature,
  groupArtifactsByCoordinate,
  normalizeArtifacts,
  shortDescription,
} from './artifactMapData.mjs';
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

const EMPTY_ARTIFACTS = [];
const MUSEUM_AREA = L.latLngBounds(MUSEUM_BOUNDS);
const OUTSIDE_MUSEUM = [
  [[-85, -180], [-85, 180], [85, 180], [85, -180]],
  [MUSEUM_AREA.getSouthWest(), MUSEUM_AREA.getNorthWest(), MUSEUM_AREA.getNorthEast(), MUSEUM_AREA.getSouthEast()],
];

function updateMuseumLimits(map) {
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

function focusArtifacts(map, points) {
  if (!points.length) {
    map.setView(MUSEUM_CENTER, map.getMinZoom(), { animate: false });
  } else if (points.length === 1) {
    map.setView(points[0], Math.max(map.getMinZoom(), MUSEUM_FOCUS_ZOOM), { animate: false });
  } else {
    map.fitBounds(L.latLngBounds(points), {
      padding: [36, 36], maxZoom: Math.max(map.getMinZoom(), MUSEUM_FOCUS_ZOOM), animate: false,
    });
  }
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

const DEFAULT_ICON = makeIcon(false);
const SELECTED_ICON = makeIcon(true);

function FitArtifactBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    updateMuseumLimits(map);
    focusArtifacts(map, points);
  }, [map, points]);

  useEffect(() => {
    const onResize = () => updateMuseumLimits(map);
    map.on('resize', onResize);
    if (typeof ResizeObserver === 'undefined') return () => map.off('resize', onResize);
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      updateMuseumLimits(map);
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      map.off('resize', onResize);
    };
  }, [map]);
  return null;
}

function MuseumResetControl({ points }) {
  const map = useMap();
  useEffect(() => {
    const control = L.control({ position: 'topright' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar artifact-map-reset');
      const button = L.DomUtil.create('button', '', container);
      button.type = 'button';
      button.textContent = 'Về bảo tàng';
      button.title = 'Trở về khu vực hiện vật trong bảo tàng';
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(button, 'click', () => {
        map.closePopup();
        updateMuseumLimits(map);
        focusArtifacts(map, points);
      });
      return container;
    };
    control.addTo(map);
    return () => control.remove();
  }, [map, points]);
  return null;
}

function MuseumPopupBounds() {
  const map = useMap();
  useEffect(() => {
    let popup = null;
    let observer = null;
    let positioning = false;
    const fitPopup = () => {
      const element = popup?.getElement();
      if (!element || !popup.isOpen() || positioning) return;
      positioning = true;
      try {
        const size = map.getSize();
        // Keep long content scrollable, including on short landscape screens.
        popup.options.maxHeight = Math.max(60, Math.min(390, size.y - 120));
        popup.options.maxWidth = Math.max(80, Math.min(320, size.x - 64));
        popup.options.minWidth = Math.min(230, popup.options.maxWidth);
        popup.options.offset = L.point(0, 7);
        popup.update();
        const frame = map.getContainer().getBoundingClientRect();
        const rect = element.getBoundingClientRect();
        const left = frame.left + 12;
        const right = frame.right - 12;
        const top = frame.top + 52;
        const bottom = frame.bottom - 12;
        const dx = rect.left < left ? left - rect.left : rect.right > right ? right - rect.right : 0;
        const dy = rect.top < top ? top - rect.top : rect.bottom > bottom ? bottom - rect.bottom : 0;
        // Move the card within the map instead of allowing Leaflet autoPan to
        // move the viewport beyond maxBounds for a marker near an edge.
        if (dx || dy) {
          popup.options.offset = L.point(dx, 7 + dy);
          popup.update();
        }
        element.classList.toggle('artifact-map-popup-shifted', Boolean(dx || dy));
      } finally {
        positioning = false;
      }
    };
    const closePopup = () => {
      observer?.disconnect();
      observer = null;
      popup = null;
    };
    const openPopup = event => {
      closePopup();
      popup = event.popup;
      fitPopup();
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(fitPopup);
        observer.observe(popup.getElement());
      }
    };
    map.on('popupopen', openPopup);
    map.on('popupclose', closePopup);
    map.on('moveend resize', fitPopup);
    return () => {
      closePopup();
      map.off('popupopen', openPopup);
      map.off('popupclose', closePopup);
      map.off('moveend resize', fitPopup);
    };
  }, [map]);
  return null;
}

function ArtifactImage({ artifact }) {
  const [failed, setFailed] = useState(false);
  if (!artifact.image_url || failed) {
    return <div className="artifact-map-image-placeholder">Chưa có ảnh</div>;
  }
  return <img className="artifact-map-image" src={artifact.image_url} alt={artifact.title}
    loading="lazy" onError={() => setFailed(true)} />;
}

function ArtifactPopup({ artifact, coincidentArtifacts, onSelect }) {
  const description = shortDescription(artifact.description);
  return (
    <article className="artifact-map-popup" data-artifact-id={artifact.id}>
      {coincidentArtifacts.length > 1 && <label className="artifact-map-coincident-label">
        Hiện vật tại vị trí này ({coincidentArtifacts.length})
        <select className="artifact-map-coincident-select" value={artifact.id}
          onChange={event => onSelect(event.target.value)}>
          {coincidentArtifacts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>}
      <h3>{artifact.title}</h3>
      <ArtifactImage key={artifact.id + ':' + artifact.image_url} artifact={artifact} />
      <dl className="artifact-map-facts">
        <div><dt>Mã hiện vật</dt><dd>{artifact.qr_code || 'Chưa có mã hiện vật'}</dd></div>
        <div><dt>Phòng</dt><dd>{artifact.room?.name_vi || 'Chưa có thông tin phòng'}</dd></div>
      </dl>
      <p className="artifact-map-description">{description || 'Chưa có mô tả.'}</p>
      <Link className="artifact-map-details-link" to={'/hien-vat/' + encodeURIComponent(artifact.id)}>Xem chi tiết</Link>
    </article>
  );
}

function ArtifactMarker({ artifact, coincidentArtifacts, selectedId, onSelect }) {
  const markerRef = useRef(null);
  const selected = selectedId === artifact.id;
  useEffect(() => {
    const element = markerRef.current?.getElement();
    if (!element) return;
    // DOM attributes preserve arbitrary database IDs without interpolating HTML.
    element.setAttribute('data-artifact-id', artifact.id);
    element.setAttribute('data-artifact-lat', String(artifact.lat));
    element.setAttribute('data-artifact-lng', String(artifact.lng));
  }, [artifact.id, artifact.lat, artifact.lng, selected]);
  useEffect(() => {
    // Coincident selection opens the selected artifact's own popup and marker.
    if (selected) markerRef.current?.openPopup();
  }, [selected]);
  return (
    <Marker ref={markerRef} position={[artifact.lat, artifact.lng]} title={artifact.title}
      alt={artifact.title} icon={selected ? SELECTED_ICON : DEFAULT_ICON}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(artifact.id) }}>
      <Tooltip className="artifact-map-tooltip" direction="auto">{artifact.title}</Tooltip>
      <Popup minWidth={230} maxWidth={320} maxHeight={390} autoPan={false}>
        <ArtifactPopup artifact={artifact} coincidentArtifacts={coincidentArtifacts} onSelect={onSelect} />
      </Popup>
    </Marker>
  );
}

/** Display-only map. Its parent owns API requests; detail links use the app router. */
export default function ArtifactMap({ artifacts = EMPTY_ARTIFACTS, loading = false, error = null, onRetry, height = '100%' }) {
  const normalized = useMemo(() => normalizeArtifacts(artifacts).filter(isInMuseum), [artifacts]);
  const groups = useMemo(() => groupArtifactsByCoordinate(normalized), [normalized]);
  const signature = coordinateSignature(normalized);
  // The signature consists only of unique coordinate values. Selecting a marker,
  // switching coincident artifacts, or receiving a reordered response never refits.
  const points = useMemo(() => signature ? signature.split('|').map(pair => pair.split(',').map(Number)) : [], [signature]);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (selectedId !== null && !normalized.some(item => item.id === selectedId)) setSelectedId(null);
  }, [normalized, selectedId]);

  return (
    <section className="artifact-map" style={{ height }} aria-label="Bản đồ hiện vật" aria-busy={loading}>
      <MapContainer center={MUSEUM_CENTER} zoom={MUSEUM_MIN_ZOOM}
        minZoom={MUSEUM_MIN_ZOOM} maxZoom={MUSEUM_MAX_ZOOM}
        zoomSnap={MUSEUM_ZOOM_STEP} zoomDelta={MUSEUM_ZOOM_STEP}
        maxBounds={MUSEUM_BOUNDS} maxBoundsViscosity={1} bounceAtZoomLimits={false} touchZoom="center"
        className="artifact-map-canvas"
        style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={TILE_MAX_ZOOM} maxZoom={Infinity} bounds={MUSEUM_BOUNDS} noWrap
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'} />
        <Polygon positions={OUTSIDE_MUSEUM} stroke={false} fillColor="#edf0eb" fillOpacity={1}
          fillRule="evenodd" interactive={false} />
        <FitArtifactBounds points={points} />
        <MuseumResetControl points={points} />
        <MuseumPopupBounds />
        {normalized.map(artifact => <ArtifactMarker key={artifact.id} artifact={artifact}
          coincidentArtifacts={groups.get(coordinateKey(artifact))}
          selectedId={selectedId} onSelect={setSelectedId} />)}
      </MapContainer>
      {loading && <div className="artifact-map-message" role="status">Đang tải hiện vật…</div>}
      {!loading && error && <div className="artifact-map-message is-error" role="alert">
        <span>Không tải được hiện vật. Vui lòng thử lại.</span>
        {typeof onRetry === 'function' && <button type="button" onClick={onRetry}>Thử lại</button>}
      </div>}
      {!loading && !error && normalized.length === 0 && <div className="artifact-map-message" role="status">
        Chưa có hiện vật có vị trí trong khu vực bảo tàng để hiển thị.
      </div>}
    </section>
  );
}
