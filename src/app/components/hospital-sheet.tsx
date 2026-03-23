import React, { useState } from 'react';
import { ChevronDown, Navigation, Phone, Clock, CheckCircle, Users } from 'lucide-react';

interface Location {
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

interface HospitalSheetProps {
  location: Location | null;
  onClose: () => void;
  onStartRoute: (location: Location) => void;
}

export function HospitalSheet({ location, onClose, onStartRoute }: HospitalSheetProps) {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  if (!location) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null) return;
    const offset = e.touches[0].clientY - dragStart;
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 100) {
      onClose();
    }
    setDragStart(null);
    setDragOffset(0);
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return '#00FF95';
    if (score >= 60) return '#00D1FF';
    return '#FF3B3B';
  };

  const safetyScore = location.safetyScore || 85;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
        style={{
          opacity: dragOffset > 0 ? 1 - dragOffset / 200 : 1,
        }}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: dragStart === null ? 'transform 0.3s ease-out' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Glass Panel */}
        <div className="backdrop-blur-2xl bg-[#05070A]/95 border-t border-white/10 rounded-t-3xl shadow-2xl">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Content */}
          <div className="px-6 pb-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {location.status === 'open' && (
                    <CheckCircle className="w-4 h-4 text-[#00FF95]" />
                  )}
                  <span className="text-xs text-white/60 uppercase tracking-wide">
                    {location.type}
                  </span>
                </div>
                <h2 className="text-white mb-1" style={{ fontSize: '24px', fontWeight: 700 }}>
                  {location.name}
                </h2>
                <p className="text-white/60 text-sm">{location.address || '123 Emergency Lane'}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <ChevronDown className="w-6 h-6 text-white/60" />
              </button>
            </div>

            {/* Safety Score */}
            <div className="mb-6">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/80 text-sm">Safety Score</span>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className="text-xs text-white/60">
                      Verified by {location.verifiedBy || 12} people
                    </span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{
                      width: `${safetyScore}%`,
                      backgroundColor: getSafetyColor(safetyScore),
                      boxShadow: `0 0 20px ${getSafetyColor(safetyScore)}60`,
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span 
                    className="tracking-wider" 
                    style={{ 
                      fontSize: '28px', 
                      fontWeight: 700,
                      color: getSafetyColor(safetyScore),
                    }}
                  >
                    {safetyScore}%
                  </span>
                  <span className="text-xs text-white/60">
                    Updated 5 min ago
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-xs text-white/60">Distance</span>
                </div>
                <p className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
                  {location.distance || '2.3 km'}
                </p>
              </div>
              
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-xs text-white/60">ETA</span>
                </div>
                <p className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
                  {location.eta || '8 min'}
                </p>
              </div>
            </div>

            {/* Services */}
            {location.services && (
              <div className="mb-6">
                <p className="text-white/60 text-sm mb-3">Available Services</p>
                <div className="flex flex-wrap gap-2">
                  {location.services.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-full text-xs text-white/80"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => window.alert('Calling ' + (location.phone || '911'))}
                className="flex-1 backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl py-4
                         hover:bg-white/15 active:scale-98 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5 text-white" />
                  <span className="text-white" style={{ fontWeight: 600 }}>
                    Call
                  </span>
                </div>
              </button>

              <button
                onClick={() => onStartRoute(location)}
                className="flex-[2] rounded-2xl py-4 border-2
                         hover:shadow-[0_0_40px_rgba(0,255,149,0.4)] active:scale-98 transition-all"
                style={{
                  backgroundColor: '#00FF95',
                  borderColor: '#00FF95',
                  boxShadow: '0 0 30px rgba(0, 255, 149, 0.3)',
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Navigation className="w-5 h-5 text-[#05070A]" />
                  <span className="text-[#05070A]" style={{ fontWeight: 700, fontSize: '16px' }}>
                    Start Safest Route
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
