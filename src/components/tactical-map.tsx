// ============================================================================
// Guardian — TacticalMap Component
// Renders the full-screen Leaflet map with 113 resource markers from GUARDIAN_DATA
// ============================================================================

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  GUARDIAN_DATA,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  DARK_TILE_URL,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  type GuardianResource,
} from '../constants';

// ── Category icon builder ──
const createCategoryIcon = (category: string) => L.divIcon({
  html: `<div style="
    font-size: 18px; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(5, 7, 10, 0.85);
    border: 2px solid rgba(255,255,255,0.15);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  ">${CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📍'}</div>`,
  className: 'guardian-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

interface TacticalMapProps {
  locations: typeof GUARDIAN_DATA;
  onLocationSelect: (resource: GuardianResource | null) => void;
}

export function TacticalMap({ locations, onLocationSelect }: TacticalMapProps) {
  // Flatten all resource arrays from GUARDIAN_DATA
  const allResources: GuardianResource[] = [
    ...locations.hospitals,
    ...locations.bakeries,
    ...locations.pharmacies,
    ...locations.ngos,
    ...locations.shelters,
    ...locations.waterPoints,
    ...locations.fuelStations,
  ];

  const dangerZones = locations.dangerZones;

  return (
    <MapContainer
      center={MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url={DARK_TILE_URL}
        maxZoom={19}
      />

      {/* 113 Resource Markers */}
      {allResources.filter((r) => r.isOperational).map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={createCategoryIcon(r.category)}
          eventHandlers={{ click: () => onLocationSelect(r) }}
        >
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', maxWidth: '220px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                {CATEGORY_ICONS[r.category as keyof typeof CATEGORY_ICONS]} {r.name}
              </div>
              <div style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '6px' }}>
                {CATEGORY_LABELS[r.category as keyof typeof CATEGORY_LABELS]?.en} · {r.operatingHours || 'Hours N/A'}
              </div>
              {r.phone && (
                <a href={`tel:${r.phone}`} style={{
                  display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: 600, background: '#2563EB', color: '#fff',
                  textDecoration: 'none', marginRight: '6px',
                }}>📞 Call</a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Danger Zone Circles */}
      {dangerZones.map((dz) => (
        <Circle
          key={dz.id}
          center={[dz.lat, dz.lng]}
          radius={dz.radiusKm * 1000}
          pathOptions={{
            color: SEVERITY_COLORS[dz.severity as keyof typeof SEVERITY_COLORS],
            fillColor: SEVERITY_COLORS[dz.severity as keyof typeof SEVERITY_COLORS],
            fillOpacity: 0.15,
            weight: 2,
            dashArray: dz.severity === 'critical' ? undefined : '8 4',
          }}
        >
          <Popup>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: SEVERITY_COLORS[dz.severity as keyof typeof SEVERITY_COLORS], marginBottom: '4px' }}>
                🚨 {dz.severity.toUpperCase()} ZONE
              </div>
              <div>{dz.description}</div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                Radius: {dz.radiusKm}km
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
