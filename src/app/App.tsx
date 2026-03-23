import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Drawer } from 'vaul';
import { AlertTriangle, Navigation } from 'lucide-react';
import { TacticalMap } from './components/tactical-map';
import { FloatingHeader } from './components/floating-header';
import { HospitalSheet } from './components/hospital-sheet';
import { FamilySafetyCircle } from './components/family-safety-circle';
import { BottomNavigation } from './components/bottom-navigation';
import { GUARDIAN_DATA, MAP_DEFAULT_CENTER } from '../constants';

// ═══════════════════════════════════════════════════════════════
// DATA EXTRACTION — bulletproof Object.keys() approach
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

// ── Haversine distance (km) ──
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════

const FAMILY_MEMBERS = [
  { id: 'f1', name: 'Sarah Chen', avatar: 'S', batteryLevel: 85, lastSeen: '2 min ago', status: 'safe' as const, location: 'Home — 1.2 km away' },
  { id: 'f2', name: 'Michael Johnson', avatar: 'M', batteryLevel: 45, lastSeen: '5 min ago', status: 'warning' as const, location: 'Downtown — 3.5 km' },
  { id: 'f3', name: 'Emma Williams', avatar: 'E', batteryLevel: 92, lastSeen: '1 min ago', status: 'safe' as const, location: 'Central Park — 1.8 km' },
  { id: 'f4', name: 'David Martinez', avatar: 'D', batteryLevel: 15, lastSeen: '15 min ago', status: 'warning' as const, location: 'Harbor — 4.2 km' },
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showFamilyCircle, setShowFamilyCircle] = useState(false);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'safe' | 'settings'>('map');
  const [userLat, setUserLat] = useState(33.8938);
  const [userLng, setUserLng] = useState(35.5018);
  const [alertPulsing, setAlertPulsing] = useState(false);

  // ── Extract all items from GUARDIAN_DATA ──
  const allItems = useMemo(() => extractAllResources(), []);

  const allLocations = useMemo(() => {
    return allItems.map((item) => {
      const cat = guessCategory(item);
      const type = guessType(cat);
      return {
        id: item.id || `item-${Math.random()}`,
        name: item.name || item.description || 'Unknown',
        type,
        category: cat,
        lat: item.lat ?? item.latitude ?? 33.89,
        lng: item.lng ?? item.longitude ?? 35.50,
        safetyScore: item.verificationCount ? Math.min(99, 60 + item.verificationCount * 3) : 80,
        verifiedBy: item.verificationCount || 0,
        status: (item.isOperational !== false ? 'open' : 'closed') as 'open' | 'closed',
        distance: item.radiusKm ? `${item.radiusKm} km radius` : '',
        eta: '',
        address: item.address || '',
        phone: item.phone || '',
        services: [cat, item.operatingHours || ''].filter(Boolean),
        severity: item.severity,
        radiusKm: item.radiusKm,
      };
    });
  }, [allItems]);

  // ── Danger zones sorted by proximity to user ──
  const dangersSorted = useMemo(() => {
    return allLocations
      .filter((l) => l.type === 'danger')
      .map((d) => ({ ...d, dist: distanceKm(userLat, userLng, d.lat, d.lng) }))
      .sort((a, b) => a.dist - b.dist);
  }, [allLocations, userLat, userLng]);

  const dangerCount = dangersSorted.length;

  // ═══════════════════════════════════════════════════════════
  // DANGER PROXIMITY: if user is within 5km of any danger zone
  // → haptic vibrate + pulse the Alerts badge
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Get live user location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => {},
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  useEffect(() => {
    const nearby = dangersSorted.some((d) => d.dist <= 5);
    if (nearby && !alertPulsing) {
      setAlertPulsing(true);
      try { navigator.vibrate([300, 200, 300]); } catch {}
    } else if (!nearby && alertPulsing) {
      setAlertPulsing(false);
    }
  }, [dangersSorted, alertPulsing]);

  // ── Map center ──
  const center = useMemo(() => {
    try {
      if (Array.isArray(MAP_DEFAULT_CENTER)) return { lat: MAP_DEFAULT_CENTER[0], lng: MAP_DEFAULT_CENTER[1] };
    } catch {}
    return { lat: 33.8938, lng: 35.5018 };
  }, []);

  // ── SOS ──
  const handleSOSPress = useCallback(() => {
    // FloatingHeader handles geolocation + POST + tel:125 internally
    // We broadcast to family circle here
    try {
      const ts = new Date().toISOString();
      localStorage.setItem('guardian_last_sos', ts);
    } catch {}
  }, []);

  // ── Safe Check-in ──
  const addSafeCheckIn = useCallback(() => {
    const ts = new Date().toISOString();
    try {
      const existing = JSON.parse(localStorage.getItem('guardian_safe_checkins') || '[]');
      existing.unshift(ts);
      localStorage.setItem('guardian_safe_checkins', JSON.stringify(existing.slice(0, 50)));
      // Update family_members table (localStorage simulation)
      localStorage.setItem('guardian_family_last_safe', ts);
    } catch {}
    setShowFamilyCircle(true);
  }, []);

  // ── Route ──
  const handleStartRoute = useCallback((location: any) => {
    const d = distanceKm(userLat, userLng, location.lat, location.lng);
    alert(`🧭 Route to ${location.name}\n\nSafety: ${location.safetyScore}%\nDistance: ${d.toFixed(1)} km\nVerified by: ${location.verifiedBy} users`);
    setSelectedLocation(null);
  }, [userLat, userLng]);

  // ── Tab handler ──
  const handleTabChange = useCallback((tab: 'map' | 'alerts' | 'safe' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'map') { setSelectedLocation(null); setShowFamilyCircle(false); setShowAlertsDrawer(false); }
    else if (tab === 'safe') { addSafeCheckIn(); }
    else if (tab === 'alerts') { setShowAlertsDrawer(true); }
    else if (tab === 'settings') {
      alert('⚙️ Settings\n\n• Emergency contacts\n• Language (EN / AR / FR)\n• Light / Dark mode');
    }
  }, [addSafeCheckIn]);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#05070A' }}>
      {/* 1. MAP */}
      <TacticalMap
        locations={allLocations}
        userLocation={center}
        onLocationSelect={setSelectedLocation}
      />

      {/* 2. HEADER */}
      <FloatingHeader batterySaver={true} batteryLevel={73} onSOSPress={handleSOSPress} />

      {/* 3. HOSPITAL SHEET */}
      <HospitalSheet
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onStartRoute={handleStartRoute}
      />

      {/* 4. FAMILY CIRCLE */}
      <FamilySafetyCircle
        isOpen={showFamilyCircle}
        onClose={() => setShowFamilyCircle(false)}
        members={FAMILY_MEMBERS}
      />

      {/* 5. BOTTOM NAV */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertCount={dangerCount}
        alertPulsing={alertPulsing}
      />

      {/* ═══ 6. VAUL ALERTS DRAWER ═══ */}
      <Drawer.Root open={showAlertsDrawer} onOpenChange={setShowAlertsDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto focus:outline-none">
            <div className="backdrop-blur-2xl bg-[#05070A]/95 border-t border-white/10 rounded-t-3xl shadow-2xl">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Drawer.Title className="text-white text-xl" style={{ fontWeight: 700 }}>
                      ⚠️ Active Alerts
                    </Drawer.Title>
                    <p className="text-white/60 text-sm mt-1">
                      {dangerCount} danger zones — sorted by proximity
                    </p>
                  </div>
                </div>

                {/* Danger Zone List */}
                <div className="space-y-3">
                  {dangersSorted.map((dz, i) => {
                    const isNear = dz.dist <= 5;
                    return (
                      <button
                        key={dz.id}
                        onClick={() => { setSelectedLocation(dz); setShowAlertsDrawer(false); }}
                        className="w-full text-left backdrop-blur-xl bg-white/5 border rounded-2xl p-4 
                                 hover:bg-white/10 transition-all"
                        style={{ borderColor: isNear ? '#FF3B3B40' : 'rgba(255,255,255,0.1)' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                        border-2 flex-shrink-0 ${isNear ? 'animate-pulse' : ''}`}
                               style={{
                                 backgroundColor: '#FF3B3B20',
                                 borderColor: '#FF3B3B',
                                 boxShadow: isNear ? '0 0 20px #FF3B3B60' : 'none',
                               }}>
                            <AlertTriangle className="w-5 h-5 text-[#FF3B3B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white text-sm" style={{ fontWeight: 600 }}>
                                {dz.name}
                              </span>
                              {isNear && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF3B3B]/20 text-[#FF3B3B] border border-[#FF3B3B]/40"
                                      style={{ fontWeight: 700 }}>
                                  NEARBY
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/50">
                              <div className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                <span>{dz.dist.toFixed(1)} km away</span>
                              </div>
                              {dz.severity && (
                                <span className="uppercase">{dz.severity}</span>
                              )}
                              {dz.radiusKm && (
                                <span>{dz.radiusKm} km radius</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {dangersSorted.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">✅</div>
                      <p className="text-white/60">No active danger zones nearby</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
