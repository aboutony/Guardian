// App.tsx — Guardian Lebanon — Modular Recovery Build
// All static data imported from ./constants | Hook/data from ./data/safetyData
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { QRCodeSVG } from 'qrcode.react';
import {
  TRANSLATIONS, DANGER_TYPES, DISTRICT_COORDINATES, LEBANON_CENTER, LEBANON_BOUNDS,
  DEFAULT_ZOOM, SAFETY_BUFFER_METERS, OSRM_BASE_URL, FILTER_CATEGORIES, SERVICE_ICONS,
  HOSPITAL_FALLBACK, EMERGENCY_CONTACTS,
  type Language, type Theme
} from './constants';
import { useSafetyData, type Alert, type EssentialService } from './data/safetyData';

// ─── Leaflet Icon Factories ─────────────────────────────────────────────────
const makeIcon = (emoji: string, size = 28) => L.divIcon({
  html: `<span style="font-size:${size}px;line-height:1">${emoji}</span>`,
  className: 'marker-animate', iconSize: [size, size], iconAnchor: [size / 2, size],
});
const ICONS: Record<string, L.DivIcon> = {
  danger: makeIcon('🔴', 22), warning: makeIcon('🟡', 20), airstrike: makeIcon('💥', 26),
  road_closure: makeIcon('🚧', 24), hospital: makeIcon('🏥', 26), bakery: makeIcon('🍞', 24),
  pharmacy: makeIcon('💊', 24), fuel: makeIcon('⛽', 24), ngo: makeIcon('🤝', 24),
  tools: makeIcon('🔧', 22), food_water: makeIcon('🍲', 24), user: makeIcon('📍', 28),
  info: makeIcon('ℹ️', 20),
};

// ─── MapController — flies to coords on change (skips initial mount) ─────────
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) { isInitial.current = false; return; }
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  // Force Leaflet to recalculate size after mount (fixes 0-height bug)
  useEffect(() => { setTimeout(() => map.invalidateSize(), 200); }, [map]);
  return null;
}

