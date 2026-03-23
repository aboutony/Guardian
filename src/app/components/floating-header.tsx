import React, { useState, useEffect } from 'react';
import { AlertCircle, Battery, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';

interface FloatingHeaderProps {
  batterySaver: boolean;
  batteryLevel: number;
  onSOSPress: () => void;
}

export function FloatingHeader({ batterySaver, batteryLevel: fallbackLevel, onSOSPress }: FloatingHeaderProps) {
  const [battery, setBattery] = useState(fallbackLevel);
  const [sosActive, setSosActive] = useState(false);

  // ── Live battery from navigator.getBattery() ──
  useEffect(() => {
    let batteryObj: any = null;
    const update = (b: any) => setBattery(Math.round(b.level * 100));
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryObj = b;
        update(b);
        b.addEventListener('levelchange', () => update(b));
      }).catch(() => {});
    }
    return () => { if (batteryObj) batteryObj.removeEventListener('levelchange', () => {}); };
  }, []);

  const BatteryIcon = battery < 20 ? BatteryLow : battery < 60 ? BatteryMedium : BatteryFull;
  const batteryColor = battery < 20 ? '#FF3B3B' : '#00FF95';

  // ═══════════════════════════════════════════════════════════
  // SOS HANDLER: Geolocation → POST /api/sos → tel:125 fallback
  // ═══════════════════════════════════════════════════════════
  const handleSOS = async () => {
    setSosActive(true);

    // 1. Get high-accuracy coordinates
    let lat = 0, lng = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // Fall back to stored/default location
      lat = 33.8938;
      lng = 35.5018;
    }

    // 2. POST to /api/sos (fire-and-forget)
    const uid = localStorage.getItem('guardian_uid') || `anon-${Date.now()}`;
    try {
      fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, uid, timestamp: new Date().toISOString() }),
      }).catch(() => {});
    } catch {}

    // 3. Store SOS event locally
    try {
      const events = JSON.parse(localStorage.getItem('guardian_sos_events') || '[]');
      events.unshift({ lat, lng, uid, timestamp: new Date().toISOString() });
      localStorage.setItem('guardian_sos_events', JSON.stringify(events.slice(0, 20)));
    } catch {}

    // 4. Notify parent
    onSOSPress();

    // 5. Haptic feedback
    try { navigator.vibrate([200, 100, 200, 100, 400]); } catch {}

    // 6. FALLBACK: Dial emergency
    setTimeout(() => {
      window.location.href = 'tel:125';
    }, 500);

    // Reset visual after 5s
    setTimeout(() => setSosActive(false), 5000);
  };

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
            {/* Battery */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
              <div className="flex items-center gap-1.5">
                <BatteryIcon className="w-4 h-4" style={{ color: batteryColor }} />
                <span className="text-xs text-white/80">{battery}%</span>
              </div>
            </div>

            {/* SOS Button */}
            <button
              onClick={handleSOS}
              className={`backdrop-blur-xl border-2 border-[#FF3B3B] rounded-xl px-4 py-2 
                       active:scale-95 transition-all shadow-2xl
                       ${sosActive
                         ? 'bg-[#FF3B3B] shadow-[0_0_40px_rgba(255,59,59,0.7)] animate-pulse'
                         : 'bg-[#FF3B3B]/20 hover:bg-[#FF3B3B]/30 hover:shadow-[0_0_30px_rgba(255,59,59,0.5)]'
                       }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-white" />
                <span className="text-white tracking-wider" style={{ fontWeight: 700, fontSize: '14px' }}>
                  {sosActive ? 'SENDING...' : 'SOS'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
