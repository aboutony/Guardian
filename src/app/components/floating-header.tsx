import React from 'react';
import { AlertCircle, Battery } from 'lucide-react';

interface FloatingHeaderProps {
  batterySaver: boolean;
  batteryLevel: number;
  onSOSPress: () => void;
}

export function FloatingHeader({ batterySaver, batteryLevel, onSOSPress }: FloatingHeaderProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-4 pointer-events-none">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          {/* Guardian Brand */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl px-5 py-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF95] animate-pulse" />
              <span className="text-white tracking-wider" style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.05em' }}>
                GUARDIAN
              </span>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            {/* Battery Saver */}
            {batterySaver && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
                <div className="flex items-center gap-1.5">
                  <Battery className="w-4 h-4 text-[#00FF95]" />
                  <span className="text-xs text-white/80">{batteryLevel}%</span>
                </div>
              </div>
            )}

            {/* SOS Button */}
            <button
              onClick={onSOSPress}
              className="backdrop-blur-xl bg-[#FF3B3B]/20 border-2 border-[#FF3B3B] rounded-xl px-4 py-2 
                       hover:bg-[#FF3B3B]/30 active:scale-95 transition-all shadow-2xl
                       hover:shadow-[0_0_30px_rgba(255,59,59,0.5)]"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#FF3B3B]" />
                <span className="text-white tracking-wider" style={{ fontWeight: 700, fontSize: '14px' }}>
                  SOS
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