// ─── Haversine distance (meters) ─────────────────────────────────────────────
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLon = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ─── Time-ago helper ─────────────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN APP COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── Data hook ──────────────────────────────────────────────────────────────
  const { districts, alerts, services, safeCheckIns, addAlert, updateAlert, addSafeCheckIn, locations } = useSafetyData();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('guardian-lang') as Language) || 'en');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('guardian-theme') as Theme) || 'dark');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [toast, setToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(LEBANON_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  // ── Routing state ──────────────────────────────────────────────────────────
  const [routeStart, setRouteStart] = useState('');
  const [routeEnd, setRouteEnd] = useState('');
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ duration: number; dangerAvoided: number } | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // ── Report state ───────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState(0);
  const [reportDetails, setReportDetails] = useState('');

  // ── Feed filter ────────────────────────────────────────────────────────────
  const [feedFilter, setFeedFilter] = useState<'all' | 'airstrikes' | 'roads'>('all');

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  // ── Persist preferences ────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('guardian-lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('guardian-theme', theme); }, [theme]);

  // ── Geolocation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => console.warn('Geolocation unavailable')
    );
  }, []);

  // ── Toast auto-hide ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // ── Filtered markers ──────────────────────────────────────────────────────
  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') return alerts;
    if (activeFilter === 'airstrikes') return alerts.filter(a => a.type === 'danger' || a.type === 'airstrike');
    if (activeFilter === 'road_status') return alerts.filter(a => a.type === 'road_closure');
    return [];
  }, [alerts, activeFilter]);

  const filteredServices = useMemo(() => {
    if (activeFilter === 'all') return services;
    const map: Record<string, string> = { hospitals: 'hospital', bakeries: 'bakery', pharmacies: 'pharmacy', fuel: 'fuel', ngo: 'ngo' };
    const svcType = map[activeFilter];
    return svcType ? services.filter(s => s.type === svcType) : [];
  }, [services, activeFilter]);

  // ── Search results ─────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return locations.filter(l =>
      l.name.toLowerCase().includes(q) || l.ar.includes(q) || (l.fr && l.fr.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [searchQuery, locations]);

  // ── Feed items (filtered + sorted) ────────────────────────────────────────
  const feedItems = useMemo(() => {
    let items = [...alerts].sort((a, b) => b.createdAt - a.createdAt);
    if (feedFilter === 'airstrikes') items = items.filter(a => a.type === 'danger' || a.type === 'airstrike');
    if (feedFilter === 'roads') items = items.filter(a => a.type === 'road_closure');
    return items.slice(0, 20);
  }, [alerts, feedFilter]);

  // ── OSRM Route calculation with 500m safety buffer ────────────────────────
  const calculateRoute = useCallback(async () => {
    if (!routeStart || !routeEnd) return;
    const start = DISTRICT_COORDINATES[routeStart];
    const end = DISTRICT_COORDINATES[routeEnd];
    if (!start || !end) return;
    setIsRouting(true);
    try {
      const url = `${OSRM_BASE_URL}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) {
        const rawCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        );
        // 500m safety buffer: shift route points near danger zones
        const dangerZones = alerts.filter(a => a.type === 'danger' || a.type === 'airstrike').map(a => a.coordinates);
        const safeCoords = rawCoords.map(point => {
          for (const dz of dangerZones) {
            if (haversine(point, dz) < SAFETY_BUFFER_METERS) {
              const bearing = Math.atan2(point[1] - dz[1], point[0] - dz[0]);
              const offset = SAFETY_BUFFER_METERS / 111320;
              return [point[0] + Math.cos(bearing) * offset, point[1] + Math.sin(bearing) * offset] as [number, number];
            }
          }
          return point;
        });
        const avoided = dangerZones.filter(dz => rawCoords.some(p => haversine(p, dz) < SAFETY_BUFFER_METERS)).length;
        setRouteCoords(safeCoords);
        setRouteInfo({ duration: Math.round(data.routes[0].duration / 60), dangerAvoided: avoided });
        setToast(`${t.safePathFound} ✓`);
        setMapCenter(start);
        setMapZoom(10);
      }
    } catch (err) {
      console.error('Route calculation failed:', err);
      setToast('Route calculation failed');
    }
    setIsRouting(false);
  }, [routeStart, routeEnd, alerts, t]);

  // ── Submit report ──────────────────────────────────────────────────────────
  const submitReport = useCallback(() => {
    const coord: [number, number] = userLocation || LEBANON_CENTER;
    const nearestDistrict = districts.reduce((nearest, d) => {
      const dCenter: [number, number] = [(d.bounds[0][0] + d.bounds[1][0]) / 2, (d.bounds[0][1] + d.bounds[1][1]) / 2];
      const dist = haversine(coord, dCenter);
      return dist < nearest.dist ? { id: d.id, dist } : nearest;
    }, { id: 'beirut', dist: Infinity });
    addAlert({
      type: reportType <= 1 ? 'danger' : reportType === 4 ? 'info' : 'warning',
      location: DANGER_TYPES[lang][reportType],
      districtId: nearestDistrict.id,
      message: reportDetails || DANGER_TYPES[lang][reportType],
      createdAt: Date.now(),
      coordinates: coord,
      isUserReported: true,
    });
    setShowReport(false);
    setReportDetails('');
    setToast(`${t.report} ✓`);
  }, [userLocation, reportType, reportDetails, lang, t, districts, addAlert]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const shareLocation = useCallback(() => {
    if (!userLocation) return;
    const url = `https://wa.me/?text=${encodeURIComponent(t.whatsappMessage + `https://maps.google.com/?q=${userLocation[0]},${userLocation[1]}`)}`;
    window.open(url, '_blank');
  }, [userLocation, t]);

  const handleIAmSafe = useCallback(() => {
    if (!userLocation) return;
    const nearest = districts.reduce((n, d) => {
      const c: [number, number] = [(d.bounds[0][0] + d.bounds[1][0]) / 2, (d.bounds[0][1] + d.bounds[1][1]) / 2];
      const dist = haversine(userLocation, c);
      return dist < n.dist ? { id: d.id, dist } : n;
    }, { id: 'beirut', dist: Infinity });
    addSafeCheckIn(nearest.id);
    setToast(`${t.iAmSafe} ✓`);
  }, [userLocation, districts, addSafeCheckIn, t]);

  // ── Theme classes ──────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-[#121212]' : 'bg-white';
  const surface = isDark ? 'bg-[#1c1c1e]' : 'bg-gray-100';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const border = isDark ? 'border-white/10' : 'border-gray-200';

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`relative w-screen h-[100dvh] overflow-hidden ${bg} ${textMain}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ─── MAP ──────────────────────────────────────────────────────────── */}
      <MapContainer center={LEBANON_CENTER} zoom={DEFAULT_ZOOM}
        style={{ height: '100dvh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        maxBounds={LEBANON_BOUNDS} maxBoundsViscosity={0.8}
        zoomControl={false} attributionControl={false}>
        <MapController center={mapCenter} zoom={mapZoom} />
        {!lowBandwidth && (
          <TileLayer
            url={isDark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
            zIndex={1} />
        )}
        {/* User location */}
        {userLocation && <Marker position={userLocation} icon={ICONS.user}>
          <Popup><strong>📍 {t.shareLocation}</strong></Popup>
        </Marker>}
        {/* Alerts */}
        {filteredAlerts.map(a => (
          <Marker key={a.id} position={a.coordinates} icon={ICONS[a.type] || ICONS.warning}>
            <Popup>
              <div className="text-xs min-w-[180px]">
                <strong>{a.location}</strong>
                <p className="mt-1 opacity-80">{a.message}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span>{a.verified ? t.nnaVerified : t.communityReport}</span>
                  <span>• {timeAgo(a.createdAt)}</span>
                </div>
                {a.type === 'road_closure' && (
                  <div className="mt-2 flex gap-1">
                    <button onClick={() => updateAlert(a.id, { verificationCount: (a.verificationCount || 0) + 1 })}
                      className="px-2 py-1 bg-red-600 text-white rounded text-[10px]">{t.stillClosed}</button>
                    <button onClick={() => updateAlert(a.id, { roadOpen: true })}
                      className="px-2 py-1 bg-green-600 text-white rounded text-[10px]">{t.roadNowOpen}</button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Services */}
        {filteredServices.map(s => (
          <Marker key={s.id} position={s.coordinates} icon={ICONS[s.type] || ICONS.info}>
            <Popup>
              <div className="text-xs min-w-[160px]">
                <strong>{SERVICE_ICONS[s.type]} {s.name}</strong>
                <p className={`mt-1 font-bold ${s.status === 'open' ? 'text-green-500' : s.status === 'limited' ? 'text-yellow-500' : 'text-red-500'}`}>
                  {s.status === 'open' ? t.operational : s.status === 'limited' ? t.limited : t.closed}
                </p>
                {s.hours && <p className="mt-1 opacity-70">{t.hours}: {s.hours}</p>}
                {s.type === 'hospital' && <a href="tel:140" className="block mt-2 text-red-400 font-bold">{t.lrcEmergency}</a>}
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Hospital fallback markers */}
        {(activeFilter === 'all' || activeFilter === 'hospitals') && HOSPITAL_FALLBACK.map((h, i) => (
          <Marker key={`hf-${i}`} position={h.coordinates} icon={ICONS.hospital}>
            <Popup>
              <div className="text-xs">
                <strong>🏥 {h.name}</strong>
                <a href={`tel:${h.phone}`} className="block mt-1 text-blue-400 font-bold">📞 {h.phone}</a>
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Route polyline */}
        {routeCoords && <Polyline positions={routeCoords} pathOptions={{
          color: '#3B82F6', weight: 4, dashArray: '10 6', opacity: 0.9
        }} />}
      </MapContainer>

      {/* ─── HEADER BAR ───────────────────────────────────────────────────── */}
      <div className={`absolute top-0 left-0 right-0 z-[1000] ${surface}/90 backdrop-blur-xl border-b ${border}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <h1 className="text-lg font-black tracking-tight text-red-500">🛡️ GUARDIAN</h1>
          <div className="flex items-center gap-2">
            {lowBandwidth && <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">{t.lowBandwidthActive}</span>}
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-sm">⚙️</button>
          </div>
        </div>
        {/* Filter chips */}
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar">
          {FILTER_CATEGORIES.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeFilter === f.id ? 'bg-red-500 text-white' : `${isDark ? 'bg-white/10 text-white/70' : 'bg-gray-200 text-gray-600'}`
              }`}>
              <span>{f.icon}</span> {f[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* ─── SEARCH BAR ───────────────────────────────────────────────────── */}
      <div className="absolute top-[88px] left-3 right-3 z-[1000]">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className={`w-full px-4 py-2.5 rounded-2xl ${surface}/90 backdrop-blur-xl ${textMain} text-sm border ${border} outline-none`} />
        {searchResults.length > 0 && (
          <div className={`mt-1 rounded-2xl ${surface}/95 backdrop-blur-xl border ${border} overflow-hidden`}>
            {searchResults.map((r, i) => (
              <button key={i} onClick={() => { setMapCenter(r.coords as [number, number]); setMapZoom(14); setSearchQuery(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm ${textMain} hover:bg-white/10 border-b ${border} last:border-0`}>
                📍 {lang === 'ar' ? r.ar : r.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── BOTTOM ACTION BAR ────────────────────────────────────────────── */}
      <div className={`absolute bottom-0 left-0 right-0 z-[1000] ${surface}/90 backdrop-blur-xl border-t ${border} pb-[env(safe-area-inset-bottom)]`}>
        <div className="flex items-center justify-around py-2.5 px-2">
          <button onClick={() => { setShowRouting(true); setShowFeed(false); }}
            className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-blue-400">
            <span className="text-lg">🧭</span>{t.findSafestPath}
          </button>
          <button onClick={() => setShowReport(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-red-400">
            <span className="text-lg">🚨</span>{t.reportDanger}
          </button>
          <button onClick={() => { setShowFeed(true); setShowRouting(false); }}
            className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-green-400">
            <span className="text-lg">📡</span>{t.liveSafetyFeed}
          </button>
          <button onClick={() => setShowEmergency(true)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-red-500">
            <span className="text-lg">🆘</span>{t.emergency}
          </button>
        </div>
      </div>

      {/* ─── ROUTE PANEL ──────────────────────────────────────────────────── */}
      {showRouting && (
        <div className={`absolute bottom-16 left-3 right-3 z-[1001] ${surface} border ${border} rounded-3xl p-4`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold">🧭 {t.findSafestPath}</h3>
            <button onClick={() => { setShowRouting(false); setRouteCoords(null); setRouteInfo(null); }} className="text-lg">✕</button>
          </div>
          <select value={routeStart} onChange={e => setRouteStart(e.target.value)}
            className={`w-full mb-2 px-3 py-2 rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'} text-sm`}>
            <option value="">{t.startPoint}</option>
            {Object.keys(DISTRICT_COORDINATES).map(d => <option key={d} value={d}>{t.districts?.[d] || d}</option>)}
          </select>
          <select value={routeEnd} onChange={e => setRouteEnd(e.target.value)}
            className={`w-full mb-3 px-3 py-2 rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'} text-sm`}>
            <option value="">{t.destination}</option>
            {Object.keys(DISTRICT_COORDINATES).map(d => <option key={d} value={d}>{t.districts?.[d] || d}</option>)}
          </select>
          <button onClick={calculateRoute} disabled={isRouting || !routeStart || !routeEnd}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-2xl text-sm disabled:opacity-40">
            {isRouting ? t.routing : t.findSafestPath}
          </button>
          {routeInfo && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-2xl text-xs">
              <p className="text-green-400 font-bold">{t.safePathFound} ✓</p>
              <p className="mt-1">{t.estimatedTime}: <strong>{routeInfo.duration} {t.minutes}</strong></p>
              <p>{t.dangerAvoided}: <strong>{routeInfo.dangerAvoided}</strong></p>
            </div>
          )}
        </div>
      )}

      {/* ─── SAFETY FEED ──────────────────────────────────────────────────── */}
      {showFeed && (
        <div className={`absolute bottom-16 left-0 right-0 z-[1001] ${surface} border-t ${border} rounded-t-3xl max-h-[60vh] overflow-hidden flex flex-col`}>
          <div className="flex justify-between items-center p-3 border-b border-white/5">
            <h3 className="text-sm font-bold">📡 {t.liveSafetyFeed}</h3>
            <button onClick={() => setShowFeed(false)} className="text-lg">✕</button>
          </div>
          <div className="flex gap-1 px-3 py-2">
            {(['all', 'airstrikes', 'roads'] as const).map(f => (
              <button key={f} onClick={() => setFeedFilter(f)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${feedFilter === f ? 'bg-red-500 text-white' : 'bg-white/10 text-white/60'}`}>
                {f === 'all' ? '📍 All' : f === 'airstrikes' ? '💥 Strikes' : '🚧 Roads'}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto flex-1 px-3 pb-3 space-y-2">
            {feedItems.map(a => (
              <div key={a.id} className={`p-3 rounded-2xl border ${a.type === 'danger' || a.type === 'airstrike' ? 'border-red-500/30 bg-red-500/5' : a.type === 'road_closure' ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs">{a.location}</span>
                  <span className="text-[10px] opacity-50">{timeAgo(a.createdAt)}</span>
                </div>
                <p className="text-[11px] mt-1 opacity-70">{a.message}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                  {a.verified ? <span className="text-green-400">{t.nnaVerified}</span> : <span className="text-yellow-400">{t.communityReport}</span>}
                  {a.verificationCount ? <span className="opacity-40">• {t.verifiedBy.replace('{count}', String(a.verificationCount))}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── REPORT MODAL ─────────────────────────────────────────────────── */}
      {showReport && (
        <div className="absolute inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-end justify-center">
          <div className={`w-full max-w-md ${surface} rounded-t-3xl p-5`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">🚨 {t.reportDanger}</h3>
              <button onClick={() => setShowReport(false)} className="text-xl">✕</button>
            </div>
            <p className="text-xs mb-3 opacity-60">{t.dangerType}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {DANGER_TYPES[lang].map((d, i) => (
                <button key={i} onClick={() => setReportType(i)}
                  className={`p-2.5 rounded-2xl text-xs font-semibold border transition-all ${reportType === i ? 'border-red-500 bg-red-500/20 text-red-400' : `border-white/10 ${isDark ? 'text-white/60' : 'text-gray-500'}`}`}>
                  {d}
                </button>
              ))}
            </div>
            <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)}
              placeholder={t.describe} rows={2}
              className={`w-full px-4 py-2.5 rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'} text-sm resize-none mb-4`} />
            <button onClick={submitReport}
              className="w-full py-3 bg-red-600 text-white font-black rounded-2xl text-sm tracking-wide">
              {t.submitReport}
            </button>
          </div>
        </div>
      )}

      {/* ─── SETTINGS DRAWER ──────────────────────────────────────────────── */}
      {showSettings && (
        <div className="absolute inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-end justify-center">
          <div className={`w-full max-w-md ${surface} rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold">⚙️ {t.settings}</h3>
              <button onClick={() => setShowSettings(false)} className="text-xl">✕</button>
            </div>
            {/* Language */}
            <div className="mb-5">
              <p className="text-xs font-bold mb-2 opacity-60">{t.language}</p>
              <div className="flex gap-2">
                {(['en', 'ar', 'fr'] as Language[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${lang === l ? 'bg-red-500 text-white' : 'bg-white/10'}`}>
                    {l === 'en' ? 'English' : l === 'ar' ? 'عربي' : 'Français'}
                  </button>
                ))}
              </div>
            </div>
            {/* Theme */}
            <div className="mb-5">
              <p className="text-xs font-bold mb-2 opacity-60">{t.theme}</p>
              <div className="flex gap-2">
                {(['dark', 'light'] as Theme[]).map(th => (
                  <button key={th} onClick={() => setTheme(th)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${theme === th ? 'bg-red-500 text-white' : 'bg-white/10'}`}>
                    {th === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </div>
            {/* Toggles */}
            <div className="space-y-3 mb-5">
              <label className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div>
                  <p className="text-xs font-bold">{t.lowBandwidth}</p>
                  <p className="text-[10px] opacity-50">{t.optimized3G}</p>
                </div>
                <input type="checkbox" checked={lowBandwidth} onChange={e => setLowBandwidth(e.target.checked)}
                  className="w-5 h-5 accent-red-500" />
              </label>
              <label className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div>
                  <p className="text-xs font-bold">{t.lowPower}</p>
                  <p className="text-[10px] opacity-50">{t.lowPowerDesc}</p>
                </div>
                <input type="checkbox" checked={lowPower} onChange={e => setLowPower(e.target.checked)}
                  className="w-5 h-5 accent-red-500" />
              </label>
            </div>
            {/* QR + Share */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setShowQR(true); setShowSettings(false); }}
                className="flex-1 py-2.5 bg-white/10 rounded-2xl text-xs font-bold">{t.showQR}</button>
              <button onClick={handleIAmSafe}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-2xl text-xs font-bold">{t.iAmSafe}</button>
            </div>
            <button onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-red-600 text-white font-black rounded-2xl text-sm">{t.close}</button>
          </div>
        </div>
      )}

      {/* ─── EMERGENCY PANEL ──────────────────────────────────────────────── */}
      {showEmergency && (
        <div className="absolute inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-end justify-center">
          <div className={`w-full max-w-md ${surface} rounded-t-3xl p-5`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-red-500">🆘 {t.emergencyContacts}</h3>
              <button onClick={() => setShowEmergency(false)} className="text-xl">✕</button>
            </div>
            <div className="space-y-2 mb-4">
              {EMERGENCY_CONTACTS.map((c, i) => (
                <a key={i} href={`tel:${c.number}`}
                  className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-red-500/10' : 'bg-red-50'} border border-red-500/20`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{lang === 'ar' ? c.nameAr : lang === 'fr' ? c.nameFr : c.name}</p>
                      <p className="text-xs opacity-60">{c.number}</p>
                    </div>
                  </div>
                  <span className="text-2xl">📞</span>
                </a>
              ))}
            </div>
            <button onClick={shareLocation}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl text-sm mb-2">
              📍 {t.shareLocation}
            </button>
            <button onClick={() => setShowEmergency(false)}
              className="w-full py-2.5 bg-white/10 rounded-2xl text-xs font-bold">{t.close}</button>
          </div>
        </div>
      )}

      {/* ─── QR MODAL ─────────────────────────────────────────────────────── */}
      {showQR && (
        <div className="absolute inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowQR(false)}>
          <div className={`${surface} rounded-3xl p-6 text-center max-w-xs`} onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3">📲 {t.showQR}</h3>
            <div className="bg-white p-4 rounded-2xl inline-block mb-3">
              <QRCodeSVG value={window.location.href} size={200} />
            </div>
            <p className="text-[10px] opacity-50 mb-3">{t.scanQR}</p>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setToast(t.shareSuccess); setShowQR(false); }}
              className="w-full py-2.5 bg-red-600 text-white font-bold rounded-2xl text-xs">{t.shareApp}</button>
          </div>
        </div>
      )}

      {/* ─── LOW BANDWIDTH OVERLAY ────────────────────────────────────────── */}
      {lowBandwidth && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none">
          <p className="text-white/20 text-center text-xs font-bold tracking-widest">{t.lowBandwidthActive}</p>
        </div>
      )}

      {/* ─── TOAST ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[3000] px-5 py-2.5 bg-green-600 text-white text-xs font-bold rounded-2xl shadow-lg animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}
