import React, { useState, useMemo } from 'react';
import { TacticalMap } from './components/tactical-map';
import { FloatingHeader } from './components/floating-header';
import { HospitalSheet } from './components/hospital-sheet';
import { FamilySafetyCircle } from './components/family-safety-circle';
import { BottomNavigation } from './components/bottom-navigation';
import {
  GUARDIAN_DATA,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  MAP_DEFAULT_CENTER,
  SEVERITY_COLORS,
} from '../constants';

// ── Family Circle data (inline — not in constants.ts) ──────────
const FAMILY_MEMBERS = [
  { id: 'f1', name: 'Sarah Chen', emoji: '👩', battery: 85, lastSeen: '2 min ago', status: 'safe' as const, lat: 33.89, lng: 35.50 },
  { id: 'f2', name: 'Michael Johnson', emoji: '👨', battery: 45, lastSeen: '5 min ago', status: 'warning' as const, lat: 33.87, lng: 35.51 },
  { id: 'f3', name: 'Emma Williams', emoji: '👧', battery: 92, lastSeen: '1 min ago', status: 'safe' as const, lat: 33.88, lng: 35.49 },
  { id: 'f4', name: 'David Martinez', emoji: '👦', battery: 15, lastSeen: '15 min ago', status: 'warning' as const, lat: 33.86, lng: 35.52 },
];

// ── Types ──────────────────────────────────────────────────────
interface FigmaLocation {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'police' | 'danger' | 'safe-zone';
  lat: number;
  lng: number;
  safetyScore?: number;
  verifiedBy?: number;
  status?: 'open' | 'closed' | 'limited';
  distance?: string;
  eta?: string;
  address?: string;
  phone?: string;
  services?: string[];
}

// ── Adapter: GuardianResource → Figma Location ─────────────────
function resourceToLocation(r: any): FigmaLocation {
  const typeMap: Record<string, FigmaLocation['type']> = {
    hospital: 'hospital',
    shelter: 'shelter',
    ngo: 'shelter',
    bakery: 'safe-zone',
    pharmacy: 'safe-zone',
    water_point: 'safe-zone',
    fuel_station: 'safe-zone',
  };
  return {
    id: r.id,
    name: r.name,
    type: typeMap[r.category] || 'safe-zone',
    lat: r.lat,
    lng: r.lng,
    safetyScore: r.verificationCount ? Math.min(99, 60 + r.verificationCount * 3) : 80,
    verifiedBy: r.verificationCount || 0,
    status: r.isOperational ? 'open' : 'closed',
    distance: '',
    eta: '',
    address: r.address || '',
    phone: r.phone,
    services: [
      (CATEGORY_LABELS as any)[r.category]?.en || r.category,
      r.operatingHours || '',
    ].filter(Boolean),
  };
}

// ── Adapter: DangerZone → Figma Location ───────────────────────
function dangerToLocation(dz: any): FigmaLocation {
  return {
    id: dz.id,
    name: dz.description,
    type: 'danger',
    lat: dz.lat,
    lng: dz.lng,
    safetyScore: dz.severity === 'critical' ? 10 : dz.severity === 'high' ? 25 : 40,
    verifiedBy: 0,
    status: 'closed',
    distance: `${dz.radiusKm} km radius`,
    address: `${dz.severity.toUpperCase()} zone — avoid area`,
  };
}

// ── Adapter: Family Member → Figma Family Member ───────────────
function familyToFigma(fm: typeof FAMILY_MEMBERS[0]) {
  return {
    id: fm.id,
    name: fm.name,
    avatar: fm.emoji,
    batteryLevel: fm.battery,
    lastSeen: fm.lastSeen,
    status: fm.status === 'safe' ? 'safe' as const : 'warning' as const,
    location: `${fm.lat.toFixed(2)}°N, ${fm.lng.toFixed(2)}°E`,
  };
}

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<FigmaLocation | null>(null);
  const [showFamilyCircle, setShowFamilyCircle] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'safe' | 'settings'>('map');
  const [batterySaver] = useState(true);
  const [batteryLevel] = useState(73);

  // ── Phase 01: Transform 113 GUARDIAN_DATA resources → Figma Locations ──
  const allLocations = useMemo(() => {
    const resources = [
      ...(GUARDIAN_DATA.hospitals || []),
      ...(GUARDIAN_DATA.bakeries || []),
      ...(GUARDIAN_DATA.pharmacies || []),
      ...(GUARDIAN_DATA.ngos || []),
      ...(GUARDIAN_DATA.shelters || []),
      ...(GUARDIAN_DATA.waterPoints || []),
      ...(GUARDIAN_DATA.fuelStations || []),
    ];
    const mapped = resources.filter((r: any) => r.isOperational).map(resourceToLocation);
    const dangers = (GUARDIAN_DATA.dangerZones || []).map(dangerToLocation);
    return [...mapped, ...dangers];
  }, []);

  // ── Family members (inline data) ──
  const familyMembers = useMemo(() => FAMILY_MEMBERS.map(familyToFigma), []);

  const handleSOSPress = () => {
    alert('🚨 SOS ACTIVATED\n\nEmergency services have been notified.\nYour location has been shared with emergency contacts.\n\nStay calm. Help is on the way.');
  };

  const handleStartRoute = (location: FigmaLocation) => {
    alert(`🧭 Starting safest route to ${location.name}\n\nSafety Score: ${location.safetyScore}%\n\nFollow the navigation on your map.`);
    setSelectedLocation(null);
  };

  const handleTabChange = (tab: 'map' | 'alerts' | 'safe' | 'settings') => {
    setActiveTab(tab);

    if (tab === 'safe') {
      setShowFamilyCircle(true);
    } else if (tab === 'alerts') {
      const zones = GUARDIAN_DATA.dangerZones || [];
      alert(`📢 Active Alerts\n\n${zones.map((dz: any) => `• ${dz.severity.toUpperCase()}: ${dz.description}`).join('\n')}\n\n${zones.length} active danger zones`);
    } else if (tab === 'settings') {
      alert('⚙️ Settings\n\nConfigure:\n• Emergency contacts\n• Notification preferences\n• Privacy settings\n• Language (RTL support for Arabic)');
    }
  };

  // ── Get default center from constants ──
  const center = Array.isArray(MAP_DEFAULT_CENTER)
    ? { lat: MAP_DEFAULT_CENTER[0], lng: MAP_DEFAULT_CENTER[1] }
    : { lat: 33.8938, lng: 35.5018 }; // Beirut fallback

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#05070A' }}>
      {/* Main Map View — Fed by 113 GUARDIAN_DATA resources */}
      <TacticalMap
        locations={allLocations}
        userLocation={center}
        onLocationSelect={setSelectedLocation}
      />

      {/* Floating Header */}
      <FloatingHeader
        batterySaver={batterySaver}
        batteryLevel={batteryLevel}
        onSOSPress={handleSOSPress}
      />

      {/* Hospital/Location Bottom Sheet */}
      <HospitalSheet
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onStartRoute={handleStartRoute}
      />

      {/* Family Safety Circle Overlay */}
      <FamilySafetyCircle
        isOpen={showFamilyCircle}
        onClose={() => setShowFamilyCircle(false)}
        members={familyMembers}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertCount={(GUARDIAN_DATA.dangerZones || []).length}
      />
    </div>
  );
}
