// App.tsx — Guardian Lebanon — Phase 7: "I AM SAFE" Community Portal
// Direct GUARDIAN_DATA[activeCategory] rendering — NO intermediary state
// lowBandwidthMode: HARD-CODED false — Stability Override
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { QRCodeSVG } from 'qrcode.react';
import {
  TRANSLATIONS, DANGER_TYPES, DISTRICT_COORDINATES, DISTRICT_NAMES,
  LEBANON_CENTER, LEBANON_BOUNDS, DEFAULT_ZOOM,
  SAFETY_BUFFER_METERS, OSRM_BASE_URL,
  MAP_TILE_URL_DARK, MAP_TILE_URL_LIGHT,
  EMERGENCY_CONTACTS, FILTER_CATEGORIES,
  GUARDIAN_DATA, ALL_MARKERS, MARKER_COLORS, MARKER_EMOJI,
  AIRSTRIKES,
  type Language, type Theme, type MarkerPoint,
} from './constants';
import { useSafetyData, type Alert } from './data/safetyData';

// ─── Build Leaflet DivIcon on the fly ────────────────────────────────────────
function buildIcon(markerIcon: string, size = 36): L.DivIcon {
  const bg = MARKER_COLORS[markerIcon] || '#6b7280';
  const emoji = MARKER_EMOJI[markerIcon] || '📍';
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.4)"><span style="font-size:${size * 0.5}px;line-height:1">${emoji}</span></div>`,
    className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

