import React, { useState } from 'react';
import { TacticalMap } from './components/tactical-map';
import { FloatingHeader } from './components/floating-header';
import { HospitalSheet } from './components/hospital-sheet';
import { FamilySafetyCircle } from './components/family-safety-circle';
import { BottomNavigation } from './components/bottom-navigation';

// Mock data
const mockLocations = [
  {
    id: '1',
    name: 'St. Mary\'s Hospital',
    type: 'hospital' as const,
    lat: 40.7580,
    lng: -73.9855,
    safetyScore: 92,
    verifiedBy: 24,
    status: 'open' as const,
    distance: '2.3 km',
    eta: '8 min',
    address: '123 Emergency Lane, Downtown',
    phone: '+1 (555) 0100',
    services: ['Emergency Care', 'Trauma Unit', 'Pediatrics', 'Surgery'],
  },
  {
    id: '2',
    name: 'Central Shelter',
    type: 'shelter' as const,
    lat: 40.7484,
    lng: -73.9857,
    safetyScore: 78,
    verifiedBy: 15,
    status: 'open' as const,
    distance: '1.8 km',
    eta: '6 min',
    address: '456 Safe Haven Street',
    services: ['Food', 'Water', 'Medical Aid', 'Beds Available'],
  },
  {
    id: '3',
    name: 'Police Station 12',
    type: 'police' as const,
    lat: 40.7589,
    lng: -73.9851,
    safetyScore: 95,
    verifiedBy: 31,
    status: 'open' as const,
    distance: '0.9 km',
    eta: '3 min',
    address: '789 Security Boulevard',
    services: ['24/7 Protection', 'Emergency Response'],
  },
  {
    id: '4',
    name: 'Danger Zone',
    type: 'danger' as const,
    lat: 40.7489,
    lng: -73.9680,
    safetyScore: 25,
    verifiedBy: 8,
    status: 'closed' as const,
    distance: '3.2 km',
    address: 'Harbor District - Avoid',
  },
  {
    id: '5',
    name: 'Safe Zone Alpha',
    type: 'safe-zone' as const,
    lat: 40.7614,
    lng: -73.9776,
    safetyScore: 88,
    verifiedBy: 19,
    status: 'open' as const,
    distance: '1.5 km',
    eta: '5 min',
    address: 'Central Park North',
    services: ['Verified Safe', 'Medical Tent', 'Food Distribution'],
  },
  {
    id: '6',
    name: 'City General Hospital',
    type: 'hospital' as const,
    lat: 40.7529,
    lng: -73.9772,
    safetyScore: 85,
    verifiedBy: 27,
    status: 'limited' as const,
    distance: '2.7 km',
    eta: '10 min',
    address: '321 Medical Plaza',
    services: ['Limited Capacity', 'Emergency Only', 'No Walk-ins'],
  },
];

const mockFamilyMembers = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'S',
    batteryLevel: 85,
    lastSeen: '2 min ago',
    status: 'safe' as const,
    location: 'Home - 1.2 km away',
  },
  {
    id: '2',
    name: 'Michael Johnson',
    avatar: 'M',
    batteryLevel: 45,
    lastSeen: '5 min ago',
    status: 'warning' as const,
    location: 'Downtown Office - 3.5 km',
  },
  {
    id: '3',
    name: 'Emma Williams',
    avatar: 'E',
    batteryLevel: 92,
    lastSeen: '1 min ago',
    status: 'safe' as const,
    location: 'Central Park - 1.8 km',
  },
  {
    id: '4',
    name: 'David Martinez',
    avatar: 'D',
    batteryLevel: 15,
    lastSeen: '15 min ago',
    status: 'warning' as const,
    location: 'Harbor District - 4.2 km',
  },
];

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState<typeof mockLocations[0] | null>(null);
  const [showFamilyCircle, setShowFamilyCircle] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'safe' | 'settings'>('map');
  const [batterySaver] = useState(true);
  const [batteryLevel] = useState(73);

  const handleSOSPress = () => {
    alert('🚨 SOS ACTIVATED\n\nEmergency services have been notified.\nYour location has been shared with emergency contacts.\n\nStay calm. Help is on the way.');
  };

  const handleStartRoute = (location: typeof mockLocations[0]) => {
    alert(`🧭 Starting safest route to ${location.name}\n\nRoute optimized for:\n• Safety Score: ${location.safetyScore}%\n• ETA: ${location.eta}\n• Distance: ${location.distance}\n\nFollow the navigation on your map.`);
    setSelectedLocation(null);
  };

  const handleTabChange = (tab: 'map' | 'alerts' | 'safe' | 'settings') => {
    setActiveTab(tab);
    
    if (tab === 'safe') {
      // Open family circle when "I AM SAFE" is pressed
      setShowFamilyCircle(true);
    } else if (tab === 'alerts') {
      alert('📢 Active Alerts\n\n• Flash flood warning - Harbor District\n• Road closure - Main Street\n• Safe zone opened - Central Park\n\n3 new alerts');
    } else if (tab === 'settings') {
      alert('⚙️ Settings\n\nConfigure:\n• Emergency contacts\n• Notification preferences\n• Privacy settings\n• Language (RTL support for Arabic)');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: '#05070A' }}>
      {/* Main Map View */}
      <TacticalMap
        locations={mockLocations}
        userLocation={{ lat: 40.7580, lng: -73.9855 }}
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
        members={mockFamilyMembers}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        alertCount={3}
      />
    </div>
  );
}
