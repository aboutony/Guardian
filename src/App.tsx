// ============================================================================
// Guardian — App.tsx
// Phase 16: Ultra-Low Power Mode (Zero-Fail Injection)
// Generated via Antigravity Editor
// ============================================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  GUARDIAN_DATA,
  THEME,
  OLED_COLORS,
  SYSTEM_FONT_STACK,
  GPS_INTERVAL_NORMAL,
  GPS_INTERVAL_LOW_POWER,
  ALERT_POLL_INTERVAL,
  ALERT_POLL_LOW_POWER,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  APP_VERSION,
  type GuardianResource,
  type DangerZone,
} from './constants';
import LowPowerListView from './components/LowPowerListView';
import {
  calculateSafestRoute,
  isInsideDangerZone,
  nearbyDangerZones,
  type RouteCoordinate,
  type NavigationResult,
} from './services/NavigationService';

// ---------------------------------------------------------------------------
// LAZY IMPORTS — Map components are NOT loaded in low-power mode
// ---------------------------------------------------------------------------
// These would be your existing Leaflet/React-Leaflet imports:
// import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
// They are conditionally rendered below so the bundle tree-shakes them
// when `isUltraLowPower` is true.

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type Language = 'en' | 'ar' | 'fr';
type AppView = 'map' | 'list' | 'alerts' | 'settings';

