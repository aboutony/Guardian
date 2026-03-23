import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { GUARDIAN_DATA, SEVERITY_COLORS } from '../../constants';

// ═══════════════════════════════════════════════════════════════
// ICON FACTORY — Hard-wired emoji + color per category
// ═══════════════════════════════════════════════════════════════

const EMOJI: Record<string, string> = {
  hospital: '🏥', bakery: '🍞', pharmacy: '💊',
  ngo: '🤝', shelter: '🏠', water_point: '💧',
  fuel_station: '⛽', danger: '🚨', airstrike: '🚨',
  roadblock: '🚧',
};

const COLOR: Record<string, string> = {
  hospital: '#00FF95', bakery: '#00D1FF', pharmacy: '#00D1FF',
  ngo: '#00D1FF', shelter: '#00D1FF', water_point: '#00D1FF',
  fuel_station: '#00FF95', danger: '#FF3B3B', airstrike: '#FF3B3B',
  roadblock: '#FF8C00',
};

function makeIcon(category: string): L.DivIcon {
  const emoji = EMOJI[category] || '📍';
  const color = COLOR[category] || '#00D1FF';
  return L.divIcon({
    html: `<div style="
      width:36px;height:36px;display:flex;align-items:center;justify-content:center;
      border-radius:50%;background:${color}20;border:2px solid ${color};
      box-shadow:0 0 14px ${color}60,0 0 4px ${color}40;font-size:16px;
    ">${emoji}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

const USER_ICON = L.divIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#00D1FF;border:3px solid #fff;box-shadow:0 0 20px #00D1FF80,0 0 40px #00D1FF40;"></div>`,
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
  // ── Split into resources vs danger ──
  const resources = useMemo(() => locations.filter((l) => l.type !== 'danger'), [locations]);
  const dangers = useMemo(() => locations.filter((l) => l.type === 'danger'), [locations]);

  // ── Also try to extract raw danger zones for Circle overlays ──
  const rawCircles = useMemo(() => {
    try {
      const gd = GUARDIAN_DATA as any;
      if (!gd) return [];
      // Try every possible key that might hold danger data
      for (const key of Object.keys(gd)) {
        if (key.toLowerCase().includes('danger') || key.toLowerCase().includes('zone')) {
          const arr = gd[key];
          if (Array.isArray(arr) && arr.length > 0 && arr[0].radiusKm) return arr;
        }
      }
    } catch {}
    return [];
  }, []);

  // ── Counts for status badge ──
  const resourceCount = resources.length;
  const dangerCount = dangers.length;
  const totalCount = locations.length;

  // ── Map center from prop ──
  const center: [number, number] = [userLocation.lat, userLocation.lng];

  return (
    <div className="relative w-full h-full">
      {/* ═══ LEAFLET MAP ═══ */}
      <MapContainer
        center={center}
        zoom={9}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* USER */}
        <Marker position={center} icon={USER_ICON}>
          <Popup>
            <div style={{ fontFamily: 'Inter,sans-serif', color: '#F1F5F9' }}>
              <strong>📍 Your Location</strong>
            </div>
          </Popup>
        </Marker>

        {/* ═══ RESOURCE MARKERS ═══ */}
        {resources.map((loc) => {
          const cat = loc.category || 'hospital';
          const emoji = EMOJI[cat] || '📍';
          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={makeIcon(cat)}
              eventHandlers={{ click: () => onLocationSelect(loc) }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '13px', maxWidth: '220px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px' }}>
                    {emoji} {loc.name}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '4px' }}>
                    {cat} {loc.services?.[1] ? `· ${loc.services[1]}` : ''}
                  </div>
                  {loc.safetyScore != null && (
                    <div style={{ fontSize: '11px', color: '#00FF95', marginBottom: '4px' }}>
                      Safety: {loc.safetyScore}% · Verified: {loc.verifiedBy || 0}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {loc.phone && (
                      <a href={`tel:${loc.phone}`} style={{
                        padding: '4px 12px', borderRadius: '8px', fontSize: '11px',
                        fontWeight: 600, background: '#00D1FF', color: '#05070A',
                        textDecoration: 'none',
                      }}>📞 Call</a>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onLocationSelect(loc); }} style={{
                      padding: '4px 12px', borderRadius: '8px', fontSize: '11px',
                      fontWeight: 600, background: '#00FF95', color: '#05070A',
                      border: 'none', cursor: 'pointer',
                    }}>🧭 Details</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ═══ DANGER MARKERS ═══ */}
        {dangers.map((dz) => (
          <Marker
            key={dz.id}
            position={[dz.lat, dz.lng]}
            icon={makeIcon('danger')}
            eventHandlers={{ click: () => onLocationSelect(dz) }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '13px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF3B3B', marginBottom: '4px' }}>
                  🚨 DANGER ZONE
                </div>
                <div style={{ color: '#F1F5F9' }}>{dz.name}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{dz.distance || ''}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ── Danger zone circle overlays ── */}
        {rawCircles.map((dz: any) => {
          const c = (SEVERITY_COLORS as any)?.[dz.severity] || '#FF3B3B';
          return (
            <Circle
              key={`c-${dz.id}`}
              center={[dz.lat, dz.lng]}
              radius={(dz.radiusKm || 2) * 1000}
              pathOptions={{ color: c, fillColor: c, fillOpacity: 0.12, weight: 2 }}
            />
          );
        })}
      </MapContainer>

      {/* ═══ STATUS COUNTER — HARD-WIRED ═══ */}
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
    </div>
  );
}
