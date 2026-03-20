// App.tsx — Guardian Lebanon — Phase 11: Predictive Danger Heatmaps
// GUARDIAN_DATA unified engine — lowBandwidthMode HARD-CODED false
// Antigravity Editor approved
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { QRCodeSVG } from 'qrcode.react';
import {
  TRANSLATIONS, DANGER_TYPES, DISTRICT_COORDINATES, DISTRICT_NAMES,
  LEBANON_CENTER, LEBANON_BOUNDS, DEFAULT_ZOOM,
  SAFETY_BUFFER_METERS, OSRM_BASE_URL,
  MAP_TILE_URL_DARK, MAP_TILE_URL_LIGHT,
  EMERGENCY_CONTACTS, FILTER_CATEGORIES,
  GUARDIAN_DATA, ALL_MARKERS, MARKER_COLORS, MARKER_EMOJI,
  AIRSTRIKES, NGOS, ROAD_BLOCKS, SEISMIC_DATA,
  getShelterStatus, DISPUTE_THRESHOLD, detectBrowserLanguage,
  type Language, type Theme, type MarkerPoint,
} from './constants';
import { useSafetyData, type Alert } from './data/safetyData';

// ─── Build Leaflet DivIcon ───────────────────────────────────────────────────
function buildIcon(markerIcon: string, size = 36, opacity = 1): L.DivIcon {
  const bg = MARKER_COLORS[markerIcon] || '#6b7280';
  const emoji = MARKER_EMOJI[markerIcon] || '📍';
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);border:2px solid rgba(255,255,255,0.4);opacity:${opacity}"><span style="font-size:${size * 0.5}px;line-height:1">${emoji}</span></div>`,
    className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}
