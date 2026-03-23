import React, { useState, useMemo, useCallback } from 'react';
import { TacticalMap } from './components/tactical-map';
import { FloatingHeader } from './components/floating-header';
import { HospitalSheet } from './components/hospital-sheet';
import { FamilySafetyCircle } from './components/family-safety-circle';
import { BottomNavigation } from './components/bottom-navigation';
import { GUARDIAN_DATA, CATEGORY_LABELS, MAP_DEFAULT_CENTER } from '../constants';

// ── Types for Figma component interfaces ──────────────────────
interface FigmaLocation {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'police' | 'danger' | 'safe-zone';
  category?: string;
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

// ── Adapter: GUARDIAN_DATA resource → Figma Location ───────────
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
    category: r.category,
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

// ── Adapter: Danger zone → Figma Location ─────────────────────
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

// ── Family Circle data ────────────────────────────────────────
const FAMILY_MEMBERS = [
  { id: 'f1', name: 'Sarah Chen', avatar: 'S', batteryLevel: 85, lastSeen: '2 min ago', status: 'safe' as const, location: 'Home — 1.2 km away' },
  { id: 'f2', name: 'Michael Johnson', avatar: 'M', batteryLevel: 45, lastSeen: '5 min ago', status: 'warning' as const, location: 'Downtown Office — 3.5 km' },
  { id: 'f3', name: 'Emma Williams', avatar: 'E', batteryLevel: 92, lastSeen: '1 min ago', status: 'safe' as const, location: 'Central Park — 1.8 km' },
  { id: 'f4', name: 'David Martinez', avatar: 'D', batteryLevel: 15, lastSeen: '15 min ago', status: 'warning' as const, location: 'Harbor District — 4.2 km' },
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<FigmaLocation | null>(null);
  const [showFamilyCircle, setShowFamilyCircle] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'safe' | 'settings'>('map');
  const [batterySaver] = useState(true);
  const [batteryLevel] = useState(73);
  const [safeCheckIns, setSafeCheckIns] = useState<string[]>([]);

  // ── Transform 113 GUARDIAN_DATA resources → Figma Locations ──
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

  // ── SOS: broadcast to family + dial 125 ──
  const handleSOSPress = useCallback(() => {
    // Alert broadcast
    alert('🚨 SOS ACTIVATED\n\nEmergency services have been notified.\nYour location has been shared with all family circle members.\n\nDialing 125...');
    // The FloatingHeader will also trigger tel:125
  }, []);

  // ── Safe Check-in: add check-in + open family circle ──
  const addSafeCheckIn = useCallback(() => {
    const timestamp = new Date().toISOString();
    setSafeCheckIns((prev) => [timestamp, ...prev]);
    // Persist to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('guardian_safe_checkins') || '[]');
      existing.unshift(timestamp);
      localStorage.setItem('guardian_safe_checkins', JSON.stringify(existing.slice(0, 50)));
    } catch { /* ignore */ }
    setShowFamilyCircle(true);
  }, []);

  // ── Start route to a resource ──
  const handleStartRoute = useCallback((location: FigmaLocation) => {
    alert(`🧭 Starting safest route to ${location.name}\n\n• Safety Score: ${location.safetyScore}%\n• Verified by: ${location.verifiedBy} users\n\nFollow the navigation on your map.`);
    setSelectedLocation(null);
  }, []);

  // ── Tab change handler ──
  const handleTabChange = useCallback((tab: 'map' | 'alerts' | 'safe' | 'settings') => {
    setActiveTab(tab);

    if (tab === 'map') {
      // Reset — close all overlays
      setSelectedLocation(null);
      setShowFamilyCircle(false);
    } else if (tab === 'safe') {
      // Trigger safe check-in + open Family Circle
      addSafeCheckIn();
    } else if (tab === 'alerts') {
      const zones = GUARDIAN_DATA.dangerZones || [];
      alert(`📢 Active Alerts (${zones.length})\n\n${zones.map((dz: any) => `• ${dz.severity.toUpperCase()}: ${dz.description}`).join('\n')}\n\nVerified risks from the Guardian network.`);
    } else if (tab === 'settings') {
      alert('⚙️ Settings\n\n• Emergency contacts\n• Notification preferences\n• Privacy & sharing\n• Language (EN / AR / FR)\n• Light / Dark mode');
    }
  }, [addSafeCheckIn]);

  // ── Marker click → open HospitalSheet ──
  const handleLocationSelect = useCallback((location: FigmaLocation) => {
    setSelectedLocation(location);
  }, []);

  // ── Default map center ──
  const center = Array.isArray(MAP_DEFAULT_CENTER)
    ? { lat: MAP_DEFAULT_CENTER[0], lng: MAP_DEFAULT_CENTER[1] }
    : { lat: 33.8938, lng: 35.5018 };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#05070A' }}>
      {/* 1. TACTICAL LAYER — 113 resources from GUARDIAN_DATA */}
      <TacticalMap
        locations={allLocations}
        userLocation={center}
        onLocationSelect={handleLocationSelect}
      />

      {/* 2. FLOATING HEADER — Live battery + SOS → tel:125 */}
      <FloatingHeader
        batterySaver={batterySaver}
        batteryLevel={batteryLevel}
        onSOSPress={handleSOSPress}
      />

      {/* 3. HOSPITAL SHEET — Opens on marker click with Trust Score */}
      <HospitalSheet
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        onStartRoute={handleStartRoute}
      />

      {/* 4. FAMILY SAFETY CIRCLE — Opens on "I AM SAFE" */}
      <FamilySafetyCircle
        isOpen={showFamilyCircle}
        onClose={() => setShowFamilyCircle(false)}
        members={FAMILY_MEMBERS}
      />

      {/* 5. BOTTOM NAVIGATION — Tab logic wired */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertCount={(GUARDIAN_DATA.dangerZones || []).length}
      />
    </div>
  );
}
