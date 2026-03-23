// ============================================================================
// Guardian — App.tsx
// Phase 16.2: Multi-User Verification & Dynamic Status
// Trust System (Confirm/Dispute) + Dynamic Shelter Capacity Rings
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
  getCapacityStatus,
  CAPACITY_RING_COLORS,
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
// LEAFLET CUSTOM ICONS — Emoji DivIcons per category
// ---------------------------------------------------------------------------
function createCategoryIcon(category: ResourceCategory, capacityStatus?: string): L.DivIcon {
  const emoji = CATEGORY_ICONS[category] || '📍';
  const ringColor = (category === 'shelter' || category === 'ngo') && capacityStatus
    ? CAPACITY_RING_COLORS[capacityStatus] || THEME.primary
    : THEME.primary;
  return L.divIcon({
    html: `<div style="
      font-size: 20px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.85);
      border: 2px solid ${ringColor};
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 6px ${ringColor}44;
    ">${emoji}</div>`,
    className: 'guardian-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

const userIcon = L.divIcon({
  html: `<div style="
    width: 16px;
    height: 16px;
    background: #3B82F6;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
  "></div>`,
  className: 'guardian-user-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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
// ALL 7 CATEGORIES
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

  // ── TRUST / VERIFICATION STATE (persisted in localStorage) ─────────
  const [verificationData, setVerificationData] = useState<Record<string, { confirms: number; disputes: number }>>(() => {
    try {
      const saved = localStorage.getItem('guardian_verification');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Persist verification to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('guardian_verification', JSON.stringify(verificationData)); } catch {}
  }, [verificationData]);

  const handleConfirm = useCallback((id: string) => {
    setVerificationData((prev) => {
      const entry = prev[id] || { confirms: 0, disputes: 0 };
      return { ...prev, [id]: { ...entry, confirms: entry.confirms + 1 } };
    });
  }, []);

  const handleDispute = useCallback((id: string) => {
    setVerificationData((prev) => {
      const entry = prev[id] || { confirms: 0, disputes: 0 };
      return { ...prev, [id]: { ...entry, disputes: entry.disputes + 1 } };
    });
  }, []);

  const getDisputeOpacity = useCallback((id: string): number => {
    const entry = verificationData[id];
    if (entry && entry.disputes > 5) return 0.4;
    return 1;
  }, [verificationData]);

  const getVerificationCount = useCallback((id: string): { confirms: number; disputes: number } => {
    return verificationData[id] || { confirms: 0, disputes: 0 };
  }, [verificationData]);

  // ── SAFETY DATA HOOK ───────────────────────────────────────────────
  const { alerts, safeCheckIns, addSafeCheckIn, districts } = useSafetyData();

  // ── REFS ────────────────────────────────────────────────────────────
  const gpsWatchId = useRef<number | null>(null);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── RESOURCE COUNTS per category ───────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of ALL_CATEGORIES) {
      counts[cat] = resources.filter((r) => r.category === cat && r.isOperational).length;
    }
    return counts;
  }, [resources]);

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
          enableHighAccuracy: false, timeout: 10_000, maximumAge: GPS_INTERVAL_LOW_POWER,
        });
      };
      poll();
      gpsIntervalRef.current = setInterval(poll, GPS_INTERVAL_LOW_POWER);
      return () => { if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current); };
    } else {
      gpsWatchId.current = navigator.geolocation.watchPosition(
        updatePosition, handleGeoError,
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: GPS_INTERVAL_NORMAL },
      );
      return () => { if (gpsWatchId.current !== null) navigator.geolocation.clearWatch(gpsWatchId.current); };
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
        { lat: userPosition.lat, lng: userPosition.lng }, destination, dangerZones,
      );
      setNavigation(result);
      if (result.error) console.error('[Guardian Nav]', result.error);
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
    const nearest = districts[0] || { id: 'beirut' };
    addSafeCheckIn(nearest.id);
    setSafeConfirm('✅ Check-in sent! Stay safe.');
    setTimeout(() => setSafeConfirm(null), 3000);
  }, [addSafeCheckIn, districts]);

  const handleSOS = useCallback(() => {
    window.open('tel:125', '_self');
  }, []);

  const toggleCategory = useCallback((cat: ResourceCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // ── Filtered resources for map ─────────────────────────────────────
  const filteredResources = useMemo(
    () => resources.filter((r) => r.isOperational && activeCategories.has(r.category)),
    [resources, activeCategories],
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: MAP VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderMap = () => {
    if (isUltraLowPower) {
      return (
        <LowPowerListView
          resources={resources} dangerZones={dangerZones}
          userLat={userPosition.lat} userLng={userPosition.lng}
          lang={language} onSelectResource={handleResourceSelect}
        />
      );
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* ── CATEGORY FILTER CHIPS ──────────────────────────────── */}
        <div className="category-chips">
          {ALL_CATEGORIES.map((cat) => {
            const active = activeCategories.has(cat);
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                id={`chip-${cat}`}
                onClick={() => toggleCategory(cat)}
                className={`chip ${active ? 'chip-active' : 'chip-inactive'}`}
              >
                <span className="chip-emoji">{CATEGORY_ICONS[cat]}</span>
                <span className="chip-label">{CATEGORY_LABELS[cat]?.en || cat}</span>
                <span className="chip-count">{count}</span>
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

          {/* User Position */}
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
            <Popup>
              <div style={{ fontFamily: SYSTEM_FONT_STACK, fontSize: '13px' }}>
                <strong>📍 Your Location</strong><br />
                Accuracy: {userPosition.accuracy.toFixed(0)}m
              </div>
            </Popup>
          </Marker>

          {/* Resource Markers — 7 layers from GUARDIAN_DATA */}
          {filteredResources.map((r) => {
            const capStatus = getCapacityStatus(r.capacity, r.occupancy);
            const opacity = getDisputeOpacity(r.id);
            const vCount = getVerificationCount(r.id);
            return (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={createCategoryIcon(r.category, capStatus)}
              opacity={opacity}
              eventHandlers={{ click: () => handleResourceSelect(r) }}
            >
              <Popup>
                <div style={{ fontFamily: SYSTEM_FONT_STACK, fontSize: '13px', maxWidth: '240px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                    {CATEGORY_ICONS[r.category]} {language === 'ar' && r.nameAr ? r.nameAr : language === 'fr' && r.nameFr ? r.nameFr : r.name}
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '6px' }}>
                    {CATEGORY_LABELS[r.category]?.en} · {r.operatingHours || 'Hours N/A'}
                  </div>

                  {/* Capacity badge for shelters/NGOs */}
                  {(r.category === 'shelter' || r.category === 'ngo') && r.capacity != null && (
                    <div style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '10px',
                      fontWeight: 700, marginBottom: '6px',
                      background: CAPACITY_RING_COLORS[capStatus] + '22',
                      color: CAPACITY_RING_COLORS[capStatus],
                      border: `1px solid ${CAPACITY_RING_COLORS[capStatus]}44`,
                    }}>
                      {capStatus === 'open' ? '🟢 Open' : capStatus === 'limited' ? '🟠 Limited' : capStatus === 'full' ? '🔴 Full' : '⚪ Unknown'}
                      {' · '}{r.occupancy}/{r.capacity}
                    </div>
                  )}

                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="popup-btn popup-btn-call">📞 Call</a>
                  )}
                  <button onClick={() => navigateTo({ lat: r.lat, lng: r.lng })} className="popup-btn popup-btn-nav">
                    🧭 Navigate
                  </button>

                  {/* Trust System: Confirm / Dispute */}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => handleConfirm(r.id)} className="popup-btn" style={{ background: '#22C55E', color: '#000' }}>✅ Confirm</button>
                    <button onClick={() => handleDispute(r.id)} className="popup-btn" style={{ background: '#EF4444', color: '#fff' }}>❌ Dispute</button>
                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>
                      {vCount.confirms}↑ {vCount.disputes}↓
                    </span>
                  </div>
                  {vCount.disputes > 5 && (
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#EF4444', fontWeight: 600 }}>
                      ⚠️ Disputed ({vCount.disputes} reports)
                    </div>
                  )}

                  {r.verifiedBy && (
                    <div style={{ marginTop: '6px', fontSize: '10px', color: THEME.success }}>
                      ✓ Verified by {r.verifiedBy}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
          })}

          {/* Danger Zone Circles */}
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
                  <div style={{ fontSize: '14px', fontWeight: 700, color: SEVERITY_COLORS[dz.severity], marginBottom: '4px' }}>
                    🚨 {dz.severity.toUpperCase()} ZONE
                  </div>
                  <div>{dz.description}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                    Radius: {dz.radiusKm}km · {new Date(dz.reportedAt).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* OSRM Safe Route Polylines */}
          {navigation && navigation.routes.map((route, i) => (
            <Polyline
              key={`route-${i}`}
              positions={route.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
              pathOptions={{
                color: route.color, weight: route.isSafest ? 5 : 3,
                opacity: route.isSafest ? 1 : 0.4,
                dashArray: route.isSafest ? undefined : '10 6',
              }}
            />
          ))}
        </MapContainer>

        {/* Navigation Panel Overlay */}
        {navigation && navigation.routes.length > 0 && (
          <div className="nav-panel">
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: ROUTE_COLORS.safest }}>🧭 Safest Route</div>
              <div style={{ fontSize: '12px', color: THEME.textMuted, marginTop: '2px' }}>
                {navigation.routes[0].distanceKm.toFixed(1)}km · {navigation.routes[0].durationMin} min
                {navigation.routes.length > 1 && ` · ${navigation.routes.length} alternatives`}
              </div>
            </div>
            <button onClick={cancelNavigation} className="nav-panel-cancel">✕ Cancel</button>
          </div>
        )}

        {/* Resource Count Badge */}
        <div className="resource-count-badge">
          {filteredResources.length} / {resources.filter((r) => r.isOperational).length} resources
        </div>
      </div>
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: ALERTS VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderAlerts = () => (
    <div className="alerts-container">
      <h2 className="section-title">⚠️ Live Alerts ({dangerZones.length + alerts.length})</h2>

      {dangerZones.map((dz) => (
        <div key={dz.id} className="alert-card" style={{ borderLeftColor: SEVERITY_COLORS[dz.severity] }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: SEVERITY_COLORS[dz.severity] }}>
            🚨 {dz.severity.toUpperCase()}
          </div>
          <div className="alert-text">{dz.description}</div>
          <div className="alert-meta">
            Radius: {dz.radiusKm}km · {new Date(dz.reportedAt).toLocaleString()}
          </div>
        </div>
      ))}

      {alerts.map((a) => (
        <div key={a.id} className="alert-card" style={{
          borderLeftColor: a.type === 'danger' ? '#FF3B30' : a.type === 'warning' ? '#FFCC00' : '#3B82F6',
        }}>
          <div className="alert-title">
            {a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : 'ℹ️'} {a.location}
          </div>
          <div className="alert-text">{a.message}</div>
          <div className="alert-meta">
            {a.timestamp} ago · {a.verified ? '✓ Verified' : 'Unverified'}
            {a.verificationCount ? ` (${a.verificationCount})` : ''}
          </div>
        </div>
      ))}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: SETTINGS VIEW (Battery Saver — DEEP MENU ONLY)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderSettings = () => (
    <div className="settings-container">
      <h2 className="section-title">⚙️ Settings</h2>

      <div className="setting-row">
        <div>
          <div className="setting-label">🔋 Battery Saver Mode</div>
          <div className="setting-desc">Disables map, GPS every 5 min, OLED list view</div>
        </div>
        <button onClick={toggleUltraLowPower} className={`setting-toggle ${isUltraLowPower ? 'toggle-on' : 'toggle-off'}`}>
          {isUltraLowPower ? '● ON' : '○ OFF'}
        </button>
      </div>

      <div className="setting-row">
        <div className="setting-label">🌐 Language</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['en', 'ar', 'fr'] as Language[]).map((lang) => (
            <button key={lang} onClick={() => setLanguage(lang)}
              className={`lang-btn ${language === lang ? 'lang-active' : ''}`}>
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-row">
        <div>
          <div className="setting-label">📡 GPS Tracking</div>
          <div className="setting-desc">{isUltraLowPower ? 'Polling every 5 min' : 'Continuous high-accuracy'}</div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: THEME.success }}>
          {isUltraLowPower ? '5m' : '15s'}
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-label">📍 Loaded Resources</div>
        <div className="setting-value">{resources.filter((r) => r.isOperational).length} operational</div>
      </div>

      <div className="setting-row">
        <div className="setting-label">⚠️ Active Danger Zones</div>
        <div className="setting-value" style={{ color: dangerZones.length > 0 ? SEVERITY_COLORS.critical : THEME.success }}>
          {dangerZones.length}
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-label">✅ Community Check-ins</div>
        <div className="setting-value">{safeCheckIns.length} recent</div>
      </div>

      {/* Per-category breakdown */}
      <h3 className="section-subtitle">📊 Resource Breakdown</h3>
      {ALL_CATEGORIES.map((cat) => (
        <div key={cat} className="setting-row">
          <div className="setting-label">{CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]?.en}</div>
          <div className="setting-value">{categoryCounts[cat]}</div>
        </div>
      ))}

      <div className="settings-footer">
        Guardian v{APP_VERSION} — Phase 16.1 Universal Resource Injection<br />
        Generated via Antigravity Editor
      </div>
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: CONTENT ROUTER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderContent = () => {
    switch (currentView) {
      case 'alerts': return renderAlerts();
      case 'settings': return renderSettings();
      case 'map':
      default: return renderMap();
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: APP SHELL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="guardian-app">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="guardian-header">
        <div className="header-logo">
          <span>🛡️</span>
          <span>GUARDIAN</span>
          {isUltraLowPower && <span className="header-badge">LOW POWER</span>}
        </div>
        <div className="header-version">v{APP_VERSION}</div>
      </header>

      {/* ── DANGER ZONE BANNER ──────────────────────────────────────── */}
      {currentDanger && (
        <div className="danger-banner" role="alert">
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
      {safeConfirm && <div className="safe-toast">{safeConfirm}</div>}

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main className="guardian-main">
        {renderContent()}
      </main>

      {/* ── SOS BUTTON — ANCHORED BOTTOM-RIGHT ──────────────────────── */}
      <button id="sos-button" onClick={handleSOS} aria-label="Emergency SOS - Call 125" className="sos-btn">
        SOS
      </button>

      {/* ── BOTTOM NAVIGATION BAR ───────────────────────────────────── */}
      <nav className="guardian-nav">
        <button id="nav-map" className={`nav-item ${currentView === 'map' ? 'nav-active' : ''}`}
          onClick={() => setCurrentView('map')}>
          <span className="nav-icon">🗺️</span><span>Map</span>
        </button>

        <button id="nav-alerts" className={`nav-item ${currentView === 'alerts' ? 'nav-active' : ''}`}
          onClick={() => setCurrentView('alerts')}>
          <span className="nav-icon">⚠️</span><span>Alerts</span>
          {(dangerZones.length + alerts.length) > 0 && <span className="nav-badge" />}
        </button>

        {/* I AM SAFE — CENTER */}
        <button id="nav-safe" className="nav-item nav-safe btn-safe-pulse" onClick={handleSafeCheckIn}>
          <span className="nav-icon" style={{ fontSize: '22px' }}>✅</span><span>SAFE</span>
        </button>

        <button id="nav-settings" className={`nav-item ${currentView === 'settings' ? 'nav-active' : ''}`}
          onClick={() => setCurrentView('settings')}>
          <span className="nav-icon">⚙️</span><span>Settings</span>
        </button>
      </nav>

      {/* ── GLOBAL STYLES — Mobile-First Responsive ────────────────── */}
      <style>{`
        /* ═══ RESET & BASE ═══ */
        .guardian-app {
          font-family: "Inter", ${SYSTEM_FONT_STACK};
          background: ${THEME.background};
          color: ${THEME.text};
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ═══ HEADER ═══ */
        .guardian-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid ${THEME.border};
          z-index: 1100;
          flex-shrink: 0;
        }
        .header-logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 18px; font-weight: 800; letter-spacing: -0.5px;
        }
        .header-badge {
          font-size: 9px; padding: 2px 6px; border-radius: 4px;
          background: ${OLED_COLORS.accent}33; color: ${OLED_COLORS.accent}; font-weight: 700;
        }
        .header-version { font-size: 11px; color: ${THEME.textMuted}; }

        /* ═══ MAIN ═══ */
        .guardian-main { flex: 1; position: relative; overflow: hidden; }

        /* ═══ CATEGORY CHIPS ═══ */
        .category-chips {
          position: absolute; top: 10px; left: 10px; right: 60px;
          z-index: 1000; display: flex; flex-wrap: wrap; gap: 5px;
        }
        .chip {
          display: flex; align-items: center; gap: 3px;
          padding: 4px 8px; border-radius: 20px; font-size: 11px;
          font-weight: 600; font-family: ${SYSTEM_FONT_STACK};
          cursor: pointer; border: 1px solid; backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }
        .chip-active {
          background: rgba(37, 99, 235, 0.85); border-color: ${THEME.primary}; color: #fff;
        }
        .chip-inactive {
          background: rgba(15, 23, 42, 0.8); border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.7);
        }
        .chip-emoji { font-size: 13px; }
        .chip-label { }
        .chip-count {
          font-size: 9px; background: rgba(255,255,255,0.15); padding: 1px 5px;
          border-radius: 8px; min-width: 16px; text-align: center;
        }

        /* ═══ RESOURCE COUNT BADGE ═══ */
        .resource-count-badge {
          position: absolute; bottom: 12px; left: 12px; z-index: 1000;
          padding: 4px 10px; border-radius: 8px;
          background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
          font-size: 11px; color: ${THEME.textMuted}; font-weight: 600;
          border: 1px solid ${THEME.border};
        }

        /* ═══ NAV PANEL ═══ */
        .nav-panel {
          position: absolute; top: 56px; left: 10px; right: 10px; z-index: 1000;
          background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(12px);
          border-radius: 12px; padding: 12px 16px;
          display: flex; align-items: center; justify-content: space-between;
          border: 1px solid ${THEME.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .nav-panel-cancel {
          padding: 6px 16px; border-radius: 8px; border: none;
          background: ${THEME.danger}; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
        }

        /* ═══ POPUP BUTTONS ═══ */
        .popup-btn {
          display: inline-block; padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; text-decoration: none;
          margin-right: 6px; border: none; cursor: pointer;
        }
        .popup-btn-call { background: ${THEME.primary}; color: #fff; }
        .popup-btn-nav { background: ${THEME.success}; color: #000; }

        /* ═══ DANGER BANNER ═══ */
        .danger-banner {
          display: flex; align-items: center; gap: 10px; padding: 10px 16px;
          background: #7F1D1D; border-bottom: 2px solid ${SEVERITY_COLORS.critical};
          font-size: 13px; font-weight: 600; color: #FF6666; flex-shrink: 0;
        }

        /* ═══ SAFE TOAST ═══ */
        .safe-toast {
          position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
          padding: 10px 24px; border-radius: 12px;
          background: rgba(34, 197, 94, 0.95); color: #000;
          font-size: 14px; font-weight: 700; z-index: 9999;
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
        }

        /* ═══ SOS BUTTON ═══ */
        .sos-btn {
          position: fixed; bottom: 76px; right: 16px;
          width: 54px; height: 54px; border-radius: 50%; border: none;
          background: #FF3B30; color: #fff; font-size: 15px; font-weight: 900;
          cursor: pointer; z-index: 2000; display: flex;
          align-items: center; justify-content: center; letter-spacing: 1px;
          animation: sos-pulse 2s ease-in-out infinite;
          box-shadow: 0 4px 20px rgba(255, 59, 48, 0.5), 0 0 0 4px rgba(255, 59, 48, 0.2);
        }
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(255,59,48,0.5), 0 0 0 4px rgba(255,59,48,0.2); transform: scale(1); }
          50% { box-shadow: 0 4px 30px rgba(255,59,48,0.8), 0 0 0 8px rgba(255,59,48,0.15); transform: scale(1.05); }
        }

        /* ═══ BOTTOM NAV ═══ */
        .guardian-nav {
          display: flex; align-items: stretch;
          border-top: 1px solid ${THEME.border};
          background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px);
          z-index: 1100; flex-shrink: 0;
        }
        .nav-item {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 8px 4px; font-size: 10px;
          font-weight: 500; color: ${THEME.textMuted}; cursor: pointer;
          border: none; background: none; position: relative; transition: color 0.15s ease;
        }
        .nav-active { color: ${THEME.primary}; font-weight: 700; }
        .nav-safe { flex: 1.4; color: #22C55E; font-weight: 800; letter-spacing: 0.5px; }
        .nav-icon { font-size: 20px; margin-bottom: 2px; }
        .nav-badge {
          position: absolute; top: 6px; right: calc(50% - 16px);
          width: 8px; height: 8px; border-radius: 50%; background: ${SEVERITY_COLORS.critical};
        }

        /* ═══ ALERTS ═══ */
        .alerts-container { padding: 16px; overflow-y: auto; height: 100%; }
        .section-title { font-size: 20px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.3px; }
        .section-subtitle { font-size: 14px; font-weight: 700; margin: 16px 0 8px; color: ${THEME.textMuted}; }
        .alert-card {
          padding: 14px; margin-bottom: 10px; border-radius: 10px;
          background: ${THEME.surface}; border-left: 4px solid;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .alert-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
        .alert-text { font-size: 12px; color: ${THEME.textMuted}; }
        .alert-meta { font-size: 10px; color: ${THEME.textMuted}; margin-top: 4px; }

        /* ═══ SETTINGS ═══ */
        .settings-container { padding: 24px 16px; overflow-y: auto; height: 100%; }
        .setting-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 0; border-bottom: 1px solid ${THEME.border};
        }
        .setting-label { font-size: 14px; font-weight: 600; }
        .setting-desc { font-size: 12px; color: ${THEME.textMuted}; margin-top: 2px; }
        .setting-value { font-size: 13px; color: ${THEME.textMuted}; }
        .setting-toggle {
          padding: 8px 20px; border-radius: 20px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;
        }
        .toggle-on { background: ${THEME.success}; color: #000; }
        .toggle-off { background: ${THEME.surface}; color: ${THEME.textMuted}; }
        .lang-btn {
          padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid ${THEME.border};
          background: transparent; color: ${THEME.textMuted}; transition: all 0.15s ease;
        }
        .lang-active { border-color: ${THEME.primary}; background: ${THEME.primary}33; color: ${THEME.primary}; }
        .settings-footer {
          text-align: center; padding: 24px; font-size: 11px; color: ${THEME.textMuted};
        }

        /* ═══ LEAFLET OVERRIDES ═══ */
        .guardian-marker, .guardian-user-marker { background: none !important; border: none !important; }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important; color: #F1F5F9 !important;
          border-radius: 12px !important; border: 1px solid #334155 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip { background: rgba(15, 23, 42, 0.95) !important; }

        /* ═══════════════════════════════════════════════════════════════ */
        /* MOBILE-FIRST RESPONSIVE — 390px / 430px / Tablet              */
        /* ═══════════════════════════════════════════════════════════════ */

        /* Small phones (390px and below) */
        @media (max-width: 390px) {
          .header-logo { font-size: 15px; gap: 6px; }
          .header-version { font-size: 9px; }
          .category-chips { gap: 3px; right: 48px; }
          .chip { padding: 3px 6px; font-size: 10px; }
          .chip-emoji { font-size: 11px; }
          .chip-count { font-size: 8px; padding: 1px 4px; }
          .chip-label { display: none; }
          .nav-icon { font-size: 18px; }
          .nav-item { font-size: 9px; padding: 6px 2px; }
          .sos-btn { width: 48px; height: 48px; font-size: 13px; bottom: 70px; right: 10px; }
          .resource-count-badge { font-size: 9px; padding: 3px 8px; }
          .section-title { font-size: 17px; }
          .alert-card { padding: 10px; }
          .alert-title { font-size: 12px; }
          .alert-text { font-size: 11px; }
          .setting-label { font-size: 13px; }
          .setting-toggle { padding: 6px 14px; font-size: 12px; }
          .settings-container { padding: 16px 12px; }
          .safe-toast { font-size: 12px; padding: 8px 16px; }
        }

        /* Standard phones (391px – 430px) */
        @media (min-width: 391px) and (max-width: 430px) {
          .header-logo { font-size: 16px; }
          .chip { padding: 4px 7px; font-size: 10px; }
          .chip-label { max-width: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .sos-btn { width: 50px; height: 50px; font-size: 14px; bottom: 72px; }
          .nav-item { font-size: 9px; }
          .nav-icon { font-size: 19px; }
        }

        /* Large phones / phablets (431px – 767px) */
        @media (min-width: 431px) and (max-width: 767px) {
          .header-logo { font-size: 17px; }
          .chip { padding: 4px 8px; font-size: 11px; }
        }

        /* Tablets (768px+) */
        @media (min-width: 768px) {
          .guardian-header { padding: 12px 24px; }
          .header-logo { font-size: 20px; }
          .category-chips { gap: 8px; }
          .chip { padding: 6px 12px; font-size: 12px; }
          .sos-btn { width: 60px; height: 60px; font-size: 17px; bottom: 84px; right: 20px; }
          .nav-item { font-size: 11px; padding: 10px 6px; }
          .nav-icon { font-size: 22px; }
          .alerts-container { padding: 24px; }
          .alert-card { padding: 18px; }
          .settings-container { padding: 32px 24px; }
        }
      `}</style>
    </div>
  );
}