function buildSafePulseIcon(count: number): L.DivIcon {
  const size = Math.min(32 + count * 4, 52);
  return L.divIcon({
    html: `<div class="safe-pulse-icon" style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(34,197,94,0.25);display:flex;align-items:center;justify-content:center;border:2px solid #22c55e"><span style="font-size:${size * 0.45}px;line-height:1">💚</span></div>`,
    className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}
function buildShelterIcon(marker: MarkerPoint, size = 38): L.DivIcon {
  const bg = MARKER_COLORS['ngo'] || '#0891b2';
  const emoji = MARKER_EMOJI['ngo'] || '🤝';
  const status = (marker.capacity && marker.occupancy != null) ? getShelterStatus(marker.occupancy, marker.capacity) : null;
  const ringColor = status ? status.color : 'rgba(255,255,255,0.4)';
  const ringWidth = status ? 3 : 2;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.5),0 0 0 ${ringWidth + 2}px ${ringColor}40;border:${ringWidth}px solid ${ringColor}"><span style="font-size:${size * 0.5}px;line-height:1">${emoji}</span></div>`,
    className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

const CATEGORY_ICONS: Record<string, L.DivIcon> = {};
FILTER_CATEGORIES.forEach(f => { if (f.id !== 'all') CATEGORY_ICONS[f.id] = buildIcon(f.markerIcon); });
const USER_ICON = buildIcon('user', 40);
const SHELTER_ICONS: Record<string, L.DivIcon> = {};
NGOS.forEach(ngo => { SHELTER_ICONS[ngo.id] = buildShelterIcon(ngo); });
const AIRSTRIKE_IDS = new Set(AIRSTRIKES.map(a => a.id));
const ROADBLOCK_IDS = new Set(ROAD_BLOCKS.map(r => r.id));

// ─── Phase 11: HeatmapLayer — uses leaflet.heat via useMap() ─────────────────
function HeatmapLayer({ active }: { active: boolean }) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  useEffect(() => {
    if (!active) {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
      return;
    }
    // Build heatmap data: [lat, lng, intensity]
    const points: [number, number, number][] = [];
    AIRSTRIKES.forEach(s => points.push([s.coordinates[0], s.coordinates[1], s.weight ?? 0.5]));
    ROAD_BLOCKS.forEach(r => points.push([r.coordinates[0], r.coordinates[1], (r.weight ?? 0.3) * 0.7]));
    SEISMIC_DATA.forEach(d => points.push([d.coordinates[0], d.coordinates[1], d.weight * 0.6]));
    layerRef.current = (L as any).heatLayer(points, {
      radius: 35, blur: 25, maxZoom: 13, max: 1.0,
      gradient: { 0.2: '#2563eb', 0.4: '#f97316', 0.6: '#ef4444', 0.8: '#dc2626', 1.0: '#7f1d1d' },
    }).addTo(map);
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [active, map]);
  return null;
}

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
    const t2 = setTimeout(() => { map.invalidateSize(); window.dispatchEvent(new Event('resize')); }, 500);
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
function resolveAllIcon(marker: MarkerPoint, disputeOv: Record<string, number>): L.DivIcon {
  if (SHELTER_ICONS[marker.id]) return SHELTER_ICONS[marker.id];
  const disputes = disputeOv[marker.id] ?? marker.disputeCount ?? 0;
  const isUnverified = disputes > DISPUTE_THRESHOLD;
  for (const cat of FILTER_CATEGORIES) {
    if (cat.id === 'all') continue;
    const arr = GUARDIAN_DATA[cat.id];
    if (arr && arr.some(m => m.id === marker.id))
      return isUnverified ? buildIcon(cat.markerIcon, 36, 0.4) : CATEGORY_ICONS[cat.id];
  }
  return buildIcon('all');
}

// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const { alerts, addAlert, updateAlert, safeCheckIns, addSafeCheckIn, locations } = useSafetyData();

  const [lang, setLang] = useState<Language>(() => {
    const stored = localStorage.getItem('guardian-lang') as Language;
    if (stored && ['en', 'ar', 'fr'].includes(stored)) return stored;
    return detectBrowserLanguage();
  });
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('guardian-theme') as Theme) || 'dark');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRouting, setShowRouting] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showIAmSafe, setShowIAmSafe] = useState(false);
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
  // Phase 11: Heatmap toggle
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [shelterOverrides, setShelterOverrides] = useState<Record<string, { occupancy: number; lastUpdated: number }>>(() => {
    try { const raw = localStorage.getItem('guardian-shelter-overrides'); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });
  const [verificationOverrides, setVerificationOverrides] = useState<Record<string, { confirms: number; disputes: number }>>(() => {
    try { const raw = localStorage.getItem('guardian-verification'); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';
  const btnPad = isRtl ? 'px-4' : 'px-3';

  useEffect(() => { localStorage.setItem('guardian-lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('guardian-theme', theme); }, [theme]);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]), () => {});
  }, []);
  useEffect(() => { const tm = setTimeout(() => window.dispatchEvent(new Event('resize')), 500); return () => clearTimeout(tm); }, []);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 3000); return () => clearTimeout(id); }, [toast]);

  useEffect(() => {
    if (activeCategory === 'all') { setMapCenter(LEBANON_CENTER); setMapZoom(DEFAULT_ZOOM); return; }
    const points = GUARDIAN_DATA[activeCategory];
    if (points && points.length > 0) {
      const avgLat = points.reduce((s, p) => s + p.coordinates[0], 0) / points.length;
      const avgLng = points.reduce((s, p) => s + p.coordinates[1], 0) / points.length;
      setMapCenter([avgLat, avgLng]); setMapZoom(points.length === 1 ? 13 : 10);
    }
  }, [activeCategory]);

  const markersToRender = activeCategory === 'all' ? ALL_MARKERS : (GUARDIAN_DATA[activeCategory] || []);
  const currentIcon = activeCategory !== 'all' ? (CATEGORY_ICONS[activeCategory] || buildIcon('all')) : buildIcon('all');

  const getEffectiveOccupancy = useCallback((marker: MarkerPoint) => {
    const ov = shelterOverrides[marker.id];
    return { occupancy: ov ? ov.occupancy : (marker.occupancy ?? 0), lastUpdated: ov ? ov.lastUpdated : (marker.lastUpdated ?? 0) };
  }, [shelterOverrides]);

  const handleShelterReport = useCallback((markerId: string, capacity: number, rt: 'space' | 'full') => {
    const newOcc = rt === 'space' ? Math.max(0, Math.round(capacity * 0.5)) : Math.min(capacity, Math.round(capacity * 0.97));
    const updated = { ...shelterOverrides, [markerId]: { occupancy: newOcc, lastUpdated: Date.now() } };
    setShelterOverrides(updated);
    try { localStorage.setItem('guardian-shelter-overrides', JSON.stringify(updated)); } catch {}
    setToast(rt === 'space' ? `✅ ${t.stillSpace}` : `⚠️ ${t.almostFull}`);
  }, [shelterOverrides, t]);

  const disputeOverrides = useMemo(() => {
    const map: Record<string, number> = {};
    [...AIRSTRIKES, ...ROAD_BLOCKS].forEach(m => {
      const base = m.disputeCount ?? 0; const ov = verificationOverrides[m.id];
      map[m.id] = base + (ov ? ov.disputes : 0);
    });
    return map;
  }, [verificationOverrides]);

  const handleConfirmReport = useCallback((markerId: string) => {
    const prev = verificationOverrides[markerId] || { confirms: 0, disputes: 0 };
    const updated = { ...verificationOverrides, [markerId]: { ...prev, confirms: prev.confirms + 1 } };
    setVerificationOverrides(updated);
    try { localStorage.setItem('guardian-verification', JSON.stringify(updated)); } catch {}
    setToast(t.contributionPoint);
  }, [verificationOverrides, t]);

  const handleDisputeReport = useCallback((markerId: string) => {
    const prev = verificationOverrides[markerId] || { confirms: 0, disputes: 0 };
    const updated = { ...verificationOverrides, [markerId]: { ...prev, disputes: prev.disputes + 1 } };
    setVerificationOverrides(updated);
    try { localStorage.setItem('guardian-verification', JSON.stringify(updated)); } catch {}
    setToast(t.disputeRecorded);
  }, [verificationOverrides, t]);

  const getVerificationData = useCallback((marker: MarkerPoint) => {
    const ov = verificationOverrides[marker.id] || { confirms: 0, disputes: 0 };
    const totalConfirms = (marker.verificationCount ?? 0) + ov.confirms;
    const totalDisputes = (marker.disputeCount ?? 0) + ov.disputes;
    const isUnverified = totalDisputes > DISPUTE_THRESHOLD;
    const trust = marker.trustScore ?? (totalConfirms > 0 ? Math.min(100, Math.round((totalConfirms / (totalConfirms + totalDisputes)) * 100)) : 0);
    return { totalConfirms, totalDisputes, isUnverified, trust };
  }, [verificationOverrides]);

  const searchResults = searchQuery.trim()
    ? locations.filter((l: any) => {
        const q = searchQuery.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.ar.includes(q) || (l.fr && l.fr.toLowerCase().includes(q));
      }).slice(0, 5) : [];

  const feedItems = (() => {
    let items = [...alerts];
    if (feedFilter === 'airstrikes') items = items.filter(a => a.type === 'danger' || a.type === 'airstrike');
    if (feedFilter === 'roads') items = items.filter(a => a.type === 'road_closure');
    return items.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);
  })();

  const ONE_HOUR = 3600000;
  const activeSafeDistricts = useMemo(() => {
    const now = Date.now();
    const dMap: Record<string, { count: number; latestAt: number }> = {};
    for (const ci of safeCheckIns) {
      if (now - ci.createdAt > ONE_HOUR) continue;
      if (!dMap[ci.districtId]) dMap[ci.districtId] = { count: 0, latestAt: ci.createdAt };
      dMap[ci.districtId].count++;
      if (ci.createdAt > dMap[ci.districtId].latestAt) dMap[ci.districtId].latestAt = ci.createdAt;
    }
    return dMap;
  }, [safeCheckIns]);

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
        const safe = coords.filter(c => { const near = dangerZones.some(dz => haversine(c, dz) < SAFETY_BUFFER_METERS); if (near) avoided++; return !near; });
        setRouteCoords(safe.length > 2 ? safe : coords);
        setRouteInfo({ duration: Math.round(data.routes[0].duration / 60), dangerAvoided: avoided });
        setToast(`✅ ${t.routeFound} — ${avoided} ${t.dangerAvoided}`);
      }
    } catch { setToast(t.routeError); }
    setIsRouting(false);
  }, [routeStart, routeEnd, t]);

  const submitReport = useCallback(() => {
    const dt = DANGER_TYPES[reportType];
    addAlert({ type: dt.type === 'road_closure' ? 'road_closure' : 'danger',
      location: `${t.userReport} — ${dt[lang as 'en' | 'ar' | 'fr']}`, districtId: 'beirut',
      message: reportDetails || dt[lang as 'en' | 'ar' | 'fr'], createdAt: Date.now(),
      coordinates: userLocation || LEBANON_CENTER, isUserReported: true });
    setShowReport(false); setReportDetails(''); setToast(t.submitted);
  }, [reportType, reportDetails, userLocation, addAlert, t, lang]);

  const handleIAmSafe = useCallback(() => {
    addSafeCheckIn(selectedDistrict);
    setToast(`💚 ${t.markedSafe} — ${DISTRICT_NAMES[selectedDistrict]?.[lang] || selectedDistrict}`);
    setShowIAmSafe(false);
  }, [selectedDistrict, addSafeCheckIn, t, lang]);

  const bg = isDark ? 'bg-[#121212]' : 'bg-white';
  const surface = isDark ? 'bg-[#1c1c1e]' : 'bg-gray-100';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500';
  const border = isDark ? 'border-white/10' : 'border-gray-200';

  const renderShelterPopup = (marker: MarkerPoint) => {
    const { occupancy: occ, lastUpdated: lu } = getEffectiveOccupancy(marker);
    const cap = marker.capacity ?? 0;
    const status = getShelterStatus(occ, cap);
    const pct = Math.round(status.percent * 100);
    const label = status.label === 'open' ? t.shelterOpen : status.label === 'limited' ? t.shelterLimited : t.shelterFull;
    return (
      <div className="text-xs min-w-[200px]">
        <strong className="block text-sm">{marker.name}</strong>
        {marker.aidType && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 inline-block mt-1">{marker.aidType}</span>}
        {cap > 0 && (<div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-[10px]">{t.shelterCapacity}</span>
            <span className="text-[10px] font-black" style={{ color: status.color }}>{label} — {pct}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: status.color }} /></div>
          <div className="flex justify-between mt-1 text-[9px] text-gray-500"><span>{t.occupancy}: {occ}/{cap}</span>{lu > 0 && <span>{t.lastUpdate}: {timeAgo(lu)}</span>}</div>
        </div>)}
        {marker.hours && <span className="block text-gray-400 mt-1">🕐 {marker.hours}</span>}
        {cap > 0 && (<div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-200">
          <button onClick={() => handleShelterReport(marker.id, cap, 'space')} className="flex-1 text-[9px] font-bold py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">👍 {t.stillSpace}</button>
          <button onClick={() => handleShelterReport(marker.id, cap, 'full')} className="flex-1 text-[9px] font-bold py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">🚫 {t.almostFull}</button>
        </div>)}
      </div>
    );
  };

  const renderVerifiablePopup = (marker: MarkerPoint) => {
    const vd = getVerificationData(marker);
    const trustColor = vd.trust >= 70 ? '#22c55e' : vd.trust >= 40 ? '#f97316' : '#ef4444';
    return (
      <div className="text-xs min-w-[200px]">
        <strong className="block text-sm">{marker.name}</strong>
        {marker.message && <p className="mt-1 text-gray-600">{marker.message}</p>}
        {vd.isUnverified && <div className="mt-1.5 px-2 py-1 rounded-lg bg-yellow-100 border border-yellow-400 text-yellow-800 text-[10px] font-black">{t.unverified}</div>}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1"><span className="font-bold text-[10px]">{t.trustScore}</span><span className="text-[10px] font-black" style={{ color: trustColor }}>{vd.trust}%</span></div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${vd.trust}%`, background: trustColor }} /></div>
          <div className="flex justify-between mt-1 text-[9px] text-gray-500"><span>✅ {vd.totalConfirms} {t.confirmations}</span><span>❌ {vd.totalDisputes} {t.disputes}</span></div>
        </div>
        {marker.verified && <span className="block mt-1 text-green-500 text-[10px]">{t.verified}</span>}
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-200">
          <button onClick={() => handleConfirmReport(marker.id)} className="flex-1 text-[9px] font-bold py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">✅ {t.confirmReport}</button>
          <button onClick={() => handleDisputeReport(marker.id)} className="flex-1 text-[9px] font-bold py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">❌ {t.disputeReport}</button>
        </div>
      </div>
    );
  };

  // Phase 11: Tile opacity — dim 20% when heatmap is active
  const tileOpacity = heatmapActive ? 0.8 : 1;

  return (
    <div className={`relative w-screen h-[100dvh] overflow-hidden ${bg} ${textMain}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <MapContainer center={LEBANON_CENTER} zoom={DEFAULT_ZOOM}
        style={{ height: '100dvh', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        maxBounds={LEBANON_BOUNDS} maxBoundsViscosity={0.8} zoomControl={false} attributionControl={false}>
        <MapController center={mapCenter} zoom={mapZoom} />
        <TileLayer url={isDark ? MAP_TILE_URL_DARK : MAP_TILE_URL_LIGHT} opacity={tileOpacity} />

        {/* Phase 11: Heatmap Layer */}
        <HeatmapLayer active={heatmapActive} />

        {userLocation && <Marker position={userLocation} icon={USER_ICON}><Popup><strong>📍 {t.shareLocation}</strong></Popup></Marker>}

        {markersToRender.map(marker => {
          const isNgo = SHELTER_ICONS[marker.id] != null;
          const isVerifiable = AIRSTRIKE_IDS.has(marker.id) || ROADBLOCK_IDS.has(marker.id);
          const disputes = disputeOverrides[marker.id] ?? 0;
          const isDimmed = isVerifiable && disputes > DISPUTE_THRESHOLD;
          const icon = (() => {
            if (isNgo) return SHELTER_ICONS[marker.id] || currentIcon;
            if (activeCategory === 'all') return resolveAllIcon(marker, disputeOverrides);
            return isDimmed ? buildIcon(FILTER_CATEGORIES.find(f => f.id === activeCategory)?.markerIcon || 'all', 36, 0.4) : currentIcon;
          })();
          return (
            <Marker key={marker.id} position={marker.coordinates} icon={icon}>
              <Popup>
                {isNgo && marker.capacity ? renderShelterPopup(marker)
                  : isVerifiable ? renderVerifiablePopup(marker)
                  : (<div className="text-xs min-w-[160px]">
                      <strong>{marker.name}</strong>
                      {marker.message && <p className="mt-1 text-gray-600">{marker.message}</p>}
                      {marker.status && <span className={`block mt-1 ${marker.status === 'open' ? 'text-green-600' : 'text-red-500'}`}>{marker.status === 'open' ? t.open : t.closed}</span>}
                      {marker.hours && <span className="block text-gray-400">🕐 {marker.hours}</span>}
                      {marker.phone && <a href={`tel:${marker.phone}`} className="block mt-1 text-blue-500 font-bold">📞 {marker.phone}</a>}
                      {marker.verified && <span className="block mt-1 text-green-500">{t.verified} ({marker.verificationCount})</span>}
                    </div>)}
              </Popup>
            </Marker>
          );
        })}

        {Object.entries(activeSafeDistricts).map(([districtId, { count }]) => {
          const coords = DISTRICT_COORDINATES[districtId]; if (!coords) return null;
          return (<Marker key={`safe-${districtId}`} position={coords} icon={buildSafePulseIcon(count)}><Popup>
            <div className="text-xs min-w-[140px] text-center">
              <strong className="text-green-600">💚 {t.communityPulse}</strong>
              <p className="mt-1 font-bold">{DISTRICT_NAMES[districtId]?.[lang] || districtId}</p>
              <p className="text-green-500 font-bold mt-0.5">{count} {t.recentSafe}</p>
            </div></Popup></Marker>);
        })}
        {routeCoords && <Polyline positions={routeCoords} pathOptions={{ color: '#3B82F6', weight: 4, dashArray: '10 6', opacity: 0.9 }} />}
      </MapContainer>

      {/* HEADER */}
      <div className={`absolute top-0 left-0 right-0 z-[1000] ${surface}/90 backdrop-blur-xl border-b ${border}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <h1 className="text-lg font-black tracking-tight text-red-500">🛡️ GUARDIAN</h1>
          <div className="flex items-center gap-2">
            {/* Phase 11: Heatmap toggle */}
            <button onClick={() => { setHeatmapActive(!heatmapActive); setToast(heatmapActive ? t.heatmapOff : t.heatmapActive); }}
              className={`text-[10px] ${btnPad} py-1 rounded-full font-bold transition-all ${heatmapActive ? 'bg-red-500/30 text-red-400 ring-1 ring-red-500/50' : isDark ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-500'}`}>
              🔥 {t.riskHeatmap}
            </button>
            {lowBandwidth && <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">{t.lowBandwidthActive}</span>}
            <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-sm z-[1002]">⚙️</button>
          </div>
        </div>
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTER_CATEGORIES.map(f => (
            <button key={f.id} onClick={() => setActiveCategory(f.id)}
              className={`flex items-center gap-1 ${btnPad} py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                activeCategory === f.id ? 'bg-red-500 text-white ring-2 ring-red-400 ring-offset-1 ring-offset-black shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              <span className="text-sm">{f.icon}</span> {f[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <div className="absolute top-[88px] left-3 right-3 z-[1000]">
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder}
          className={`w-full px-4 py-2.5 rounded-xl ${surface}/90 backdrop-blur-md ${textMain} placeholder:${textSub} border ${border} text-sm`} />
        {searchResults.length > 0 && (<div className={`mt-1 ${surface} rounded-xl border ${border} overflow-hidden shadow-2xl`}>
          {searchResults.map((r: any, i: number) => (
            <button key={i} onClick={() => { setMapCenter(r.coords); setMapZoom(14); setSearchQuery(''); }}
              className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm hover:bg-white/10 border-b ${border}`}>
              📍 {r.name} <span className={textSub}>— {r.ar}</span>
            </button>))}
        </div>)}
      </div>

      {/* BOTTOM BAR */}
      <div className={`absolute bottom-0 left-0 right-0 z-[999] ${surface}/90 backdrop-blur-xl border-t ${border}`}>
        <div className="flex justify-around py-2">
          {[{ icon: '🧭', label: t.safestPath, action: () => setShowRouting(true) },
            { icon: '🚨', label: t.reportDanger, action: () => setShowReport(true) },
            { icon: '📡', label: t.liveFeed, action: () => setShowFeed(true) }].map((btn, i) => (
            <button key={i} onClick={btn.action} className="flex flex-col items-center gap-0.5 text-[10px] font-semibold opacity-90 hover:opacity-100">
              <span className="text-xl">{btn.icon}</span><span className={textSub}>{btn.label}</span>
            </button>))}
          <button onClick={() => setShowIAmSafe(true)} className={`btn-safe-pulse flex flex-col items-center gap-0.5 text-[10px] font-bold text-green-400 ${isRtl ? 'min-w-[60px]' : ''}`}>
            <span className={`text-lg bg-green-500 text-white ${isRtl ? 'px-3' : 'px-2.5'} py-0.5 rounded-md font-black`}>✅ SAFE</span><span>{t.iAmSafe}</span>
          </button>
          <button onClick={() => setShowEmergency(true)} className={`flex flex-col items-center gap-0.5 text-[10px] font-bold text-red-400 ${isRtl ? 'min-w-[52px]' : ''}`}>
            <span className={`text-lg bg-red-500 text-white ${isRtl ? 'px-3' : 'px-2'} py-0.5 rounded-md font-black`}>SOS</span><span>{t.emergency}</span>
          </button>
        </div>
      </div>

      {toast && <div className="absolute top-[140px] left-1/2 -translate-x-1/2 z-[2000] bg-black/80 text-white text-sm px-4 py-2 rounded-xl backdrop-blur-md animate-pulse">{toast}</div>}

      {showRouting && (<div className={`absolute bottom-14 left-3 right-3 z-[1001] ${surface} rounded-2xl border ${border} p-4 shadow-2xl`}>
        <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-sm">🧭 {t.safestPath}</h3><button onClick={() => setShowRouting(false)} className="text-xs opacity-60">{t.close} ✕</button></div>
        <select value={routeStart} onChange={e => setRouteStart(e.target.value)} className={`w-full mb-2 p-2 rounded-lg text-sm ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100'} border ${border}`}>
          <option value="">{t.from}</option>{Object.entries(DISTRICT_NAMES).map(([d, names]) => <option key={d} value={d}>{names[lang]}</option>)}
        </select>
        <select value={routeEnd} onChange={e => setRouteEnd(e.target.value)} className={`w-full mb-3 p-2 rounded-lg text-sm ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100'} border ${border}`}>
          <option value="">{t.to}</option>{Object.entries(DISTRICT_NAMES).map(([d, names]) => <option key={d} value={d}>{names[lang]}</option>)}
        </select>
        <button onClick={calculateRoute} disabled={isRouting || !routeStart || !routeEnd} className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm disabled:opacity-40">{isRouting ? t.calculating : t.calculate}</button>
        {routeInfo && (<div className="mt-3 text-xs text-center"><span className="text-blue-400 font-bold">⏱ {routeInfo.duration} {t.minutes}</span><span className="mx-2">•</span><span className="text-red-400">⚠️ {routeInfo.dangerAvoided} {t.dangerAvoided}</span></div>)}
      </div>)}

      {showReport && (<div className="absolute inset-0 z-[2000] bg-black/60 flex items-end" onClick={() => setShowReport(false)}>
        <div className={`w-full max-w-md mx-auto ${surface} rounded-t-3xl p-5 border-t ${border}`} onClick={e => e.stopPropagation()}>
          <h3 className="text-base font-bold mb-4">🚨 {t.reportDanger}</h3>
          <label className="text-xs font-semibold mb-1 block">{t.reportType}</label>
          <div className="grid grid-cols-3 gap-2 mb-3">{DANGER_TYPES.map((dt, i) => (
            <button key={i} onClick={() => setReportType(i)} className={`p-2 rounded-xl text-center text-xs ${reportType === i ? 'bg-red-500/20 border-red-500 border' : `${isDark ? 'bg-white/5' : 'bg-gray-100'} border ${border}`}`}><span className="text-lg block">{dt.icon}</span>{dt[lang as 'en' | 'ar' | 'fr']}</button>))}</div>
          <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder={t.details} className={`w-full p-3 rounded-xl text-sm mb-3 ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100'} border ${border}`} rows={3} />
          <button onClick={submitReport} className="w-full py-3 rounded-xl bg-red-500 text-white font-bold">{t.submit}</button>
        </div></div>)}

      {showSettings && (<div className="absolute inset-0 z-[2000] bg-black/60" onClick={() => setShowSettings(false)}>
        <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-0 bottom-0 w-72 ${surface} ${isRtl ? 'border-r' : 'border-l'} ${border} p-5`} onClick={e => e.stopPropagation()}>
          <h3 className="text-base font-bold mb-5">⚙️ {t.settings}</h3>
          <label className="text-xs font-semibold mb-2 block">{t.language}</label>
          <div className="flex gap-2 mb-4">{(['en', 'ar', 'fr'] as const).map(l => (<button key={l} onClick={() => setLang(l)} className={`${isRtl ? 'px-4' : 'px-3'} py-1.5 rounded-lg text-xs font-bold ${lang === l ? 'bg-blue-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>{l === 'en' ? 'English' : l === 'ar' ? 'العربية' : 'Français'}</button>))}</div>
          <label className="text-xs font-semibold mb-2 block">{t.theme}</label>
          <div className="flex gap-2 mb-4">{(['dark', 'light'] as const).map(th => (<button key={th} onClick={() => setTheme(th)} className={`${isRtl ? 'px-4' : 'px-3'} py-1.5 rounded-lg text-xs font-bold ${theme === th ? 'bg-blue-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>{th === 'dark' ? t.dark : t.light}</button>))}</div>
          {[{ label: t.lowPower, state: lowPower, setter: setLowPower }].map((tog, i) => (
            <div key={i} className="flex items-center justify-between mb-3"><span className="text-xs font-semibold">{tog.label}</span>
              <button onClick={() => tog.setter(!tog.state)} className={`w-10 h-5 rounded-full transition-colors ${tog.state ? 'bg-green-500' : 'bg-gray-500'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${tog.state ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></div>))}
          <button onClick={() => { setShowQR(true); setShowSettings(false); }} className="w-full mt-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold">📱 {t.shareQR}</button>
          <button onClick={() => { addSafeCheckIn('beirut'); setToast(t.markedSafe); }} className="w-full mt-2 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold">{t.iAmSafe}</button>
        </div></div>)}

      {showIAmSafe && (<div className="absolute inset-0 z-[2000] bg-black/60 flex items-end" onClick={() => setShowIAmSafe(false)}>
        <div className={`w-full max-w-md mx-auto ${surface} rounded-t-3xl p-5 border-t ${border}`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="safe-pulse-icon w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500"><span className="text-2xl">💚</span></div>
            <div><h3 className="text-base font-black text-green-400">{t.iAmSafe}</h3><p className="text-[11px] opacity-60">{t.iAmSafeDesc}</p></div>
          </div>
          <label className="text-xs font-semibold mb-2 block">{t.selectDistrict}</label>
          <div className="grid grid-cols-2 gap-2 mb-4 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {Object.entries(DISTRICT_NAMES).map(([id, names]) => (
              <button key={id} onClick={() => setSelectedDistrict(id)} className={`p-2.5 rounded-xl text-xs font-bold text-center transition-all ${selectedDistrict === id ? 'bg-green-500/20 border-green-500 border-2 text-green-400 ring-1 ring-green-400/30' : `${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} border ${border}`}`}>
                <span className="block text-sm mb-0.5">{names[lang]}</span>
                {activeSafeDistricts[id] && <span className="text-[9px] text-green-500">💚 {activeSafeDistricts[id].count} {t.safeLabel}</span>}
              </button>))}
          </div>
          {Object.keys(activeSafeDistricts).length > 0 && (<div className={`mb-4 p-3 rounded-xl ${isDark ? 'bg-green-500/5' : 'bg-green-50'} border border-green-500/20`}>
            <p className="text-[10px] font-bold text-green-500 mb-1">💚 {t.communityPulse}</p>
            <div className="flex flex-wrap gap-1">{Object.entries(activeSafeDistricts).map(([dId, { count }]) => (<span key={dId} className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400">{DISTRICT_NAMES[dId]?.[lang] || dId} ({count})</span>))}</div>
          </div>)}
          <button onClick={handleIAmSafe} className="btn-safe-pulse w-full py-3.5 rounded-xl bg-green-500 text-white font-black text-sm tracking-wide hover:bg-green-600 transition-colors">💚 {t.safeNow} — {DISTRICT_NAMES[selectedDistrict]?.[lang] || selectedDistrict}</button>
        </div></div>)}

      {showFeed && (<div className="absolute inset-0 z-[2000] bg-black/60" onClick={() => setShowFeed(false)}>
        <div className={`absolute bottom-0 left-0 right-0 max-h-[70vh] ${surface} rounded-t-3xl border-t ${border} overflow-hidden`} onClick={e => e.stopPropagation()}>
          <div className="p-4 border-b border-white/5">
            <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-sm">📡 {t.liveFeed}</h3><button onClick={() => setShowFeed(false)} className="text-xs opacity-60">{t.close} ✕</button></div>
            <div className="flex gap-2">{([['all', t.feedAll], ['airstrikes', t.feedAirstrikes], ['roads', t.feedRoads], ['community', t.communityTab]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFeedFilter(key as any)} className={`${btnPad} py-1 rounded-full text-[10px] font-bold ${feedFilter === key ? key === 'community' ? 'bg-green-500 text-white' : 'bg-red-500 text-white' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}>{key === 'community' ? `💚 ${label}` : label}</button>))}</div>
          </div>
          <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
            {feedFilter === 'community' ? (
              safeCheckIns.length > 0 ? safeCheckIns.slice(0, 30).map(ci => (
                <div key={ci.id} className={`p-3 rounded-xl ${isDark ? 'bg-green-500/5' : 'bg-green-50'} border border-green-500/20`}>
                  <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-sm">💚</span><span className="text-xs font-bold">{ci.userId} <span className="font-normal opacity-70">{t.communityCheckIn}</span>{' '}<span className="text-green-400 font-bold">{DISTRICT_NAMES[ci.districtId]?.[lang] || ci.districtId}</span></span></div><span className="text-[10px] opacity-50">{timeAgo(ci.createdAt)}</span></div>
                </div>)) : <div className="text-center py-8 opacity-40 text-sm">{t.noCheckIns}</div>
            ) : feedItems.map(item => (
              <div key={item.id} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} border ${border}`}>
                <div className="flex justify-between items-start"><div><span className="text-xs font-bold">{item.type === 'road_closure' ? '🚧' : '💥'} {item.location}</span><p className="text-[10px] mt-0.5 opacity-70">{item.message}</p></div><span className="text-[10px] opacity-50">{timeAgo(item.createdAt)}</span></div>
                {item.verified && <span className="text-[9px] text-green-400 mt-1 block">{t.verified} • {item.verificationCount} {t.votes}</span>}
                {(item.type === 'road_closure' || item.type === 'danger') && (<div className="flex gap-2 mt-2">
                  <button onClick={() => updateAlert(item.id, { verificationCount: (item.verificationCount || 0) + 1 })} className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400">✅ {t.confirmReport}</button>
                  <button onClick={() => updateAlert(item.id, { verificationCount: Math.max(0, (item.verificationCount || 0) - 1) })} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">❌ {t.disputeReport}</button>
                </div>)}
              </div>))}
          </div>
        </div></div>)}

      {showEmergency && (<div className="absolute inset-0 z-[2001] bg-black/70" onClick={() => setShowEmergency(false)}>
        <div className={`absolute bottom-0 left-0 right-0 ${surface} rounded-t-3xl border-t ${border} p-5`} onClick={e => e.stopPropagation()}>
          <h3 className="text-base font-bold mb-4 text-red-400">🆘 {t.sosTitle}</h3>
          <div className="grid grid-cols-2 gap-3">{EMERGENCY_CONTACTS.map((c, i) => (
            <a key={i} href={`tel:${c.number}`} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'} border ${border}`}>
              <span className="text-2xl" style={{ filter: `drop-shadow(0 0 4px ${c.color})` }}>{c.icon}</span>
              <div><span className="text-xs font-bold block">{c[lang as 'en' | 'ar' | 'fr']}</span><span className="text-lg font-black" style={{ color: c.color }}>{c.number}</span></div>
            </a>))}</div>
        </div></div>)}

      {showQR && (<div className="absolute inset-0 z-[2000] bg-black/70 flex items-center justify-center" onClick={() => setShowQR(false)}>
        <div className={`${surface} rounded-2xl p-6 border ${border} text-center`} onClick={e => e.stopPropagation()}>
          <h3 className="font-bold mb-3">📱 {t.shareQR}</h3>
          <QRCodeSVG value={`https://maps.google.com/?q=${userLocation?.[0] || LEBANON_CENTER[0]},${userLocation?.[1] || LEBANON_CENTER[1]}`} size={180} />
          <p className="text-xs mt-3 opacity-60">{t.shareLocation}</p>
        </div></div>)}
    </div>
  );
}
