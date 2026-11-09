import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ArtifactMap.css';
import {
  coordinateSignature,
  normalizePois,
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
import {
  DEFAULT_ICON,
  OUTSIDE_MUSEUM,
  SELECTED_ICON,
  TILE_ATTRIBUTION,
  TILE_URL,
  updateMuseumLimits,
} from './museumMapLeaflet.js';

const EMPTY_POIS = [];

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
      button.title = 'Trở về khu vực điểm tham quan trong bảo tàng';
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

/** Popup của một POI: tên điểm, phòng, mã QR; chọn được từng hiện vật nếu POI có nhiều hiện vật. */
function PoiPopup({ poi }) {
  const [artifactId, setArtifactId] = useState(poi.artifacts[0]?.id ?? null);
  const artifact = poi.artifacts.find(item => item.id === artifactId) ?? poi.artifacts[0] ?? null;
  const description = shortDescription(artifact ? artifact.description : poi.description);
  return (
    <article className="artifact-map-popup" data-poi-id={poi.id}>
      <h3>{poi.title}</h3>
      {poi.artifacts.length > 1 && <label className="artifact-map-artifact-label">
        Hiện vật tại điểm này ({poi.artifacts.length})
        <select className="artifact-map-artifact-select" value={artifact.id}
          onChange={event => setArtifactId(event.target.value)}>
          {poi.artifacts.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>}
      {artifact && <ArtifactImage key={artifact.id + ':' + artifact.image_url} artifact={artifact} />}
      <dl className="artifact-map-facts">
        <div><dt>Mã điểm (QR)</dt><dd>{poi.code || 'Chưa có mã'}</dd></div>
        <div><dt>Phòng</dt><dd>{poi.room?.name_vi || 'Chưa có thông tin phòng'}</dd></div>
      </dl>
      <p className="artifact-map-description">{description || 'Chưa có mô tả.'}</p>
      {artifact
        ? <Link className="artifact-map-details-link" to={'/hien-vat/' + encodeURIComponent(artifact.id)}>Xem chi tiết</Link>
        : <Link className="artifact-map-details-link" to={'/diem/' + encodeURIComponent(poi.code)}>Xem điểm tham quan</Link>}
    </article>
  );
}

function PoiMarker({ poi, selectedId, onSelect }) {
  const markerRef = useRef(null);
  const selected = selectedId === poi.id;
  useEffect(() => {
    const element = markerRef.current?.getElement();
    if (!element) return;
    // DOM attributes preserve arbitrary database IDs without interpolating HTML.
    element.setAttribute('data-poi-id', poi.id);
    element.setAttribute('data-poi-lat', String(poi.lat));
    element.setAttribute('data-poi-lng', String(poi.lng));
  }, [poi.id, poi.lat, poi.lng, selected]);
  return (
    <Marker ref={markerRef} position={[poi.lat, poi.lng]} title={poi.title}
      alt={poi.title} icon={selected ? SELECTED_ICON : DEFAULT_ICON}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(poi.id) }}>
      <Tooltip className="artifact-map-tooltip" direction="auto">{poi.title}</Tooltip>
      <Popup minWidth={230} maxWidth={320} maxHeight={390} autoPan={false}>
        <PoiPopup poi={poi} />
      </Popup>
    </Marker>
  );
}

/**
 * Display-only map: mỗi điểm tham quan (POI) có GPS là một ghim.
 * Its parent owns API requests; detail links use the app router.
 */
export default function ArtifactMap({ pois = EMPTY_POIS, loading = false, error = null, onRetry, height = '100%' }) {
  const normalized = useMemo(() => normalizePois(pois).filter(isInMuseum), [pois]);
  const signature = coordinateSignature(normalized);
  // The signature consists only of unique coordinate values. Selecting a marker
  // or receiving a reordered response never refits.
  const points = useMemo(() => signature ? signature.split('|').map(pair => pair.split(',').map(Number)) : [], [signature]);
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (selectedId !== null && !normalized.some(item => item.id === selectedId)) setSelectedId(null);
  }, [normalized, selectedId]);

  return (
    <section className="artifact-map" style={{ height }} aria-label="Bản đồ điểm tham quan" aria-busy={loading}>
      <MapContainer center={MUSEUM_CENTER} zoom={MUSEUM_MIN_ZOOM}
        minZoom={MUSEUM_MIN_ZOOM} maxZoom={MUSEUM_MAX_ZOOM}
        zoomSnap={MUSEUM_ZOOM_STEP} zoomDelta={MUSEUM_ZOOM_STEP}
        maxBounds={MUSEUM_BOUNDS} maxBoundsViscosity={1} bounceAtZoomLimits={false} touchZoom="center"
        className="artifact-map-canvas"
        style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer url={TILE_URL}
          maxNativeZoom={TILE_MAX_ZOOM} maxZoom={Infinity} bounds={MUSEUM_BOUNDS} noWrap
          attribution={TILE_ATTRIBUTION} />
        <Polygon positions={OUTSIDE_MUSEUM} stroke={false} fillColor="#edf0eb" fillOpacity={1}
          fillRule="evenodd" interactive={false} />
        <FitArtifactBounds points={points} />
        <MuseumResetControl points={points} />
        <MuseumPopupBounds />
        {normalized.map(poi => <PoiMarker key={poi.id} poi={poi}
          selectedId={selectedId} onSelect={setSelectedId} />)}
      </MapContainer>
      {loading && <div className="artifact-map-message" role="status">Đang tải điểm tham quan…</div>}
      {!loading && error && <div className="artifact-map-message is-error" role="alert">
        <span>Không tải được bản đồ. Vui lòng thử lại.</span>
        {typeof onRetry === 'function' && <button type="button" onClick={onRetry}>Thử lại</button>}
      </div>}
      {!loading && !error && normalized.length === 0 && <div className="artifact-map-message" role="status">
        Chưa có điểm tham quan có vị trí trong khu vực bảo tàng để hiển thị.
      </div>}
    </section>
  );
}
