import React, { useState } from 'react';
import { MapPin, Navigation, Shield, AlertTriangle, Heart, Building2 } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'police' | 'danger' | 'safe-zone';
  lat: number;
  lng: number;
  safetyScore?: number;
  verifiedBy?: number;
  status?: 'open' | 'closed' | 'limited';
}

interface TacticalMapProps {
  onLocationSelect: (location: Location) => void;
  locations: Location[];
  userLocation: { lat: number; lng: number };
}

export function TacticalMap({ onLocationSelect, locations, userLocation }: TacticalMapProps) {
  const [mapCenter] = useState({ x: 50, y: 50 });
  
  const getMarkerColor = (type: Location['type']) => {
    switch (type) {
      case 'hospital':
        return '#00FF95';
      case 'shelter':
        return '#00D1FF';
      case 'police':
        return '#00D1FF';
      case 'danger':
        return '#FF3B3B';
      case 'safe-zone':
        return '#00FF95';
      default:
        return '#00D1FF';
    }
  };

  const getMarkerIcon = (type: Location['type']) => {
    switch (type) {
      case 'hospital':
        return <Heart className="w-4 h-4" />;
      case 'shelter':
        return <Building2 className="w-4 h-4" />;
      case 'police':
        return <Shield className="w-4 h-4" />;
      case 'danger':
        return <AlertTriangle className="w-4 h-4" />;
      case 'safe-zone':
        return <Shield className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Dark Satellite Map Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><rect fill="%2305070A" width="1000" height="1000"/><path fill="%230A0E14" opacity="0.4" d="M0,100 Q250,150 500,100 T1000,100 L1000,300 Q750,250 500,300 T0,300 Z"/><path fill="%230A0E14" opacity="0.3" d="M0,400 Q250,450 500,400 T1000,400 L1000,600 Q750,550 500,600 T0,600 Z"/><path fill="%230A0E14" opacity="0.2" d="M0,700 Q250,750 500,700 T1000,700 L1000,900 Q750,850 500,900 T0,900 Z"/><circle fill="%2300FF95" opacity="0.05" cx="200" cy="200" r="100"/><circle fill="%2300D1FF" opacity="0.05" cx="800" cy="600" r="150"/><circle fill="%23FF3B3B" opacity="0.05" cx="500" cy="800" r="80"/></svg>')`,
        }}
      />
      
      {/* Grid overlay for tactical feel */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 209, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 209, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* User Location Marker */}
      <div
        className="absolute"
        style={{
          left: `${mapCenter.x}%`,
          top: `${mapCenter.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-8 h-8 rounded-full bg-[#00D1FF] opacity-30" />
          </div>
          {/* Static outer ring */}
          <div className="absolute inset-0">
            <div className="w-8 h-8 rounded-full border-2 border-[#00D1FF] bg-[#00D1FF]/10" />
          </div>
          {/* Center dot */}
          <div className="relative flex items-center justify-center w-8 h-8">
            <Navigation className="w-4 h-4 text-[#00D1FF] fill-[#00D1FF]" />
          </div>
        </div>
      </div>

      {/* Location Markers */}
      {locations.map((location, index) => {
        const offsetX = (index % 3 - 1) * 25 + 50;
        const offsetY = Math.floor(index / 3) * 20 + 30;
        
        return (
          <button
            key={location.id}
            onClick={() => onLocationSelect(location)}
            className="absolute group transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              left: `${offsetX}%`,
              top: `${offsetY}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ 
                backgroundColor: getMarkerColor(location.type),
                width: '32px',
                height: '32px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            
            {/* Marker */}
            <div
              className="relative w-12 h-12 rounded-full flex items-center justify-center
                       backdrop-blur-md border transition-all"
              style={{
                backgroundColor: `${getMarkerColor(location.type)}20`,
                borderColor: getMarkerColor(location.type),
                boxShadow: `0 0 20px ${getMarkerColor(location.type)}40`,
              }}
            >
              <div style={{ color: getMarkerColor(location.type) }}>
                {getMarkerIcon(location.type)}
              </div>
            </div>

            {/* Label on hover */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              <div className="px-3 py-1 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20">
                <span className="text-xs text-white">{location.name}</span>
              </div>
            </div>
          </button>
        );
      })}

      {/* Distance scale */}
      <div className="absolute bottom-24 left-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-16 h-0.5 bg-[#00D1FF]" />
            <span className="text-xs text-white/60">1 km</span>
          </div>
        </div>
      </div>
    </div>
  );
}
