// ============================================================================
// Guardian — App.tsx
// Phase 16.1: Map-Centric Visual Recovery (Phase 14 Architecture Restored)
// Generated via Antigravity Editor
// ============================================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  GUARDIAN_DATA,
  THEME,
  OLED_COLORS,
  SYSTEM_FONT_STACK,
  GPS_INTERVAL_NORMAL,
  GPS_INTERVAL_LOW_POWER,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  ROUTE_COLORS,
  APP_VERSION,
  DARK_TILE_URL,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  type GuardianResource,
  type DangerZone,
  type ResourceCategory,
} from './constants';
import { useSafetyData } from './data/safetyData';
import LowPowerListView from './components/LowPowerListView';
import {
  calculateSafestRoute,
  isInsideDangerZone,
  nearbyDangerZones,
  type RouteCoordinate,
  type NavigationResult,
} from './services/NavigationService';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type Language = 'en' | 'ar' | 'fr';
type AppView = 'map' | 'alerts' | 'settings';

interface UserPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// LEAFLET CUSTOM ICONS — Emoji-based DivIcons per category
// ---------------------------------------------------------------------------
function createCategoryIcon(category: ResourceCategory): L.DivIcon {
  const emoji = CATEGORY_ICONS[category] || '📍';
  return L.divIcon({
    html: `<div style="
      font-size: 24px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.85);
      border: 2px solid ${THEME.primary};
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    ">${emoji}</div>`,
    className: 'guardian-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

const userIcon = L.divIcon({
  html: `<div style="
    width: 18px;
    height: 18px;
    background: #3B82F6;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
  "></div>`,
  className: 'guardian-user-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// ---------------------------------------------------------------------------
// MAP RECENTER COMPONENT
// ---------------------------------------------------------------------------
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasCentered = useRef(false);
  useEffect(() => {
    if (!hasCentered.current && lat !== MAP_DEFAULT_CENTER[0]) {
      map.setView([lat, lng], map.getZoom());
      hasCentered.current = true;
    }
  }, [lat, lng, map]);
  return null;
}

// ---------------------------------------------------------------------------
// CATEGORY FILTER CHIPS — toggle which marker layers are visible
// ---------------------------------------------------------------------------
const ALL_CATEGORIES: ResourceCategory[] = [
  'hospital', 'bakery', 'pharmacy', 'ngo', 'shelter', 'water', 'fuel',
];

// ---------------------------------------------------------------------------
// APP COMPONENT
// ---------------------------------------------------------------------------
export default function App() {
  // ── CORE STATE ──────────────────────────────────────────────────────
  const [isUltraLowPower, setIsUltraLowPower] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('en');
  const [currentView, setCurrentView] = useState<AppView>('map');
  const [activeCategories, setActiveCategories] = useState<Set<ResourceCategory>>(
    new Set(ALL_CATEGORIES),
  );

  // ── LOCATION STATE ──────────────────────────────────────────────────
  const [userPosition, setUserPosition] = useState<UserPosition>({
    lat: MAP_DEFAULT_CENTER[0],
    lng: MAP_DEFAULT_CENTER[1],
    accuracy: 0,
    timestamp: Date.now(),
  });

  // ── DATA STATE ──────────────────────────────────────────────────────
  const [resources] = useState<GuardianResource[]>(GUARDIAN_DATA.resources);
  const [dangerZones] = useState<DangerZone[]>(GUARDIAN_DATA.dangerZones);
  const [selectedResource, setSelectedResource] = useState<GuardianResource | null>(null);
  const [navigation, setNavigation] = useState<NavigationResult | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [safeConfirm, setSafeConfirm] = useState<string | null>(null);

  // ── SAFETY DATA HOOK (alerts, check-ins, services) ─────────────────
  const { alerts, safeCheckIns, addSafeCheckIn, districts } = useSafetyData();

  // ── REFS ────────────────────────────────────────────────────────────
  const gpsWatchId = useRef<number | null>(null);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── DERIVED STATE ───────────────────────────────────────────────────
  const palette = isUltraLowPower ? OLED_COLORS : THEME;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POWER STATE TOGGLE (deep settings only)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const toggleUltraLowPower = useCallback(() => {
    setIsUltraLowPower((prev) => {
      const next = !prev;
      if (next) {
        setNavigation(null);
        setIsNavigating(false);
        if (gpsWatchId.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchId.current);
          gpsWatchId.current = null;
        }
      }
      return next;
    });
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GPS TRACKING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const updatePosition = useCallback((position: GeolocationPosition) => {
    setUserPosition({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
  }, []);

  const handleGeoError = useCallback((error: GeolocationPositionError) => {
    console.warn('[Guardian GPS] Error:', error.message);
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    if (isUltraLowPower) {
      const poll = () => {
        navigator.geolocation.getCurrentPosition(updatePosition, handleGeoError, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: GPS_INTERVAL_LOW_POWER,
        });
      };
      poll();
      gpsIntervalRef.current = setInterval(poll, GPS_INTERVAL_LOW_POWER);
      return () => {
        if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
      };
    } else {
      gpsWatchId.current = navigator.geolocation.watchPosition(
        updatePosition,
        handleGeoError,
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: GPS_INTERVAL_NORMAL },
      );
      return () => {
        if (gpsWatchId.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchId.current);
        }
      };
    }
  }, [isUltraLowPower, updatePosition, handleGeoError]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NAVIGATION (OSRM Safe Routing)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const navigateTo = useCallback(
    async (destination: RouteCoordinate) => {
      if (isUltraLowPower) return;
      setIsNavigating(true);
      const result = await calculateSafestRoute(
        { lat: userPosition.lat, lng: userPosition.lng },
        destination,
        dangerZones,
      );
      setNavigation(result);
      if (result.error) {
        console.error('[Guardian Nav]', result.error);
      }
    },
    [userPosition, dangerZones, isUltraLowPower],
  );

  const cancelNavigation = useCallback(() => {
    setNavigation(null);
    setIsNavigating(false);
    setSelectedResource(null);
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DANGER PROXIMITY CHECK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const currentDanger = useMemo(
    () => isInsideDangerZone(userPosition.lat, userPosition.lng, dangerZones),
    [userPosition, dangerZones],
  );

  const nearbyDangers = useMemo(
    () => nearbyDangerZones(userPosition.lat, userPosition.lng, dangerZones, 5),
    [userPosition, dangerZones],
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleResourceSelect = useCallback(
    (resource: GuardianResource) => {
      setSelectedResource(resource);
      if (!isUltraLowPower) {
        navigateTo({ lat: resource.lat, lng: resource.lng });
      }
    },
    [isUltraLowPower, navigateTo],
  );

  const handleSafeCheckIn = useCallback(() => {
    // Find nearest district
    const nearest = districts[0] || { id: 'beirut' };
    addSafeCheckIn(nearest.id);
    setSafeConfirm('✅ Check-in sent! Stay safe.');
    setTimeout(() => setSafeConfirm(null), 3000);
  }, [addSafeCheckIn, districts]);

  const handleSOS = useCallback(() => {
    // Open dialer to Lebanese Civil Defense
    window.open('tel:125', '_self');
  }, []);

  const toggleCategory = useCallback((cat: ResourceCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  // ── Filtered resources for map ─────────────────────────────────────
  const filteredResources = useMemo(
    () => resources.filter((r) => r.isOperational && activeCategories.has(r.category)),
    [resources, activeCategories],
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: MAP VIEW (Phase 14 Full-Screen Leaflet)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderMap = () => {
    if (isUltraLowPower) {
      return (
        <LowPowerListView
          resources={resources}
          dangerZones={dangerZones}
          userLat={userPosition.lat}
          userLng={userPosition.lng}
          lang={language}
          onSelectResource={handleResourceSelect}
        />
      );
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* ── LAYER FILTER CHIPS ──────────────────────────────────── */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '60px',
          zIndex: 1000,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: `1px solid ${active ? THEME.primary : 'rgba(255,255,255,0.2)'}`,
                  backgroundColor: active ? 'rgba(37, 99, 235, 0.85)' : 'rgba(15, 23, 42, 0.8)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: SYSTEM_FONT_STACK,
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{CATEGORY_LABELS[cat]?.en || cat}</span>
              </button>
            );
          })}
        </div>

        {/* ── LEAFLET MAP ─────────────────────────────────────────── */}
        <MapContainer
          center={MAP_DEFAULT_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url={DARK_TILE_URL}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={19}
          />

          <MapRecenter lat={userPosition.lat} lng={userPosition.lng} />

          {/* ── USER POSITION MARKER ──────────────────────────── */}
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
          >
            <Popup>
              <div style={{ fontFamily: SYSTEM_FONT_STACK, fontSize: '13px' }}>
                <strong>📍 Your Location</strong><br />
                Accuracy: {userPosition.accuracy.toFixed(0)}m
              </div>
            </Popup>
          </Marker>

          {/* ── RESOURCE MARKERS (7 layers) ────────────────────── */}
          {filteredResources.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={createCategoryIcon(r.category)}
              eventHandlers={{
                click: () => handleResourceSelect(r),
              }}
            >
              <Popup>
                <div style={{
                  fontFamily: SYSTEM_FONT_STACK,
                  fontSize: '13px',
                  maxWidth: '220px',
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                    {CATEGORY_ICONS[r.category]} {language === 'ar' && r.nameAr ? r.nameAr : language === 'fr' && r.nameFr ? r.nameFr : r.name}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '6px' }}>
                    {CATEGORY_LABELS[r.category]?.en} · {r.operatingHours || 'Hours N/A'}
                  </div>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: THEME.primary,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      marginRight: '6px',
                    }}>
                      📞 Call
                    </a>
                  )}
                  <button
                    onClick={() => navigateTo({ lat: r.lat, lng: r.lng })}
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: THEME.success,
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    🧭 Navigate
                  </button>
                  {r.verifiedBy && (
                    <div style={{ marginTop: '6px', fontSize: '10px', color: THEME.success }}>
                      ✓ Verified by {r.verifiedBy}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── DANGER ZONE CIRCLES ──────────────────────────────── */}
          {dangerZones.map((dz) => (
            <Circle
              key={dz.id}
              center={[dz.lat, dz.lng]}
              radius={dz.radiusKm * 1000}
              pathOptions={{
                color: SEVERITY_COLORS[dz.severity],
                fillColor: SEVERITY_COLORS[dz.severity],
                fillOpacity: 0.15,
                weight: 2,
                dashArray: dz.severity === 'critical' ? undefined : '8 4',
              }}
            >
              <Popup>
                <div style={{ fontFamily: SYSTEM_FONT_STACK, fontSize: '13px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: SEVERITY_COLORS[dz.severity],
                    marginBottom: '4px',
                  }}>
                    🚨 {dz.severity.toUpperCase()} ZONE
                  </div>
                  <div>{dz.description}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                    Radius: {dz.radiusKm}km · Reported: {new Date(dz.reportedAt).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* ── OSRM SAFE ROUTING POLYLINES ──────────────────────── */}
          {navigation && navigation.routes.map((route, i) => (
            <Polyline
              key={`route-${i}`}
              positions={route.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
              pathOptions={{
                color: route.color,
                weight: route.isSafest ? 5 : 3,
                opacity: route.isSafest ? 1 : 0.4,
                dashArray: route.isSafest ? undefined : '10 6',
              }}
            />
          ))}
        </MapContainer>

        {/* ── NAVIGATION PANEL (overlay) ──────────────────────────── */}
        {navigation && navigation.routes.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '56px',
            left: '10px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: `1px solid ${THEME.border}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontFamily: SYSTEM_FONT_STACK }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: ROUTE_COLORS.safest }}>
                🧭 Safest Route
              </div>
              <div style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '2px' }}>
                {navigation.routes[0].distanceKm.toFixed(1)}km · {navigation.routes[0].durationMin} min
                {navigation.routes.length > 1 && ` · ${navigation.routes.length} alternatives`}
              </div>
            </div>
            <button
              onClick={cancelNavigation}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: THEME.danger,
                color: '#fff',
                fontFamily: SYSTEM_FONT_STACK,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✕ Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: ALERTS VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderAlerts = () => (
    <div style={{
      padding: '16px',
      fontFamily: SYSTEM_FONT_STACK,
      overflowY: 'auto',
      height: '100%',
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 800,
        marginBottom: '16px',
        color: THEME.text,
        letterSpacing: '-0.3px',
      }}>
        ⚠️ Live Alerts ({alerts.length})
      </h2>

      {/* Danger Zones */}
      {dangerZones.map((dz) => (
        <div
          key={dz.id}
          style={{
            padding: '14px',
            marginBottom: '10px',
            borderRadius: '10px',
            backgroundColor: THEME.surface,
            borderLeft: `4px solid ${SEVERITY_COLORS[dz.severity]}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: SEVERITY_COLORS[dz.severity],
            marginBottom: '4px',
          }}>
            🚨 {dz.severity.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: THEME.text }}>{dz.description}</div>
          <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '4px' }}>
            Radius: {dz.radiusKm}km · {new Date(dz.reportedAt).toLocaleString()}
          </div>
        </div>
      ))}

      {/* Feed Alerts from safetyData */}
      {alerts.map((a) => (
        <div
          key={a.id}
          style={{
            padding: '14px',
            marginBottom: '10px',
            borderRadius: '10px',
            backgroundColor: THEME.surface,
            borderLeft: `4px solid ${a.type === 'danger' ? '#FF3B30' : a.type === 'warning' ? '#FFCC00' : '#3B82F6'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: THEME.text,
            marginBottom: '2px',
          }}>
            {a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : 'ℹ️'} {a.location}
          </div>
          <div style={{ fontSize: '12px', color: THEME.textMuted }}>{a.message}</div>
          <div style={{ fontSize: '10px', color: THEME.textMuted, marginTop: '4px' }}>
            {a.timestamp} ago · {a.verified ? '✓ Verified' : 'Unverified'}
            {a.verificationCount ? ` (${a.verificationCount})` : ''}
          </div>
        </div>
      ))}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: SETTINGS VIEW (Battery Saver lives HERE only)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderSettings = () => (
    <div style={{
      padding: '24px 16px',
      fontFamily: SYSTEM_FONT_STACK,
      color: THEME.text,
      overflowY: 'auto',
      height: '100%',
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>
        ⚙️ Settings
      </h2>

      {/* Battery Saver — DEEP SETTINGS ONLY */}
      <div style={settingRowStyle}>
        <div>
          <div style={settingLabelStyle}>🔋 Battery Saver Mode</div>
          <div style={settingDescStyle}>
            Disables map rendering, GPS every 5 min, OLED-optimized list view
          </div>
        </div>
        <button
          onClick={toggleUltraLowPower}
          style={{
            padding: '8px 20px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: isUltraLowPower ? THEME.success : THEME.surface,
            color: isUltraLowPower ? '#000' : THEME.textMuted,
            fontFamily: SYSTEM_FONT_STACK,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isUltraLowPower ? '● ON' : '○ OFF'}
        </button>
      </div>

      {/* Language */}
      <div style={settingRowStyle}>
        <div style={settingLabelStyle}>🌐 Language</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['en', 'ar', 'fr'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: `1px solid ${language === lang ? THEME.primary : THEME.border}`,
                backgroundColor: language === lang ? THEME.primary + '33' : 'transparent',
                color: language === lang ? THEME.primary : THEME.textMuted,
                fontFamily: SYSTEM_FONT_STACK,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* GPS Status */}
      <div style={settingRowStyle}>
        <div>
          <div style={settingLabelStyle}>📡 GPS Tracking</div>
          <div style={settingDescStyle}>
            {isUltraLowPower ? 'Polling every 5 minutes (power saving)' : 'Continuous high-accuracy tracking'}
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: THEME.success }}>
          {isUltraLowPower ? '5m' : '15s'}
        </div>
      </div>

      {/* Stats */}
      <div style={settingRowStyle}>
        <div style={settingLabelStyle}>📍 Loaded Resources</div>
        <div style={{ fontSize: '13px', color: THEME.textMuted }}>
          {resources.filter((r) => r.isOperational).length} operational
        </div>
      </div>

      <div style={settingRowStyle}>
        <div style={settingLabelStyle}>⚠️ Active Danger Zones</div>
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: dangerZones.length > 0 ? SEVERITY_COLORS.critical : THEME.success,
        }}>
          {dangerZones.length}
        </div>
      </div>

      <div style={settingRowStyle}>
        <div style={settingLabelStyle}>✅ Community Check-ins</div>
        <div style={{ fontSize: '13px', color: THEME.textMuted }}>
          {safeCheckIns.length} recent
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '24px',
        fontSize: '11px',
        color: THEME.textMuted,
        fontFamily: SYSTEM_FONT_STACK,
      }}>
        Guardian v{APP_VERSION} — Phase 16.1 Map Recovery<br />
        Generated via Antigravity Editor
      </div>
    </div>
  );

  // ── Settings helpers ────────────────────────────────────────────────
  const settingRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: `1px solid ${THEME.border}`,
  };
  const settingLabelStyle: React.CSSProperties = {
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '14px',
    fontWeight: 600,
  };
  const settingDescStyle: React.CSSProperties = {
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '12px',
    color: THEME.textMuted,
    marginTop: '2px',
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: MAIN CONTENT ROUTER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderContent = () => {
    switch (currentView) {
      case 'alerts': return renderAlerts();
      case 'settings': return renderSettings();
      case 'map':
      default:
        return renderMap();
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: APP SHELL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div style={{
      fontFamily: '"Inter", ' + SYSTEM_FONT_STACK,
      backgroundColor: THEME.background,
      color: THEME.text,
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${THEME.border}`,
        zIndex: 1100,
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: SYSTEM_FONT_STACK,
          fontSize: '18px',
          fontWeight: 800,
          color: THEME.text,
          letterSpacing: '-0.5px',
        }}>
          <span>🛡️</span>
          <span>GUARDIAN</span>
          {isUltraLowPower && (
            <span style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: OLED_COLORS.accent + '33',
              color: OLED_COLORS.accent,
              fontWeight: 700,
            }}>
              LOW POWER
            </span>
          )}
        </div>
        <div style={{
          fontSize: '11px',
          color: THEME.textMuted,
          fontFamily: SYSTEM_FONT_STACK,
        }}>
          v{APP_VERSION}
        </div>
      </header>

      {/* ── DANGER ZONE BANNER ──────────────────────────────────────── */}
      {currentDanger && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          backgroundColor: '#7F1D1D',
          borderBottom: `2px solid ${SEVERITY_COLORS.critical}`,
          fontFamily: SYSTEM_FONT_STACK,
          fontSize: '13px',
          fontWeight: 600,
          color: '#FF6666',
          flexShrink: 0,
          animation: 'pulse 2s infinite',
        }} role="alert">
          <span style={{ fontSize: '20px' }}>🚨</span>
          <div>
            <strong>DANGER — You are inside an active zone!</strong>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              {currentDanger.description}
            </div>
          </div>
        </div>
      )}

      {/* ── SAFE CONFIRM TOAST ──────────────────────────────────────── */}
      {safeConfirm && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 24px',
          borderRadius: '12px',
          backgroundColor: 'rgba(34, 197, 94, 0.95)',
          color: '#000',
          fontFamily: SYSTEM_FONT_STACK,
          fontSize: '14px',
          fontWeight: 700,
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
        }}>
          {safeConfirm}
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {renderContent()}
      </main>

      {/* ── SOS BUTTON — ANCHORED BOTTOM-RIGHT ──────────────────────── */}
      <button
        id="sos-button"
        onClick={handleSOS}
        aria-label="Emergency SOS - Call 125"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#FF3B30',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 900,
          fontFamily: SYSTEM_FONT_STACK,
          cursor: 'pointer',
          zIndex: 2000,
          boxShadow: '0 4px 20px rgba(255, 59, 48, 0.5), 0 0 0 4px rgba(255, 59, 48, 0.2)',
          animation: 'sos-pulse 2s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: '1px',
        }}
      >
        SOS
      </button>

      {/* ── BOTTOM NAVIGATION BAR ───────────────────────────────────── */}
      <nav style={{
        display: 'flex',
        alignItems: 'stretch',
        borderTop: `1px solid ${THEME.border}`,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 1100,
        flexShrink: 0,
      }}>
        {/* MAP TAB */}
        <button
          id="nav-map"
          style={navItemStyle(currentView === 'map')}
          onClick={() => setCurrentView('map')}
        >
          <span style={NAV_ICON_STYLE}>🗺️</span>
          <span>Map</span>
        </button>

        {/* ALERTS TAB */}
        <button
          id="nav-alerts"
          style={navItemStyle(currentView === 'alerts')}
          onClick={() => setCurrentView('alerts')}
        >
          <span style={NAV_ICON_STYLE}>⚠️</span>
          <span>Alerts</span>
          {(dangerZones.length + alerts.length) > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: 'calc(50% - 16px)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: SEVERITY_COLORS.critical,
            }} />
          )}
        </button>

        {/* I AM SAFE — CENTER */}
        <button
          id="nav-safe"
          className="btn-safe-pulse"
          onClick={handleSafeCheckIn}
          style={{
            flex: 1.4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 4px',
            fontFamily: SYSTEM_FONT_STACK,
            fontSize: '10px',
            fontWeight: 800,
            color: '#22C55E',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            position: 'relative',
            letterSpacing: '0.5px',
          }}
        >
          <span style={{ fontSize: '22px', marginBottom: '2px' }}>✅</span>
          <span>SAFE</span>
        </button>

        {/* SETTINGS TAB */}
        <button
          id="nav-settings"
          style={navItemStyle(currentView === 'settings')}
          onClick={() => setCurrentView('settings')}
        >
          <span style={NAV_ICON_STYLE}>⚙️</span>
          <span>Settings</span>
        </button>
      </nav>

      {/* ── GLOBAL ANIMATION KEYFRAMES ─────────────────────────────── */}
      <style>{`
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,59,48,0.5), 0 0 0 4px rgba(255,59,48,0.2); transform: scale(1); }
          50% { box-shadow: 0 4px 30px rgba(255,59,48,0.8), 0 0 0 8px rgba(255,59,48,0.15); transform: scale(1.05); }
        }
        .guardian-marker { background: none !important; border: none !important; }
        .guardian-user-marker { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          color: #F1F5F9 !important;
          border-radius: 12px !important;
          border: 1px solid #334155 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip { background: rgba(15, 23, 42, 0.95) !important; }
      `}</style>
    </div>
  );
}

// ── Nav bar item style helper ──────────────────────────────────────────
function navItemStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 4px',
    fontFamily: SYSTEM_FONT_STACK,
    fontSize: '10px',
    fontWeight: active ? 700 : 500,
    color: active ? THEME.primary : THEME.textMuted,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    position: 'relative',
    transition: 'color 0.15s ease',
  };
}

const NAV_ICON_STYLE: React.CSSProperties = {
  fontSize: '20px',
  marginBottom: '2px',
};
