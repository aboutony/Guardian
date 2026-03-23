import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { GUARDIAN_DATA, CATEGORY_ICONS, CATEGORY_LABELS, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, SEVERITY_COLORS } from '../../constants';

// ═══════════════════════════════════════════════════════════════
// MARKER ICON FACTORY
// ═══════════════════════════════════════════════════════════════

const CATEGORY_EMOJI: Record<string, string> = {
  hospital: '🏥',
  bakery: '🍞',
  pharmacy: '💊',
  ngo: '🤝',
  shelter: '🏠',
  water_point: '💧',
  fuel_station: '⛽',
};

const CATEGORY_COLOR: Record<string, string> = {
  hospital: '#00FF95',
  bakery: '#00FF95',
  pharmacy: '#00D1FF',
  ngo: '#00D1FF',
  shelter: '#00D1FF',
  water_point: '#00D1FF',
  fuel_station: '#00FF95',
};

function makeIcon(category: string): L.DivIcon {
  const emoji = CATEGORY_EMOJI[category] || (CATEGORY_ICONS as any)?.[category] || '📍';
  const color = CATEGORY_COLOR[category] || '#00D1FF';
  return L.divIcon({
    html: `<div style="
      width:36px;height:36px;display:flex;align-items:center;justify-content:center;
      border-radius:50%;
      background:${color}20;
      border:2px solid ${color};
      box-shadow:0 0 14px ${color}60,0 0 4px ${color}40;
      font-size:16px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

const DANGER_ICON = L.divIcon({
  html: `<div style="
    width:36px;height:36px;display:flex;align-items:center;justify-content:center;
    border-radius:50%;
    background:#FF3B3B20;
    border:2px solid #FF3B3B;
    box-shadow:0 0 14px #FF3B3B60;
    font-size:16px;
  ">🚨</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const USER_ICON = L.divIcon({
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:#00D1FF;border:3px solid #fff;
    box-shadow:0 0 20px #00D1FF80,0 0 40px #00D1FF40;
  "></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

interface TacticalMapProps {
  locations: any[];
  userLocation: { lat: number; lng: number };
  onLocationSelect: (location: any) => void;
}

export function TacticalMap({ locations, userLocation, onLocationSelect }: TacticalMapProps) {
  // ── Split locations prop into resources vs dangers ──
  const resourceMarkers = useMemo(
    () => locations.filter((l) => l.type !== 'danger'),
    [locations],
  );
  const dangerMarkers = useMemo(
    () => locations.filter((l) => l.type === 'danger'),
    [locations],
  );

  // ── Also pull raw danger zones from GUARDIAN_DATA for Circle overlays ──
  const rawDangerZones = useMemo(() => {
    try {
      return (GUARDIAN_DATA as any).dangerZones || (GUARDIAN_DATA as any).alerts || [];
    } catch { return []; }
  }, []);

  const resourceCount = resourceMarkers.length;
  const dangerCount = dangerMarkers.length;

  // ── Map center ──
  const center: [number, number] = (() => {
    try {
      if (Array.isArray(MAP_DEFAULT_CENTER)) return [MAP_DEFAULT_CENTER[0], MAP_DEFAULT_CENTER[1]];
    } catch {}
    return [33.8938, 35.5018]; // Beirut fallback
  })();

  const zoom = (() => {
    try { return typeof MAP_DEFAULT_ZOOM === 'number' ? MAP_DEFAULT_ZOOM : 9; }
    catch { return 9; }
  })();

  return (
    <div className="relative w-full h-full">
      {/* ═══ LEAFLET MAP ═══ */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* CartoDB Dark — shows roads and city names */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* ── USER LOCATION ── */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#F1F5F9' }}>
              <strong>📍 Your Location</strong>
            </div>
          </Popup>
        </Marker>

        {/* ═══ RESOURCE MARKERS (from locations prop — 113 entries) ═══ */}
        {resourceMarkers.map((loc) => {
          const cat = loc.category || loc.type || 'hospital';
          const emoji = CATEGORY_EMOJI[cat] || (CATEGORY_ICONS as any)?.[cat] || '📍';
          const catLabel = (CATEGORY_LABELS as any)?.[cat]?.en || cat;
          const icon = makeIcon(cat);

          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onLocationSelect(loc),
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', maxWidth: '220px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: '#F1F5F9' }}>
                    {emoji} {loc.name}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '6px' }}>
                    {catLabel}
                    {loc.services && loc.services.length > 1 ? ` · ${loc.services[1]}` : ''}
                  </div>
                  {loc.safetyScore != null && (
                    <div style={{ fontSize: '11px', color: '#00FF95', marginBottom: '4px' }}>
                      ✅ Safety: {loc.safetyScore}% · Verified by {loc.verifiedBy || 0}
                    </div>
                  )}
                  {loc.phone && (
                    <a href={`tel:${loc.phone}`} style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: '8px',
                      fontSize: '11px', fontWeight: 600, background: '#00D1FF', color: '#05070A',
                      textDecoration: 'none', marginRight: '6px',
                    }}>📞 Call</a>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onLocationSelect(loc); }}
                    style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: '8px',
                      fontSize: '11px', fontWeight: 600, background: '#00FF95', color: '#05070A',
                      border: 'none', cursor: 'pointer',
                    }}
                  >🧭 Details</button>
                  {loc.address && (
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '6px' }}>{loc.address}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ═══ DANGER MARKERS + CIRCLES ═══ */}
        {dangerMarkers.map((dz) => (
          <React.Fragment key={dz.id}>
            <Marker
              position={[dz.lat, dz.lng]}
              icon={DANGER_ICON}
              eventHandlers={{
                click: () => onLocationSelect(dz),
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF3B3B', marginBottom: '4px' }}>
                    🚨 DANGER ZONE
                  </div>
                  <div style={{ color: '#F1F5F9' }}>{dz.name}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                    {dz.distance || 'Active zone'}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* ── Raw danger zone circles from GUARDIAN_DATA ── */}
        {rawDangerZones.map((dz: any) => {
          const sevColor = (SEVERITY_COLORS as any)?.[dz.severity] || '#FF3B3B';
          return (
            <Circle
              key={`circle-${dz.id}`}
              center={[dz.lat, dz.lng]}
              radius={(dz.radiusKm || 2) * 1000}
              pathOptions={{
                color: sevColor,
                fillColor: sevColor,
                fillOpacity: 0.12,
                weight: 2,
                dashArray: dz.severity === 'critical' ? undefined : '8 4',
              }}
            />
          );
        })}
      </MapContainer>

      {/* ═══ STATUS COUNTER (bottom-left) ═══ */}
      <div className="absolute bottom-24 left-4 z-10">
        <div className="backdrop-blur-xl bg-[#05070A]/80 border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00FF95] animate-pulse" />
              <span className="text-xs text-white/90 font-semibold">{resourceCount} Resources</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF3B3B]" />
              <span className="text-xs text-[#FF3B3B]/90 font-semibold">{dangerCount} Danger Zones</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DISTANCE SCALE (bottom-right) ═══ */}
      <div className="absolute bottom-24 right-4 z-10">
        <div className="backdrop-blur-xl bg-[#05070A]/80 border border-white/10 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-16 h-0.5 bg-[#00D1FF]" />
            <span className="text-xs text-white/60">1 km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
