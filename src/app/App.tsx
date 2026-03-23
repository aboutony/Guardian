import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Drawer } from 'vaul';
import { AlertTriangle, Navigation } from 'lucide-react';
import { TacticalMap } from './components/tactical-map';
import { FloatingHeader } from './components/floating-header';
import { HospitalSheet } from './components/hospital-sheet';
import { FamilySafetyCircle } from './components/family-safety-circle';
import { BottomNavigation } from './components/bottom-navigation';
import { Settings } from './components/settings';
import { GUARDIAN_DATA, MAP_DEFAULT_CENTER } from '../constants';
import { type Lang, t, applyDirection } from './i18n';

// ═══════════════════════════════════════════════════════════════
// DATA EXTRACTION
// ═══════════════════════════════════════════════════════════════

function extractAllResources(): any[] {
  const gd = GUARDIAN_DATA as any;
  if (!gd) return [];
  if (Array.isArray(gd)) return gd;
  const all: any[] = [];
  for (const key of Object.keys(gd)) {
    const val = gd[key];
    if (Array.isArray(val)) {
      for (const item of val) all.push({ ...item, _sourceKey: key });
    }
  }
  return all;
}

function guessCategory(item: any): string {
  if (item.category) return item.category;
  const sk = (item._sourceKey || '').toLowerCase();
  if (sk.includes('hospital')) return 'hospital';
  if (sk.includes('baker')) return 'bakery';
  if (sk.includes('pharmac')) return 'pharmacy';
  if (sk.includes('ngo')) return 'ngo';
  if (sk.includes('shelter')) return 'shelter';
  if (sk.includes('water')) return 'water_point';
  if (sk.includes('fuel')) return 'fuel_station';
  if (sk.includes('danger') || sk.includes('airstrike') || sk.includes('alert') || sk.includes('roadblock')) return 'danger';
  return 'hospital';
}