// Build the green pulsing "safe" icon for community check-ins
function buildSafePulseIcon(count: number): L.DivIcon {
  const size = Math.min(32 + count * 4, 52);
  return L.divIcon({
    html: `<div class="safe-pulse-icon" style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(34,197,94,0.25);display:flex;align-items:center;justify-content:center;border:2px solid #22c55e"><span style="font-size:${size * 0.45}px;line-height:1">💚</span></div>`,
    className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

// Pre-build icons for each category
const CATEGORY_ICONS: Record<string, L.DivIcon> = {};
FILTER_CATEGORIES.forEach(f => {
  if (f.id !== 'all') CATEGORY_ICONS[f.id] = buildIcon(f.markerIcon);
});
const USER_ICON = buildIcon('user', 40);

// ─── MapController ───────────────────────────────────────────────────────────
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) { isInitial.current = false; return; }
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => {
      map.invalidateSize();
      window.dispatchEvent(new Event('resize'));
    }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map]);
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`;
}

// Resolve which icon to use for a marker in "all" mode
function resolveAllIcon(marker: MarkerPoint): L.DivIcon {
  for (const cat of FILTER_CATEGORIES) {
    if (cat.id === 'all') continue;
    const arr = GUARDIAN_DATA[cat.id];
    if (arr && arr.some(m => m.id === marker.id)) return CATEGORY_ICONS[cat.id];
  }
  return buildIcon('all');
}

// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const { alerts, addAlert, updateAlert, safeCheckIns, addSafeCheckIn, locations } = useSafetyData();

  // ── State ──────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('guardian-lang') as Language) || 'en');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('guardian-theme') as Theme) || 'dark');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showIAmSafe, setShowIAmSafe] = useState(false);
  // ── Stability Override: lowBandwidth HARD-CODED to false ──
  const lowBandwidth = false;
  const [lowPower, setLowPower] = useState(false);
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(LEBANON_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [routeStart, setRouteStart] = useState('');
  const [routeEnd, setRouteEnd] = useState('');
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ duration: number; dangerAvoided: number } | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [reportType, setReportType] = useState(0);
  const [reportDetails, setReportDetails] = useState('');
  const [feedFilter, setFeedFilter] = useState<'all' | 'airstrikes' | 'roads' | 'community'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('beirut');

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('guardian-lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('guardian-theme', theme); }, [theme]);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // ── Category change → auto-zoom (ONLY if data exists) ─────────────────────
  useEffect(() => {
    if (activeCategory === 'all') {
      setMapCenter(LEBANON_CENTER);
      setMapZoom(DEFAULT_ZOOM);
      return;
    }
    const points = GUARDIAN_DATA[activeCategory];
    if (points && points.length > 0) {
      const avgLat = points.reduce((s, p) => s + p.coordinates[0], 0) / points.length;
      const avgLng = points.reduce((s, p) => s + p.coordinates[1], 0) / points.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(points.length === 1 ? 13 : 10);
    }
  }, [activeCategory]);

  // ── THE DATA TO RENDER — direct from GUARDIAN_DATA, no intermediary ────────
  const markersToRender: MarkerPoint[] = activeCategory === 'all'
    ? ALL_MARKERS
    : (GUARDIAN_DATA[activeCategory] || []);

  // ── Icon for current category ──────────────────────────────────────────────
  const currentIcon: L.DivIcon = activeCategory !== 'all'
    ? (CATEGORY_ICONS[activeCategory] || buildIcon('all'))
    : buildIcon('all'); // fallback, overridden per-marker below

  // ── Search ─────────────────────────────────────────────────────────────────
  const searchResults = searchQuery.trim()
    ? locations.filter((l: any) => {
        const q = searchQuery.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.ar.includes(q) || (l.fr && l.fr.toLowerCase().includes(q));
      }).slice(0, 5)
    : [];

  // ── Feed ───────────────────────────────────────────────────────────────────
  const feedItems = (() => {
    let items = [...alerts];
    if (feedFilter === 'airstrikes') items = items.filter(a => a.type === 'danger' || a.type === 'airstrike');
    if (feedFilter === 'roads') items = items.filter(a => a.type === 'road_closure');
    return items.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  })();

  // ── Community Safety Pulse — districts with recent check-ins (<1h) ─────────
  const ONE_HOUR = 3600000;
  const activeSafeDistricts = useMemo(() => {
    const now = Date.now();
    const districtMap: Record<string, { count: number; latestAt: number }> = {};
    for (const ci of safeCheckIns) {
      if (now - ci.createdAt > ONE_HOUR) continue;
      if (!districtMap[ci.districtId]) {
        districtMap[ci.districtId] = { count: 0, latestAt: ci.createdAt };
      }
      districtMap[ci.districtId].count++;
      if (ci.createdAt > districtMap[ci.districtId].latestAt) {
        districtMap[ci.districtId].latestAt = ci.createdAt;
      }
    }
    return districtMap;
  }, [safeCheckIns]);

  // ── Route ──────────────────────────────────────────────────────────────────
  const calculateRoute = useCallback(async () => {
    if (!routeStart || !routeEnd) return;
    setIsRouting(true);
    try {
      const s = DISTRICT_COORDINATES[routeStart], e = DISTRICT_COORDINATES[routeEnd];
      if (!s || !e) { setIsRouting(false); return; }
      const res = await fetch(`${OSRM_BASE_URL}/${s[1]},${s[0]};${e[1]},${e[0]}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes?.[0]) {
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        const dangerZones = AIRSTRIKES.map(a => a.coordinates);
        let avoided = 0;
        const safe = coords.filter(c => {
          const near = dangerZones.some(dz => haversine(c, dz) < SAFETY_BUFFER_METERS);
          if (near) avoided++;
          return !near;
        });
        setRouteCoords(safe.length > 2 ? safe : coords);
        setRouteInfo({ duration: Math.round(data.routes[0].duration / 60), dangerAvoided: avoided });
        setToast(`✅ ${t.routeFound} — ${avoided} ${t.dangerAvoided}`);
      }
    } catch { setToast('⚠️ Route error'); }
    setIsRouting(false);
  }, [routeStart, routeEnd, t]);

  // ── Report ─────────────────────────────────────────────────────────────────
  const submitReport = useCallback(() => {
    const dt = DANGER_TYPES[reportType];
    addAlert({
      type: dt.type === 'road_closure' ? 'road_closure' : 'danger',
      location: `User Report — ${dt.en}`, districtId: 'beirut',
      message: reportDetails || dt.en, createdAt: Date.now(),
      coordinates: userLocation || LEBANON_CENTER, isUserReported: true,
    });
    setShowReport(false); setReportDetails(''); setToast(t.submitted);
  }, [reportType, reportDetails, userLocation, addAlert, t]);

  // ── I AM SAFE — Submit community safety check-in ──────────────────────────
  const handleIAmSafe = useCallback(() => {
    addSafeCheckIn(selectedDistrict);
    const distName = DISTRICT_NAMES[selectedDistrict]?.[lang] || selectedDistrict;
    setToast(`💚 ${t.markedSafe} — ${distName}`);
    setShowIAmSafe(false);
  }, [selectedDistrict, addSafeCheckIn, t, lang]);

  // ── Theme classes ──────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-[#121212]' : 'bg-white';
  const surface = isDark ? 'bg-[#1c1c1e]' : 'bg-gray-100';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const border = isDark ? 'border-white/10' : 'border-gray-200';

  // ═════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className={`relative w-screen h-[100dvh] overflow-hidden ${bg} ${textMain}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ─── MAP ──────────────────────────────────────────────────────── */}
      <MapContainer
        center={LEBANON_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100dvh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        maxBounds={LEBANON_BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        attributionControl={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* TILE LAYER — ALWAYS RENDERED, HARDCODED, NO CONDITIONAL */}
        <TileLayer url={isDark ? MAP_TILE_URL_DARK : MAP_TILE_URL_LIGHT} />

        {/* USER LOCATION */}
        {userLocation && (
          <Marker position={userLocation} icon={USER_ICON}>
            <Popup><strong>📍 {t.shareLocation}</strong></Popup>
          </Marker>
        )}

        {/* ═══ CATEGORY MARKERS — DIRECT FROM GUARDIAN_DATA ═══ */}
        {markersToRender.map(marker => (
          <Marker
            key={marker.id}
            position={marker.coordinates}
            icon={activeCategory === 'all' ? resolveAllIcon(marker) : currentIcon}
          >
            <Popup>
              <div className="text-xs min-w-[160px]">
                <strong>{marker.name}</strong>
                {marker.message && <p className="mt-1 text-gray-600">{marker.message}</p>}
                {marker.status && (
                  <span className={`block mt-1 ${marker.status === 'open' ? 'text-green-600' : 'text-red-500'}`}>
                    {marker.status === 'open' ? t.open : t.closed}
                  </span>
                )}
                {marker.hours && <span className="block text-gray-400">🕐 {marker.hours}</span>}
                {marker.phone && <a href={`tel:${marker.phone}`} className="block mt-1 text-blue-500 font-bold">📞 {marker.phone}</a>}
                {marker.verified && <span className="block mt-1 text-green-500">{t.verified} ({marker.verificationCount})</span>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ═══ PHASE 7: GREEN PULSE MARKERS — Community Safety ═══ */}
        {Object.entries(activeSafeDistricts).map(([districtId, { count }]) => {
          const coords = DISTRICT_COORDINATES[districtId];
          if (!coords) return null;
          const distName = DISTRICT_NAMES[districtId]?.[lang] || districtId;
          return (
            <Marker key={`safe-${districtId}`} position={coords} icon={buildSafePulseIcon(count)}>
              <Popup>
                <div className="text-xs min-w-[140px] text-center">
                  <strong className="text-green-600">💚 {t.communityPulse}</strong>
                  <p className="mt-1 font-bold">{distName}</p>
                  <p className="text-green-500 font-bold mt-0.5">{count} {t.recentSafe}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ROUTE */}
        {routeCoords && <Polyline positions={routeCoords} pathOptions={{ color: '#3B82F6', weight: 4, dashArray: '10 6', opacity: 0.9 }} />}
      </MapContainer>

      {/* ─── HEADER ───────────────────────────────────────────────────── */}
      <div className={`absolute top-0 left-0 right-0 z-[1000] ${surface}/90 backdrop-blur-xl border-b ${border}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <h1 className="text-lg font-black tracking-tight text-red-500">🛡️ GUARDIAN</h1>
          <div className="flex items-center gap-2">
            {lowBandwidth && <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">{t.lowBandwidthActive}</span>}
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-sm">⚙️</button>
          </div>
        </div>
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTER_CATEGORIES.map(f => (
            <button key={f.id} onClick={() => setActiveCategory(f.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                activeCategory === f.id
                  ? 'bg-red-500 text-white ring-2 ring-red-400 ring-offset-1 ring-offset-black shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}>
              <span className="text-sm">{f.icon}</span> {f[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* ─── SEARCH ───────────────────────────────────────────────────── */}
      <div className="absolute top-[88px] left-3 right-3 z-[1000]">
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder}
          className={`w-full px-4 py-2.5 rounded-xl ${surface}/90 backdrop-blur-md ${textMain} placeholder:${textSub} border ${border} text-sm`} />
        {searchResults.length > 0 && (
          <div className={`mt-1 ${surface} rounded-xl border ${border} overflow-hidden shadow-2xl`}>
            {searchResults.map((r: any, i: number) => (
              <button key={i} onClick={() => { setMapCenter(r.coords); setMapZoom(14); setSearchQuery(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 border-b ${border}`}>
                📍 {r.name} <span className={textSub}>— {r.ar}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── BOTTOM BAR ───────────────────────────────────────────────── */}
      <div className={`absolute bottom-0 left-0 right-0 z-[1000] ${surface}/90 backdrop-blur-xl border-t ${border}`}>
        <div className="flex justify-around py-2">
          {[
            { icon: '🧭', label: t.safestPath, action: () => setShowRouting(true) },
            { icon: '🚨', label: t.reportDanger, action: () => setShowReport(true) },
            { icon: '📡', label: t.liveFeed, action: () => setShowFeed(true) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} className="flex flex-col items-center gap-0.5 text-[10px] font-semibold opacity-90 hover:opacity-100">
              <span className="text-xl">{btn.icon}</span><span className={textSub}>{btn.label}</span>
            </button>
          ))}

          {/* ═══ PHASE 7: "I AM SAFE" BUTTON — Pulsing Green ═══ */}
          <button onClick={() => setShowIAmSafe(true)}
            className="btn-safe-pulse flex flex-col items-center gap-0.5 text-[10px] font-bold text-green-400">
            <span className="text-lg bg-green-500 text-white px-2.5 py-0.5 rounded-md font-black">✅ SAFE</span>
            <span>{t.iAmSafe}</span>
          </button>

          <button onClick={() => setShowEmergency(true)} className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-red-400">
            <span className="text-lg bg-red-500 text-white px-2 py-0.5 rounded-md font-black">SOS</span>
            <span>{t.emergency}</span>
          </button>
        </div>
      </div>

      {/* ─── TOAST ────────────────────────────────────────────────────── */}
      {toast && <div className="absolute top-[140px] left-1/2 -translate-x-1/2 z-[2000] bg-black/80 text-white text-sm px-4 py-2 rounded-xl backdrop-blur-md animate-pulse">{toast}</div>}

      {/* ─── ROUTING ──────────────────────────────────────────────────── */}
      {showRouting && (
        <div className={`absolute bottom-14 left-3 right-3 z-[1001] ${surface} rounded-2xl border ${border} p-4 shadow-2xl`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">🧭 {t.safestPath}</h3>
            <button onClick={() => setShowRouting(false)} className="text-xs opacity-60">{t.close} ✕</button>
          </div>
          <select value={routeStart} onChange={e => setRouteStart(e.target.value)}
            className={`w-full mb-2 p-2 rounded-lg text-sm ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100'} border ${border}`}>
            <option value="">{t.from}</option>
            {Object.keys(DISTRICT_COORDINATES).map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <select value={routeEnd} onChange={e => setRouteEnd(e.target.value)}
            className={`w-full mb-3 p-2 rounded-lg text-sm ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100'} border ${border}`}>
            <option value="">{t.to}</option>
            {Object.keys(DISTRICT_COORDINATES).map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
          <button onClick={calculateRoute} disabled={isRouting || !routeStart || !routeEnd}
            className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm disabled:opacity-40">
            {isRouting ? t.calculating : t.calculate}
          </button>
          {routeInfo && (
            <div className="mt-3 text-xs text-center">
              <span className="text-blue-400 font-bold">⏱ {routeInfo.duration} {t.minutes}</span>
              <span className="mx-2">•</span>
              <span className="text-red-400">⚠️ {routeInfo.dangerAvoided} {t.dangerAvoided}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── REPORT ───────────────────────────────────────────────────── */}
      {showReport && (
        <div className="absolute inset-0 z-[2000] bg-black/60 flex items-end" onClick={() => setShowReport(false)}>
          <div className={`w-full max-w-md mx-auto ${surface} rounded-t-3xl p-5 border-t ${border}`} onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-4">🚨 {t.reportDanger}</h3>
            <label className="text-xs font-semibold mb-1 block">{t.reportType}</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {DANGER_TYPES.map((dt, i) => (
                <button key={i} onClick={() => setReportType(i)}
                  className={`p-2 rounded-xl text-center text-xs ${reportType === i ? 'bg-red-500/20 border-red-500 border' : `${isDark ? 'bg-white/5' : 'bg-gray-100'} border ${border}`}`}>
                  <span className="text-lg block">{dt.icon}</span>{dt[lang as 'en' | 'ar' | 'fr']}
                </button>
              ))}
            </div>
            <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder={t.details}
              className={`w-full p-3 rounded-xl text-sm mb-3 ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100'} border ${border}`} rows={3} />
            <button onClick={submitReport} className="w-full py-3 rounded-xl bg-red-500 text-white font-bold">{t.submit}</button>
          </div>
        </div>
      )}

      {/* ─── SETTINGS ─────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="absolute inset-0 z-[2000] bg-black/60" onClick={() => setShowSettings(false)}>
          <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-0 bottom-0 w-72 ${surface} border-l ${border} p-5`} onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-5">⚙️ {t.settings}</h3>
            <label className="text-xs font-semibold mb-2 block">{t.language}</label>
            <div className="flex gap-2 mb-4">
              {(['en', 'ar', 'fr'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${lang === l ? 'bg-blue-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  {l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Français'}
                </button>
              ))}
            </div>
            <label className="text-xs font-semibold mb-2 block">{t.theme}</label>
            <div className="flex gap-2 mb-4">
              {(['dark', 'light'] as const).map(th => (
                <button key={th} onClick={() => setTheme(th)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${theme === th ? 'bg-blue-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  {th === 'dark' ? t.dark : t.light}
                </button>
              ))}
            </div>
            {[
              { label: t.lowPower, state: lowPower, setter: setLowPower },
            ].map((tog, i) => (
              <div key={i} className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold">{tog.label}</span>
                <button onClick={() => tog.setter(!tog.state)}
                  className={`w-10 h-5 rounded-full transition-colors ${tog.state ? 'bg-green-500' : 'bg-gray-500'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${tog.state ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
            <button onClick={() => { setShowQR(true); setShowSettings(false); }}
              className="w-full mt-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold">📱 {t.shareQR}</button>
            <button onClick={() => { addSafeCheckIn('beirut'); setToast(t.markedSafe); }}
              className="w-full mt-2 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">{t.iAmSafe}</button>
          </div>
        </div>
      )}

      {/* ═══ PHASE 7: "I AM SAFE" MODAL — District Selector & Check-in ═══ */}
      {showIAmSafe && (
        <div className="absolute inset-0 z-[2000] bg-black/60 flex items-end" onClick={() => setShowIAmSafe(false)}>
          <div className={`w-full max-w-md mx-auto ${surface} rounded-t-3xl p-5 border-t ${border}`} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="safe-pulse-icon w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500">
                <span className="text-2xl">💚</span>
              </div>
              <div>
                <h3 className="text-base font-black text-green-400">{t.iAmSafe}</h3>
                <p className="text-[11px] opacity-60">{t.iAmSafeDesc}</p>
              </div>
            </div>

            {/* District Selector */}
            <label className="text-xs font-semibold mb-2 block">{t.selectDistrict}</label>
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {Object.entries(DISTRICT_NAMES).map(([id, names]) => (
                <button key={id} onClick={() => setSelectedDistrict(id)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                    selectedDistrict === id
                      ? 'bg-green-500/20 border-green-500 border-2 text-green-400 ring-1 ring-green-400/30'
                      : `${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} border ${border}`
                  }`}>
                  <span className="block text-sm mb-0.5">{names[lang]}</span>
                  {activeSafeDistricts[id] && (
                    <span className="text-[9px] text-green-500">💚 {activeSafeDistricts[id].count} safe</span>
                  )}
                </button>
              ))}
            </div>

            {/* Community Pulse Summary */}
            {Object.keys(activeSafeDistricts).length > 0 && (
              <div className={`mb-4 p-3 rounded-xl ${isDark ? 'bg-green-500/5' : 'bg-green-50'} border border-green-500/20`}>
                <p className="text-[10px] font-bold text-green-500 mb-1">💚 {t.communityPulse}</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(activeSafeDistricts).map(([dId, { count }]) => (
                    <span key={dId} className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">
                      {DISTRICT_NAMES[dId]?.[lang] || dId} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleIAmSafe}
              className="btn-safe-pulse w-full py-3.5 rounded-xl bg-green-500 text-white font-black text-sm tracking-wide hover:bg-green-600 transition-colors">
              💚 {t.safeNow} — {DISTRICT_NAMES[selectedDistrict]?.[lang] || selectedDistrict}
            </button>
          </div>
        </div>
      )}

      {/* ─── FEED ─────────────────────────────────────────────────────── */}
      {showFeed && (
        <div className="absolute inset-0 z-[2000] bg-black/60" onClick={() => setShowFeed(false)}>
          <div className={`absolute bottom-0 left-0 right-0 max-h-[70vh] ${surface} rounded-t-3xl border-t ${border} overflow-hidden`} onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm">📡 {t.liveFeed}</h3>
                <button onClick={() => setShowFeed(false)} className="text-xs opacity-60">{t.close} ✕</button>
              </div>
              <div className="flex gap-2">
                {([
                  ['all', t.feedAll],
                  ['airstrikes', t.feedAirstrikes],
                  ['roads', t.feedRoads],
                  ['community', t.communityTab],
                ] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setFeedFilter(key as any)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      feedFilter === key
                        ? key === 'community' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        : isDark ? 'bg-white/10' : 'bg-gray-200'
                    }`}>
                    {key === 'community' ? `💚 ${label}` : label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
              {/* ═══ PHASE 7: Community Feed Tab ═══ */}
              {feedFilter === 'community' ? (
                safeCheckIns.length > 0 ? (
                  safeCheckIns.slice(0, 30).map(ci => {
                    const distName = DISTRICT_NAMES[ci.districtId]?.[lang] || ci.districtId;
                    return (
                      <div key={ci.id} className={`p-3 rounded-xl ${isDark ? 'bg-green-500/5' : 'bg-green-50'} border border-green-500/20`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">💚</span>
                            <span className="text-xs font-bold">
                              {ci.userId} <span className="font-normal opacity-70">{t.communityCheckIn}</span>{' '}
                              <span className="text-green-400 font-bold">{distName}</span>
                            </span>
                          </div>
                          <span className="text-[10px] opacity-50">{timeAgo(ci.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 opacity-40 text-sm">{t.communityPulse}: No check-ins yet</div>
                )
              ) : (
                feedItems.map(item => (
                  <div key={item.id} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} border ${border}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold">{item.type === 'road_closure' ? '🚧' : '💥'} {item.location}</span>
                        <p className="text-[10px] mt-0.5 opacity-70">{item.message}</p>
                      </div>
                      <span className="text-[10px] opacity-50">{timeAgo(item.createdAt)}</span>
                    </div>
                    {item.verified && <span className="text-[9px] text-green-400 mt-1 block">{t.verified} • {item.verificationCount} {t.votes}</span>}
                    {item.type === 'road_closure' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateAlert(item.id, { verificationCount: (item.verificationCount || 0) + 1 })}
                          className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400">👍 Confirm</button>
                        <button className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">👎 Deny</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SOS ──────────────────────────────────────────────────────── */}
      {showEmergency && (
        <div className="absolute inset-0 z-[2000] bg-black/70" onClick={() => setShowEmergency(false)}>
          <div className={`absolute bottom-0 left-0 right-0 ${surface} rounded-t-3xl border-t ${border} p-5`} onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-4 text-red-400">🆘 {t.sosTitle}</h3>
            <div className="grid grid-cols-2 gap-3">
              {EMERGENCY_CONTACTS.map((c, i) => (
                <a key={i} href={`tel:${c.number}`}
                  className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} border ${border}`}>
                  <span className="text-2xl" style={{ filter: `drop-shadow(0 0 4px ${c.color})` }}>{c.icon}</span>
                  <div>
                    <span className="text-xs font-bold block">{c.name}</span>
                    <span className="text-lg font-black" style={{ color: c.color }}>{c.number}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── QR ───────────────────────────────────────────────────────── */}
      {showQR && (
        <div className="absolute inset-0 z-[2000] bg-black/70 flex items-center justify-center" onClick={() => setShowQR(false)}>
          <div className={`${surface} rounded-2xl p-6 border ${border} text-center`} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-3">📱 {t.shareQR}</h3>
            <QRCodeSVG value={`https://maps.google.com/?q=${userLocation?.[0] || LEBANON_CENTER[0]},${userLocation?.[1] || LEBANON_CENTER[1]}`} size={180} />
            <p className="text-xs mt-3 opacity-60">{t.shareLocation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
