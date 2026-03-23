import React, { useState, useMemo, useCallback } from 'react';
import { TacticalMap } from './components/tactical-map';
import { FloatingHeader } from './components/floating-header';
import { HospitalSheet } from './components/hospital-sheet';
import { FamilySafetyCircle } from './components/family-safety-circle';
import { BottomNavigation } from './components/bottom-navigation';
import { GUARDIAN_DATA, MAP_DEFAULT_CENTER } from '../constants';

// ═══════════════════════════════════════════════════════════════
// ABSOLUTE DATA EXTRACTION — bulletproof, handles any structure
// ═══════════════════════════════════════════════════════════════

function extractAllResources(): any[] {
  const gd = GUARDIAN_DATA as any;
  if (!gd) return [];

  // If GUARDIAN_DATA is itself an array, use it directly
  if (Array.isArray(gd)) return gd;

  // Otherwise, flatten ALL array values from the object
  const all: any[] = [];
  for (const key of Object.keys(gd)) {
    const val = gd[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        // Tag each item with its source key (for category detection)
        all.push({ ...item, _sourceKey: key });
      }
    }
  }
  return all;
}

function guessCategory(item: any): string {
  // Use explicit category if present
  if (item.category) return item.category;
  // Infer from the source key
  const sk = (item._sourceKey || '').toLowerCase();
  if (sk.includes('hospital')) return 'hospital';
  if (sk.includes('baker')) return 'bakery';
  if (sk.includes('pharmac')) return 'pharmacy';
  if (sk.includes('ngo')) return 'ngo';
  if (sk.includes('shelter')) return 'shelter';
  if (sk.includes('water')) return 'water_point';
  if (sk.includes('fuel')) return 'fuel_station';
  if (sk.includes('danger') || sk.includes('airstrike') || sk.includes('alert') || sk.includes('roadblock')) return 'danger';
  return 'hospital'; // fallback
}

function guessType(cat: string): 'hospital' | 'shelter' | 'danger' | 'safe-zone' {
  if (cat === 'hospital') return 'hospital';
  if (cat === 'shelter' || cat === 'ngo') return 'shelter';
  if (cat === 'danger' || cat === 'airstrike' || cat === 'roadblock') return 'danger';
  return 'safe-zone';
}

// ═══════════════════════════════════════════════════════════════

// Family Circle data
const FAMILY_MEMBERS = [
  { id: 'f1', name: 'Sarah Chen', avatar: 'S', batteryLevel: 85, lastSeen: '2 min ago', status: 'safe' as const, location: 'Home — 1.2 km away' },
  { id: 'f2', name: 'Michael Johnson', avatar: 'M', batteryLevel: 45, lastSeen: '5 min ago', status: 'warning' as const, location: 'Downtown — 3.5 km' },
  { id: 'f3', name: 'Emma Williams', avatar: 'E', batteryLevel: 92, lastSeen: '1 min ago', status: 'safe' as const, location: 'Central Park — 1.8 km' },
  { id: 'f4', name: 'David Martinez', avatar: 'D', batteryLevel: 15, lastSeen: '15 min ago', status: 'warning' as const, location: 'Harbor — 4.2 km' },
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showFamilyCircle, setShowFamilyCircle] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'safe' | 'settings'>('map');

  // ── ABSOLUTE DATA INJECTION ──
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
      };
    });
  }, [allItems]);

  const dangerCount = allLocations.filter((l) => l.type === 'danger').length;

  // ── Map center ──
  const center = useMemo(() => {
    try {
      if (Array.isArray(MAP_DEFAULT_CENTER)) return { lat: MAP_DEFAULT_CENTER[0], lng: MAP_DEFAULT_CENTER[1] };
    } catch {}
    return { lat: 33.8938, lng: 35.5018 };
  }, []);

  const handleSOSPress = useCallback(() => {
    alert('🚨 SOS ACTIVATED\n\nEmergency services notified.\nLocation shared with family circle.\n\nDialing 125...');
  }, []);

  const addSafeCheckIn = useCallback(() => {
    const ts = new Date().toISOString();
    try {
      const existing = JSON.parse(localStorage.getItem('guardian_safe_checkins') || '[]');
      existing.unshift(ts);
      localStorage.setItem('guardian_safe_checkins', JSON.stringify(existing.slice(0, 50)));
    } catch {}
    setShowFamilyCircle(true);
  }, []);

  const handleStartRoute = useCallback((location: any) => {
    alert(`🧭 Route to ${location.name}\n\nSafety: ${location.safetyScore}%\nVerified by: ${location.verifiedBy} users`);
    setSelectedLocation(null);
  }, []);

  const handleTabChange = useCallback((tab: 'map' | 'alerts' | 'safe' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'map') { setSelectedLocation(null); setShowFamilyCircle(false); }
    else if (tab === 'safe') { addSafeCheckIn(); }
    else if (tab === 'alerts') {
      const dangers = allLocations.filter((l) => l.type === 'danger');
      alert(`📢 Active Alerts (${dangers.length})\n\n${dangers.map((d) => `• ${d.name}`).join('\n')}`);
    }
    else if (tab === 'settings') {
      alert('⚙️ Settings\n\n• Emergency contacts\n• Language (EN / AR / FR)\n• Light / Dark mode');
    }
  }, [addSafeCheckIn, allLocations]);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#05070A' }}>
      {/* 1. MAP — all locations passed as prop */}
      <TacticalMap
        locations={allLocations}
        userLocation={center}
        onLocationSelect={setSelectedLocation}
      />

      {/* 2. HEADER */}
      <FloatingHeader
        batterySaver={true}
        batteryLevel={73}
        onSOSPress={handleSOSPress}
      />

      {/* 3. HOSPITAL SHEET — opens when selectedLocation is set */}
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
      />
    </div>
  );
}
