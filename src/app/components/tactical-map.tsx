import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { GUARDIAN_DATA, CATEGORY_ICONS, CATEGORY_LABELS, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, SEVERITY_COLORS } from '../../constants';

// ── Leaflet CSS is loaded via index.html or styles ──

// ── Category → Marker Color ──────────────────────────────────
const MARKER_COLORS: Record<string, string> = {
  hospital: '#00FF95',
  bakery: '#00FF95',
  pharmacy: '#00D1FF',
  ngo: '#00D1FF',
  shelter: '#00D1FF',
  water_point: '#00D1FF',
  fuel_station: '#00FF95',
};

// ── Build a glowing DivIcon for each category ─────────────────
function createMarkerIcon(category: string, emoji: string) {
  const color = MARKER_COLORS[category] || '#00D1FF';
  return L.divIcon({
    html: `<div style="
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: ${color}20;
      border: 2px solid ${color};
      box-shadow: 0 0 16px ${color}60, 0 0 4px ${color}40;
      font-size: 16px;
      transition: transform 0.2s;
    ">${emoji}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ── Danger zone icon ──────────────────────────────────────────
const DANGER_ICON = L.divIcon({
  html: `<div style="
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    border-radius: 50%;
    background: #FF3B3B20;
    border: 2px solid #FF3B3B;
    box-shadow: 0 0 16px #FF3B3B60;
    font-size: 16px;
  ">🚨</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// ── User location icon ────────────────────────────────────────
const USER_ICON = L.divIcon({
  html: `<div style="
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #00D1FF;
    border: 3px solid #fff;
    box-shadow: 0 0 20px #00D1FF80, 0 0 40px #00D1FF40;
  "></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── Dark map tile ─────────────────────────────────────────────
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// ── Types ─────────────────────────────────────────────────────
interface TacticalMapProps {
  locations: any[];
  userLocation: { lat: number; lng: number };
  onLocationSelect: (location: any) => void;
}

export function TacticalMap({ locations, userLocation, onLocationSelect }: TacticalMapProps) {
  // ── Flatten GUARDIAN_DATA into renderable arrays ──
  const resources = useMemo(() => {
    const all = [
      ...(GUARDIAN_DATA.hospitals || []),
      ...(GUARDIAN_DATA.bakeries || []),
      ...(GUARDIAN_DATA.pharmacies || []),
      ...(GUARDIAN_DATA.ngos || []),
      ...(GUARDIAN_DATA.shelters || []),
      ...(GUARDIAN_DATA.waterPoints || []),
      ...(GUARDIAN_DATA.fuelStations || []),
    ];
    return all.filter((r: any) => r.isOperational);
  }, []);

  const dangerZones = useMemo(() => GUARDIAN_DATA.dangerZones || [], []);

  // ── Counts for status bar ──
  const resourceCount = resources.length;
  const dangerCount = dangerZones.length;

  // ── CATEGORY_ICONS lookup with fallback ──
  const getEmoji = (category: string) =>
    (CATEGORY_ICONS as any)?.[category] || '📍';

  // ── Map center ──
  const center: [number, number] = Array.isArray(MAP_DEFAULT_CENTER)
    ? [MAP_DEFAULT_CENTER[0], MAP_DEFAULT_CENTER[1]]
    : [33.8938, 35.5018];

  const zoom = typeof MAP_DEFAULT_ZOOM === 'number' ? MAP_DEFAULT_ZOOM : 9;

  return (
    <div className="relative w-full h-full">
      {/* ── LEAFLET MAP CONTAINER ───────────────────────────── */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url={DARK_TILE}
          maxZoom={19}
        />

        {/* ── USER LOCATION ──────────────────────────────────── */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={USER_ICON}>
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#F1F5F9' }}>
              <strong>📍 Your Location</strong>
            </div>
          </Popup>
        </Marker>

        {/* ── 113 RESOURCE MARKERS ───────────────────────────── */}
        {resources.map((r: any) => {
          const emoji = getEmoji(r.category);
          const icon = createMarkerIcon(r.category, emoji);
          const catLabel = (CATEGORY_LABELS as any)?.[r.category]?.en || r.category;

          return (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  // Pass adapted location to parent → opens HospitalSheet
                  onLocationSelect({
                    id: r.id,
                    name: r.name,
                    type: r.category === 'hospital' ? 'hospital' : r.category === 'shelter' || r.category === 'ngo' ? 'shelter' : 'safe-zone',
                    category: r.category,
                    lat: r.lat,
                    lng: r.lng,
                    safetyScore: r.verificationCount ? Math.min(99, 60 + r.verificationCount * 3) : 80,
                    verifiedBy: r.verificationCount || 0,
                    status: r.isOperational ? 'open' : 'closed',
                    distance: '',
                    eta: '',
                    address: r.address || '',
                    phone: r.phone,
                    services: [catLabel, r.operatingHours || ''].filter(Boolean),
                  });
                },
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', maxWidth: '220px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: '#F1F5F9' }}>
                    {emoji} {r.name}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '6px' }}>
                    {catLabel} · {r.operatingHours || 'Hours N/A'}
                  </div>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: '8px',
                      fontSize: '11px', fontWeight: 600, background: '#00D1FF', color: '#05070A',
                      textDecoration: 'none', marginRight: '6px',
                    }}>📞 Call</a>
                  )}
                  {r.address && (
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '6px' }}>
                      {r.address}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── DANGER ZONE CIRCLES + MARKERS ──────────────────── */}
        {dangerZones.map((dz: any) => {
          const sevColor = (SEVERITY_COLORS as any)?.[dz.severity] || '#FF3B3B';
          return (
            <React.Fragment key={dz.id}>
              <Circle
                center={[dz.lat, dz.lng]}
                radius={dz.radiusKm * 1000}
                pathOptions={{
                  color: sevColor,
                  fillColor: sevColor,
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: dz.severity === 'critical' ? undefined : '8 4',
                }}
              />
              <Marker
                position={[dz.lat, dz.lng]}
                icon={DANGER_ICON}
                eventHandlers={{
                  click: () => {
                    onLocationSelect({
                      id: dz.id,
                      name: dz.description,
                      type: 'danger',
                      lat: dz.lat,
                      lng: dz.lng,
                      safetyScore: dz.severity === 'critical' ? 10 : dz.severity === 'high' ? 25 : 40,
                      verifiedBy: 0,
                      status: 'closed',
                      distance: `${dz.radiusKm} km radius`,
                      address: `${dz.severity.toUpperCase()} DANGER ZONE`,
                    });
                  },
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: sevColor, marginBottom: '4px' }}>
                      🚨 {dz.severity.toUpperCase()} ZONE
                    </div>
                    <div style={{ color: '#F1F5F9' }}>{dz.description}</div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                      Radius: {dz.radiusKm} km
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* ── STATUS COUNTER (bottom-left) ─────────────────────── */}
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

      {/* ── DISTANCE SCALE (bottom-right) ────────────────────── */}
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