interface UserPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// APP COMPONENT
// ---------------------------------------------------------------------------
export default function App() {
  // ── CORE STATE ──────────────────────────────────────────────────────
  const [isUltraLowPower, setIsUltraLowPower] = useState<boolean>(false);
  const [displayMap, setDisplayMap] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('en');
  const [currentView, setCurrentView] = useState<AppView>('map');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // ── LOCATION STATE ──────────────────────────────────────────────────
  const [userPosition, setUserPosition] = useState<UserPosition>({
    lat: 33.8938,   // Default: Beirut
    lng: 35.5018,
    accuracy: 0,
    timestamp: Date.now(),
  });

  // ── DATA STATE ──────────────────────────────────────────────────────
  const [resources] = useState<GuardianResource[]>(GUARDIAN_DATA.resources);
  const [dangerZones] = useState<DangerZone[]>(GUARDIAN_DATA.dangerZones);
  const [selectedResource, setSelectedResource] = useState<GuardianResource | null>(null);
  const [navigation, setNavigation] = useState<NavigationResult | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // ── REFS ────────────────────────────────────────────────────────────
  const gpsWatchId = useRef<number | null>(null);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── DERIVED STATE ───────────────────────────────────────────────────
  const gpsInterval = isUltraLowPower ? GPS_INTERVAL_LOW_POWER : GPS_INTERVAL_NORMAL;
  const alertInterval = isUltraLowPower ? ALERT_POLL_LOW_POWER : ALERT_POLL_INTERVAL;
  const palette = isUltraLowPower ? OLED_COLORS : THEME;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POWER STATE TOGGLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const toggleUltraLowPower = useCallback(() => {
    setIsUltraLowPower((prev) => {
      const next = !prev;
      if (next) {
        // ENTERING low-power mode
        setDisplayMap(false);
        setCurrentView('list');
        setNavigation(null);
        setIsNavigating(false);
        // Kill continuous GPS watcher
        if (gpsWatchId.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchId.current);
          gpsWatchId.current = null;
        }
      } else {
        // EXITING low-power mode
        setDisplayMap(true);
        setCurrentView('map');
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
      // LOW-POWER: interval-based polling (every 5 min)
      const poll = () => {
        navigator.geolocation.getCurrentPosition(updatePosition, handleGeoError, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: GPS_INTERVAL_LOW_POWER,
        });
      };
      poll(); // immediate first fix
      gpsIntervalRef.current = setInterval(poll, GPS_INTERVAL_LOW_POWER);

      return () => {
        if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
      };
    } else {
      // NORMAL: continuous high-accuracy watcher
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
  // NAVIGATION (delegates to NavigationService.ts)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const navigateTo = useCallback(
    async (destination: RouteCoordinate) => {
      if (isUltraLowPower) return; // No routing in low-power
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
  // INLINE STYLES (no external CSS loads in low-power)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const styles = {
    app: {
      fontFamily: isUltraLowPower ? SYSTEM_FONT_STACK : '"Inter", ' + SYSTEM_FONT_STACK,
      backgroundColor: isUltraLowPower ? OLED_COLORS.bg : THEME.background,
      color: isUltraLowPower ? OLED_COLORS.text : THEME.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      // Asset stripping: disable all visual effects in low-power
      ...(isUltraLowPower && {
        filter: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        textShadow: 'none',
        boxShadow: 'none',
      }),
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      backgroundColor: isUltraLowPower ? OLED_COLORS.headerBg : THEME.surface,
      borderBottom: `1px solid ${isUltraLowPower ? OLED_COLORS.border : THEME.border}`,
      position: 'sticky' as const,
      top: 0,
      zIndex: 1000,
      // No blur/shadow in low-power
      ...(isUltraLowPower
        ? {}
        : {
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
          }),
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '18px',
      fontWeight: 700 as const,
      color: isUltraLowPower ? OLED_COLORS.text : THEME.text,
      letterSpacing: '-0.3px',
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    powerToggle: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      border: `1px solid ${isUltraLowPower ? OLED_COLORS.accent : THEME.border}`,
      backgroundColor: isUltraLowPower ? OLED_COLORS.accent + '22' : 'transparent',
      color: isUltraLowPower ? OLED_COLORS.accent : THEME.textMuted,
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '12px',
      fontWeight: 600 as const,
      cursor: 'pointer',
      transition: isUltraLowPower ? 'none' : 'all 0.2s ease',
      outline: 'none',
    },
    navBar: {
      display: 'flex',
      borderTop: `1px solid ${isUltraLowPower ? OLED_COLORS.border : THEME.border}`,
      backgroundColor: isUltraLowPower ? OLED_COLORS.headerBg : THEME.surface,
      position: 'sticky' as const,
      bottom: 0,
      zIndex: 1000,
      ...(isUltraLowPower
        ? {}
        : { boxShadow: '0 -2px 16px rgba(0,0,0,0.3)' }),
    },
    navItem: (active: boolean) => ({
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 4px',
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '10px',
      fontWeight: active ? (700 as const) : (500 as const),
      color: active
        ? isUltraLowPower ? OLED_COLORS.accent : THEME.primary
        : isUltraLowPower ? OLED_COLORS.textDim : THEME.textMuted,
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      transition: isUltraLowPower ? 'none' : 'color 0.15s ease',
    }),
    navIcon: {
      fontSize: '20px',
      marginBottom: '2px',
    },
    mainContent: {
      flex: 1,
      position: 'relative' as const,
      overflow: 'hidden',
    },
    dangerBanner: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 16px',
      backgroundColor: isUltraLowPower ? '#1A0000' : '#7F1D1D',
      borderBottom: `2px solid ${SEVERITY_COLORS.critical}`,
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '13px',
      fontWeight: 600 as const,
      color: '#FF6666',
    },
    routePanel: {
      padding: '12px 16px',
      backgroundColor: isUltraLowPower ? OLED_COLORS.cardBg : THEME.surfaceAlt,
      borderBottom: `1px solid ${isUltraLowPower ? OLED_COLORS.border : THEME.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    routeInfo: {
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '13px',
      color: isUltraLowPower ? OLED_COLORS.text : THEME.text,
    },
    cancelBtn: {
      padding: '6px 14px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: isUltraLowPower ? OLED_COLORS.border : THEME.danger,
      color: isUltraLowPower ? OLED_COLORS.text : '#FFF',
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '12px',
      fontWeight: 600 as const,
      cursor: 'pointer',
    },
    langBtn: (active: boolean) => ({
      padding: '4px 10px',
      borderRadius: '4px',
      border: `1px solid ${active
        ? isUltraLowPower ? OLED_COLORS.accent : THEME.primary
        : isUltraLowPower ? OLED_COLORS.border : THEME.border}`,
      backgroundColor: active
        ? (isUltraLowPower ? OLED_COLORS.accent + '33' : THEME.primary + '33')
        : 'transparent',
      color: active
        ? (isUltraLowPower ? OLED_COLORS.accent : THEME.primary)
        : (isUltraLowPower ? OLED_COLORS.textDim : THEME.textMuted),
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '11px',
      fontWeight: 600 as const,
      cursor: 'pointer',
    }),
    settingsContainer: {
      padding: '24px 16px',
      fontFamily: SYSTEM_FONT_STACK,
      color: isUltraLowPower ? OLED_COLORS.text : THEME.text,
    },
    settingRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: `1px solid ${isUltraLowPower ? OLED_COLORS.border : THEME.border}`,
    },
    settingLabel: {
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '14px',
      fontWeight: 500 as const,
    },
    settingValue: {
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '12px',
      color: isUltraLowPower ? OLED_COLORS.textDim : THEME.textMuted,
    },
    mapPlaceholder: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '14px',
      color: isUltraLowPower ? OLED_COLORS.textDim : THEME.textMuted,
      backgroundColor: isUltraLowPower ? OLED_COLORS.bg : THEME.surfaceAlt,
    },
    versionTag: {
      fontFamily: SYSTEM_FONT_STACK,
      fontSize: '10px',
      color: isUltraLowPower ? OLED_COLORS.textDim : THEME.textMuted,
      textAlign: 'center' as const,
      padding: '8px',
    },
  };

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

  const handleViewChange = useCallback(
    (view: AppView) => {
      // In low-power mode, 'map' is disabled — redirect to 'list'
      if (isUltraLowPower && view === 'map') {
        setCurrentView('list');
        return;
      }
      setCurrentView(view);
      setMenuOpen(false);
    },
    [isUltraLowPower],
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: SETTINGS PAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderSettings = () => (
    <div style={styles.settingsContainer}>
      <h2 style={{ fontFamily: SYSTEM_FONT_STACK, fontSize: '20px', marginBottom: '20px' }}>
        ⚙️ Settings
      </h2>

      {/* Power Mode */}
      <div style={styles.settingRow}>
        <div>
          <div style={styles.settingLabel}>🔋 Ultra-Low Power Mode</div>
          <div style={styles.settingValue}>
            GPS every 5 min · No map · OLED optimized
          </div>
        </div>
        <button
          style={{
            ...styles.powerToggle,
            backgroundColor: isUltraLowPower ? OLED_COLORS.accent : 'transparent',
            color: isUltraLowPower ? '#000' : THEME.textMuted,
          }}
          onClick={toggleUltraLowPower}
        >
          {isUltraLowPower ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Language */}
      <div style={styles.settingRow}>
        <div style={styles.settingLabel}>🌐 Language</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['en', 'ar', 'fr'] as Language[]).map((lang) => (
            <button
              key={lang}
              style={styles.langBtn(language === lang)}
              onClick={() => setLanguage(lang)}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* GPS Status */}
      <div style={styles.settingRow}>
        <div>
          <div style={styles.settingLabel}>📡 GPS Interval</div>
          <div style={styles.settingValue}>
            {isUltraLowPower ? '5 minutes (power saving)' : '15 seconds (real-time)'}
          </div>
        </div>
        <div style={{ ...styles.settingValue, fontWeight: 700 }}>
          {gpsInterval / 1000}s
        </div>
      </div>

      {/* Data Version */}
      <div style={styles.settingRow}>
        <div style={styles.settingLabel}>📦 Data Version</div>
        <div style={styles.settingValue}>v{APP_VERSION}</div>
      </div>

      {/* Resources Count */}
      <div style={styles.settingRow}>
        <div style={styles.settingLabel}>📍 Loaded Resources</div>
        <div style={styles.settingValue}>
          {resources.filter((r) => r.isOperational).length} operational
        </div>
      </div>

      {/* Active Alerts */}
      <div style={styles.settingRow}>
        <div style={styles.settingLabel}>⚠️ Active Danger Zones</div>
        <div style={{ ...styles.settingValue, color: dangerZones.length > 0 ? SEVERITY_COLORS.critical : undefined }}>
          {dangerZones.length}
        </div>
      </div>

      <div style={styles.versionTag}>
        Guardian v{APP_VERSION} — Phase 16 Ultra-Low Power
      </div>
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: ALERTS PAGE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderAlerts = () => (
    <div style={{ padding: '16px', fontFamily: SYSTEM_FONT_STACK }}>
      <h2 style={{
        fontSize: '20px',
        marginBottom: '16px',
        color: isUltraLowPower ? OLED_COLORS.text : THEME.text,
      }}>
        ⚠️ Danger Alerts ({dangerZones.length})
      </h2>
      {dangerZones.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: isUltraLowPower ? OLED_COLORS.textDim : THEME.textMuted,
          fontSize: '14px',
        }}>
          No active danger zones. Stay safe.
        </div>
      ) : (
        dangerZones.map((dz) => (
          <div
            key={dz.id}
            style={{
              padding: '14px',
              marginBottom: '10px',
              borderRadius: isUltraLowPower ? '0' : '8px',
              backgroundColor: isUltraLowPower ? OLED_COLORS.cardBg : THEME.surface,
              borderLeft: `4px solid ${SEVERITY_COLORS[dz.severity]}`,
            }}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: isUltraLowPower ? OLED_COLORS.text : THEME.text,
              marginBottom: '4px',
            }}>
              🔴 {dz.description}
            </div>
            <div style={{
              fontSize: '11px',
              color: isUltraLowPower ? OLED_COLORS.textDim : THEME.textMuted,
            }}>
              Severity: <span style={{ color: SEVERITY_COLORS[dz.severity], fontWeight: 700 }}>
                {dz.severity.toUpperCase()}
              </span>
              {' · '}Radius: {dz.radiusKm}km{' · '}
              Reported: {new Date(dz.reportedAt).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: MAIN CONTENT AREA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderContent = () => {
    switch (currentView) {
      case 'settings':
        return renderSettings();

      case 'alerts':
        return renderAlerts();

      case 'list':
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

      case 'map':
      default:
        if (!displayMap || isUltraLowPower) {
          // Fallback to list view if map is disabled
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
        // ── MAP VIEW ─────────────────────────────────────────────
        // In production this renders <MapContainer> with Leaflet.
        // Placeholder for zero-fail injection (no Leaflet dependency).
        return (
          <div style={styles.mapPlaceholder}>
            {/* 
              PRODUCTION: Replace this with your existing MapContainer:
              
              <MapContainer center={[userPosition.lat, userPosition.lng]} zoom={14}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {resources.filter(r => r.isOperational).map(r => (
                  <Marker key={r.id} position={[r.lat, r.lng]}>
                    <Popup>{r.name}</Popup>
                  </Marker>
                ))}
                {navigation?.routes.map((route, i) => (
                  <Polyline
                    key={i}
                    positions={route.coordinates.map(c => [c.lat, c.lng])}
                    color={route.color}
                    weight={route.isSafest ? 5 : 3}
                    opacity={route.isSafest ? 1 : 0.5}
                  />
                ))}
              </MapContainer>
            */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>Interactive Map</div>
              <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>
                {resources.filter((r) => r.isOperational).length} resources loaded
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.4 }}>
                Lat: {userPosition.lat.toFixed(4)} · Lng: {userPosition.lng.toFixed(4)}
              </div>
            </div>
          </div>
        );
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER: APP SHELL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div style={styles.app}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span>🛡️</span>
          <span>GUARDIAN</span>
          {isUltraLowPower && (
            <span style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: OLED_COLORS.accent + '33',
              color: OLED_COLORS.accent,
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}>
              LOW POWER
            </span>
          )}
        </div>

        <div style={styles.headerActions}>
          {/* BATTERY SAVER TOGGLE — Primary UI trigger */}
          <button
            style={styles.powerToggle}
            onClick={toggleUltraLowPower}
            aria-label="Toggle Ultra-Low Power Mode"
            title="Battery Saver — disables map, reduces GPS to every 5 minutes"
          >
            <span>🔋</span>
            <span>{isUltraLowPower ? 'Power Saver ON' : 'Battery Saver'}</span>
          </button>
        </div>
      </header>

      {/* ── DANGER ZONE BANNER ──────────────────────────────────────── */}
      {currentDanger && (
        <div style={styles.dangerBanner} role="alert">
          <span style={{ fontSize: '20px' }}>🚨</span>
          <div>
            <strong>DANGER — You are inside an active zone!</strong>
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              {currentDanger.description}
            </div>
          </div>
        </div>
      )}

      {/* ── NAVIGATION PANEL ────────────────────────────────────────── */}
      {navigation && navigation.routes.length > 0 && !isUltraLowPower && (
        <div style={styles.routePanel}>
          <div style={styles.routeInfo}>
            <strong>🧭 Safest Route</strong>
            <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>
              {navigation.routes[0].distanceKm.toFixed(1)}km ·{' '}
              {navigation.routes[0].durationMin} min
              {navigation.routes.length > 1 &&
                ` · ${navigation.routes.length} alternatives`}
            </span>
          </div>
          <button style={styles.cancelBtn} onClick={cancelNavigation}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main style={styles.mainContent}>
        {renderContent()}
      </main>

      {/* ── BOTTOM NAVIGATION BAR ───────────────────────────────────── */}
      <nav style={styles.navBar}>
        <button
          style={styles.navItem(currentView === 'map' || currentView === 'list')}
          onClick={() => handleViewChange(isUltraLowPower ? 'list' : 'map')}
        >
          <span style={styles.navIcon}>{isUltraLowPower ? '📋' : '🗺️'}</span>
          {isUltraLowPower ? 'List' : 'Map'}
        </button>
        <button
          style={styles.navItem(currentView === 'alerts')}
          onClick={() => handleViewChange('alerts')}
        >
          <span style={styles.navIcon}>⚠️</span>
          Alerts
          {dangerZones.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '50%',
              marginRight: '-16px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: SEVERITY_COLORS.critical,
            }} />
          )}
        </button>
        <button
          style={styles.navItem(currentView === 'settings')}
          onClick={() => handleViewChange('settings')}
        >
          <span style={styles.navIcon}>⚙️</span>
          Settings
        </button>
      </nav>
    </div>
  );
}
