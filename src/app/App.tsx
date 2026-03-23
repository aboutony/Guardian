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
  FAMILY_CIRCLE_DEFAULT,
  type GuardianResource,
} from '../constants';

// ── Adapt GuardianResource → Figma Location interface ──────────
function resourceToLocation(r: GuardianResource) {
  const typeMap: Record<string, 'hospital' | 'shelter' | 'police' | 'danger' | 'safe-zone'> = {
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
    type: typeMap[r.category] || ('safe-zone' as const),
    lat: r.lat,
    lng: r.lng,
    safetyScore: r.verificationCount
      ? Math.min(99, 60 + r.verificationCount * 3)
      : 80,
    verifiedBy: r.verificationCount || 0,
    status: (r.isOperational ? 'open' : 'closed') as 'open' | 'closed' | 'limited',
    distance: '',
    eta: '',
    address: r.address || '',
    phone: r.phone,
    services: [
      CATEGORY_LABELS[r.category as keyof typeof CATEGORY_LABELS]?.en || r.category,
      r.operatingHours || '',
    ].filter(Boolean),
  };
}

// ── Adapt DangerZone → Figma Location ──────────────────────────
function dangerToLocation(dz: (typeof GUARDIAN_DATA.dangerZones)[0]) {
  return {
    id: dz.id,
    name: dz.description,
    type: 'danger' as const,
    lat: dz.lat,
    lng: dz.lng,
    safetyScore: dz.severity === 'critical' ? 10 : dz.severity === 'high' ? 25 : 40,
    verifiedBy: 0,
    status: 'closed' as const,
    distance: `${dz.radiusKm} km radius`,
    address: `${dz.severity.toUpperCase()} zone — avoid area`,
  };
}

// ── Adapt FamilyMember → Figma FamilyMember ────────────────────
function familyToFigma(fm: (typeof FAMILY_CIRCLE_DEFAULT)[0]) {
  return {
    id: fm.id,
    name: fm.name,
    avatar: fm.emoji,
    batteryLevel: fm.battery ?? 80,
    lastSeen: new Date(fm.lastSeen).toLocaleTimeString(),
    status: (fm.status === 'safe' ? 'safe' : fm.status === 'sos' ? 'danger' : 'warning') as 'safe' | 'warning' | 'danger',
    location: `${fm.lat.toFixed(2)}, ${fm.lng.toFixed(2)}`,
  };
}

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<ReturnType<typeof resourceToLocation> | null>(null);
  const [showFamilyCircle, setShowFamilyCircle] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'safe' | 'settings'>('map');
  const [batterySaver] = useState(true);
  const [batteryLevel] = useState(73);

  // ── Phase 01: Transform 113 GUARDIAN_DATA resources → Figma Locations ──
  const allLocations = useMemo(() => {
    const resources: GuardianResource[] = [
      ...GUARDIAN_DATA.hospitals,
      ...GUARDIAN_DATA.bakeries,
      ...GUARDIAN_DATA.pharmacies,
      ...GUARDIAN_DATA.ngos,
      ...GUARDIAN_DATA.shelters,
      ...GUARDIAN_DATA.waterPoints,
      ...GUARDIAN_DATA.fuelStations,
    ];
    const mapped = resources.filter((r) => r.isOperational).map(resourceToLocation);
    const dangers = GUARDIAN_DATA.dangerZones.map(dangerToLocation);
    return [...mapped, ...dangers];
  }, []);

  // ── Phase 01: Family Circle from constants ──
  const familyMembers = useMemo(() => FAMILY_CIRCLE_DEFAULT.map(familyToFigma), []);

  const handleSOSPress = () => {
    alert('🚨 SOS ACTIVATED\n\nEmergency services have been notified.\nYour location has been shared with emergency contacts.\n\nStay calm. Help is on the way.');
  };

  const handleStartRoute = (location: ReturnType<typeof resourceToLocation>) => {
    alert(`🧭 Starting safest route to ${location.name}\n\nRoute optimized for:\n• Safety Score: ${location.safetyScore}%\n• Distance: ${location.distance}\n\nFollow the navigation on your map.`);
    setSelectedLocation(null);
  };

  const handleTabChange = (tab: 'map' | 'alerts' | 'safe' | 'settings') => {
    setActiveTab(tab);
    
    if (tab === 'safe') {
      setShowFamilyCircle(true);
    } else if (tab === 'alerts') {
      const dangerCount = GUARDIAN_DATA.dangerZones.length;
      alert(`📢 Active Alerts\n\n${GUARDIAN_DATA.dangerZones.map((dz) => `• ${dz.severity.toUpperCase()}: ${dz.description}`).join('\n')}\n\n${dangerCount} active danger zones`);
    } else if (tab === 'settings') {
      alert('⚙️ Settings\n\nConfigure:\n• Emergency contacts\n• Notification preferences\n• Privacy settings\n• Language (RTL support for Arabic)');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#05070A' }}>
      {/* Main Map View — Fed by 113 GUARDIAN_DATA resources */}
      <TacticalMap
        locations={allLocations}
        userLocation={{ lat: MAP_DEFAULT_CENTER[0], lng: MAP_DEFAULT_CENTER[1] }}
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

      {/* Family Safety Circle Overlay — Fed by FAMILY_CIRCLE_DEFAULT */}
      <FamilySafetyCircle
        isOpen={showFamilyCircle}
        onClose={() => setShowFamilyCircle(false)}
        members={familyMembers}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertCount={GUARDIAN_DATA.dangerZones.length}
      />
    </div>
  );
}