function guessType(cat: string): 'hospital' | 'shelter' | 'danger' | 'safe-zone' {
  if (cat === 'hospital') return 'hospital';
  if (cat === 'shelter' || cat === 'ngo') return 'shelter';
  if (cat === 'danger' || cat === 'airstrike' || cat === 'roadblock') return 'danger';
  return 'safe-zone';
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════
// TRUST ENGINE
// ═══════════════════════════════════════════════════════════════

interface VoteReport { locationId: string; vote: 'up' | 'down'; timestamp: string; }

function loadReports(): VoteReport[] {
  try { return JSON.parse(localStorage.getItem('guardian_reports') || '[]'); } catch { return []; }
}
function saveReports(reports: VoteReport[]) {
  try { localStorage.setItem('guardian_reports', JSON.stringify(reports)); } catch {}
}

function calculateTrustScore(locationId: string, reports: VoteReport[]) {
  const now = Date.now();
  const THREE_H = 3 * 3600000, TWELVE_H = 12 * 3600000;
  let wUp = 0, wTotal = 0, up = 0, down = 0, lastTs = '';
  for (const r of reports.filter((r) => r.locationId === locationId)) {
    const age = now - new Date(r.timestamp).getTime();
    if (age > TWELVE_H) continue;
    const w = age < THREE_H ? 2 : 1;
    if (r.vote === 'up') { wUp += w; up++; } else { down++; }
    wTotal += w;
    if (!lastTs || r.timestamp > lastTs) lastTs = r.timestamp;
  }
  const trustScore = wTotal > 0 ? Math.round((wUp / wTotal) * 100) : -1;
  const lastReported = lastTs ? `${Math.round((now - new Date(lastTs).getTime()) / 60000)} min ago` : '';
  return { trustScore, upvotes: up, downvotes: down, totalReports: up + down, lastReported };
}

// ═══════════════════════════════════════════════════════════════

const FAMILY_MEMBERS = [
  { id: 'f1', name: 'Sarah Chen', avatar: 'S', batteryLevel: 85, lastSeen: '2 min ago', status: 'safe' as const, location: 'Home — 1.2 km' },
  { id: 'f2', name: 'Michael Johnson', avatar: 'M', batteryLevel: 45, lastSeen: '5 min ago', status: 'warning' as const, location: 'Downtown — 3.5 km' },
  { id: 'f3', name: 'Emma Williams', avatar: 'E', batteryLevel: 92, lastSeen: '1 min ago', status: 'safe' as const, location: 'Park — 1.8 km' },
  { id: 'f4', name: 'David Martinez', avatar: 'D', batteryLevel: 15, lastSeen: '15 min ago', status: 'warning' as const, location: 'Harbor — 4.2 km' },
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showFamilyCircle, setShowFamilyCircle] = useState(false);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'safe' | 'settings'>('map');
  const [userLat, setUserLat] = useState(33.8938);
  const [userLng, setUserLng] = useState(35.5018);
  const [alertPulsing, setAlertPulsing] = useState(false);
  const [reports, setReports] = useState<VoteReport[]>(loadReports());

  // ═══ V5: LANGUAGE & BLACKOUT STATE ═══
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('guardian_lang') as Lang) || 'en'; } catch { return 'en'; }
  });
  const [blackout, setBlackout] = useState(() => {
    try { return localStorage.getItem('guardian_blackout') === 'true'; } catch { return false; }
  });

  // Apply RTL direction when language changes
  useEffect(() => {
    applyDirection(lang);
    try { localStorage.setItem('guardian_lang', lang); } catch {}
  }, [lang]);

  // Apply blackout class to body
  useEffect(() => {
    if (blackout) {
      document.body.classList.add('blackout-mode');
    } else {
      document.body.classList.remove('blackout-mode');
    }
    try { localStorage.setItem('guardian_blackout', String(blackout)); } catch {}
  }, [blackout]);

  const handleLangChange = useCallback((newLang: Lang) => setLang(newLang), []);
  const handleBlackoutToggle = useCallback(() => setBlackout((prev) => !prev), []);

  // ── Data ──
  const allItems = useMemo(() => extractAllResources(), []);

  const allLocations = useMemo(() => {
    return allItems.map((item) => {
      const cat = guessCategory(item);
      const type = guessType(cat);
      const id = item.id || `item-${Math.random()}`;
      const trust = calculateTrustScore(id, reports);
      const baseSafety = item.verificationCount ? Math.min(99, 60 + item.verificationCount * 3) : 80;
      return {
        id, name: item.name || item.description || 'Unknown', type, category: cat,
        lat: item.lat ?? item.latitude ?? 33.89, lng: item.lng ?? item.longitude ?? 35.50,
        safetyScore: baseSafety, trustScore: trust.trustScore >= 0 ? trust.trustScore : baseSafety,
        verifiedBy: item.verificationCount || 0, upvotes: trust.upvotes, downvotes: trust.downvotes,
        lastReported: trust.lastReported,
        status: (item.isOperational !== false ? 'open' : 'closed') as 'open' | 'closed',
        distance: item.radiusKm ? `${item.radiusKm} km radius` : '', eta: '',
        address: item.address || '', phone: item.phone || '',
        services: [t(lang, cat) || cat, item.operatingHours || ''].filter(Boolean),
        severity: item.severity, radiusKm: item.radiusKm,
      };
    });
  }, [allItems, reports, lang]);

  const dangersSorted = useMemo(() => {
    return allLocations.filter((l) => l.type === 'danger')
      .map((d) => ({ ...d, dist: distanceKm(userLat, userLng, d.lat, d.lng) }))
      .sort((a, b) => a.dist - b.dist);
  }, [allLocations, userLat, userLng]);
  const dangerCount = dangersSorted.length;

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => {}, { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  useEffect(() => {
    const nearby = dangersSorted.some((d) => d.dist <= 5);
    if (nearby && !alertPulsing) { setAlertPulsing(true); try { navigator.vibrate([300, 200, 300]); } catch {} }
    else if (!nearby) setAlertPulsing(false);
  }, [dangersSorted, alertPulsing]);

  const center = useMemo(() => {
    try { if (Array.isArray(MAP_DEFAULT_CENTER)) return { lat: MAP_DEFAULT_CENTER[0], lng: MAP_DEFAULT_CENTER[1] }; } catch {}
    return { lat: 33.8938, lng: 35.5018 };
  }, []);

  const handleVote = useCallback((locationId: string, vote: 'up' | 'down') => {
    const report: VoteReport = { locationId, vote, timestamp: new Date().toISOString() };
    setReports((prev) => { const updated = [report, ...prev]; saveReports(updated); return updated; });
  }, []);

  const handleSOSPress = useCallback(() => {
    try { localStorage.setItem('guardian_last_sos', new Date().toISOString()); } catch {}
  }, []);

  const addSafeCheckIn = useCallback(() => {
    const ts = new Date().toISOString();
    try { const e = JSON.parse(localStorage.getItem('guardian_safe_checkins') || '[]'); e.unshift(ts); localStorage.setItem('guardian_safe_checkins', JSON.stringify(e.slice(0, 50))); localStorage.setItem('guardian_family_last_safe', ts); } catch {}
    setShowFamilyCircle(true);
  }, []);

  const handleStartRoute = useCallback((location: any) => {
    const d = distanceKm(userLat, userLng, location.lat, location.lng);
    alert(`🧭 ${t(lang, 'start_route')}\n\n${location.name}\nTrust: ${location.trustScore}%\n${t(lang, 'distance')}: ${d.toFixed(1)} km`);
    setSelectedLocation(null);
  }, [userLat, userLng, lang]);

  const handleTabChange = useCallback((tab: 'map' | 'alerts' | 'safe' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'map') { setSelectedLocation(null); setShowFamilyCircle(false); setShowAlertsDrawer(false); setShowSettings(false); }
    else if (tab === 'safe') { addSafeCheckIn(); }
    else if (tab === 'alerts') { setShowAlertsDrawer(true); }
    else if (tab === 'settings') { setShowSettings(true); }
  }, [addSafeCheckIn]);

  return (
    <div className={`relative w-full h-screen overflow-hidden ${blackout ? 'blackout-mode' : ''}`}
         style={{ backgroundColor: blackout ? '#000000' : '#05070A' }}>
      <TacticalMap locations={allLocations} userLocation={center} onLocationSelect={setSelectedLocation} blackout={blackout} />
      <FloatingHeader batterySaver={true} batteryLevel={73} onSOSPress={handleSOSPress} lang={lang} blackout={blackout} onBlackoutToggle={handleBlackoutToggle} />
      <HospitalSheet location={selectedLocation} onClose={() => setSelectedLocation(null)} onStartRoute={handleStartRoute} onVote={handleVote} lang={lang} blackout={blackout} />
      <FamilySafetyCircle isOpen={showFamilyCircle} onClose={() => setShowFamilyCircle(false)} members={FAMILY_MEMBERS} />
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} alertCount={dangerCount} alertPulsing={alertPulsing} lang={lang} blackout={blackout} />
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} lang={lang} onLangChange={handleLangChange} blackout={blackout} onBlackoutToggle={handleBlackoutToggle} />

      {/* Vaul Alerts Drawer */}
      <Drawer.Root open={showAlertsDrawer} onOpenChange={setShowAlertsDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto focus:outline-none">
            <div className={`rounded-t-3xl shadow-2xl ${blackout ? 'bg-black border-t border-[#333]' : 'backdrop-blur-2xl bg-[#05070A]/95 border-t border-white/10'}`}>
              <div className="flex justify-center pt-3 pb-2"><div className={`w-12 h-1.5 rounded-full ${blackout ? 'bg-[#333]' : 'bg-white/20'}`} /></div>
              <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
                <Drawer.Title className="text-white text-xl mb-1" style={{ fontWeight: 700 }}>{t(lang, 'active_alerts')}</Drawer.Title>
                <p className="text-white/60 text-sm mb-4">{dangerCount} {t(lang, 'danger_zones_sorted')}</p>
                <div className="space-y-3">
                  {dangersSorted.map((dz) => {
                    const isNear = dz.dist <= 5;
                    return (
                      <button key={dz.id} onClick={() => { setSelectedLocation(dz); setShowAlertsDrawer(false); }}
                        className={`w-full text-left rounded-2xl p-4 hover:bg-white/10 transition-all ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}
                        style={isNear ? { borderColor: '#FF3B3B40' } : {}}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${isNear ? 'animate-pulse' : ''}`}
                               style={{ backgroundColor: '#FF3B3B20', borderColor: '#FF3B3B', boxShadow: isNear ? '0 0 20px #FF3B3B60' : 'none' }}>
                            <AlertTriangle className="w-5 h-5 text-[#FF3B3B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white text-sm" style={{ fontWeight: 600 }}>{dz.name}</span>
                              {isNear && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF3B3B]/20 text-[#FF3B3B] border border-[#FF3B3B]/40" style={{ fontWeight: 700 }}>{t(lang, 'nearby')}</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/50">
                              <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{dz.dist.toFixed(1)} {t(lang, 'km_away')}</span>
                              {dz.severity && <span className="uppercase">{dz.severity}</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
