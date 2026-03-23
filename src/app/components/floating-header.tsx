import React, { useState, useEffect } from 'react';
import { AlertCircle, BatteryLow, BatteryMedium, BatteryFull, Moon, Sun } from 'lucide-react';
import { type Lang, t } from '../i18n';

interface FloatingHeaderProps {
  batterySaver: boolean;
  batteryLevel: number;
  onSOSPress: () => void;
  lang?: Lang;
  blackout?: boolean;
  onBlackoutToggle?: () => void;
}

export function FloatingHeader({ batterySaver, batteryLevel: fallbackLevel, onSOSPress, lang = 'en', blackout = false, onBlackoutToggle }: FloatingHeaderProps) {
  const [battery, setBattery] = useState(fallbackLevel);
  const [sosActive, setSosActive] = useState(false);

  useEffect(() => {
    let batteryObj: any = null;
    const update = (b: any) => setBattery(Math.round(b.level * 100));
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        batteryObj = b; update(b);
        b.addEventListener('levelchange', () => update(b));
      }).catch(() => {});
    }
    return () => { if (batteryObj) batteryObj.removeEventListener('levelchange', () => {}); };
  }, []);

  const BatteryIcon = battery < 20 ? BatteryLow : battery < 60 ? BatteryMedium : BatteryFull;
  const batteryColor = battery < 20 ? '#FF3B3B' : '#00FF95';

  const handleSOS = async () => {
    setSosActive(true);
    let lat = 0, lng = 0;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
      });
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch { lat = 33.8938; lng = 35.5018; }
    const uid = localStorage.getItem('guardian_uid') || `anon-${Date.now()}`;
    try { fetch('/api/sos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lng, uid, timestamp: new Date().toISOString() }) }).catch(() => {}); } catch {}
    try { const events = JSON.parse(localStorage.getItem('guardian_sos_events') || '[]'); events.unshift({ lat, lng, uid, timestamp: new Date().toISOString() }); localStorage.setItem('guardian_sos_events', JSON.stringify(events.slice(0, 20))); } catch {}
    onSOSPress();
    try { navigator.vibrate([200, 100, 200, 100, 400]); } catch {}
    setTimeout(() => { window.location.href = 'tel:125'; }, 500);
    setTimeout(() => setSosActive(false), 5000);
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-30 p-4 pointer-events-none">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          {/* ═══ BRAND LOCK: "GUARDIAN" — ALWAYS ENGLISH ═══ */}
          <div className={`rounded-2xl px-5 py-3 shadow-2xl ${blackout ? 'bg-black border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF95] animate-pulse" />
              <span className="text-white tracking-wider" style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>
                GUARDIAN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Blackout Toggle */}
            {onBlackoutToggle && (
              <button onClick={onBlackoutToggle}
                className={`rounded-xl px-3 py-2 shadow-2xl transition-all active:scale-95 ${blackout ? 'bg-white/10 border border-[#00FF95]/50 shadow-[0_0_10px_rgba(0,255,149,0.3)]' : 'backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                {blackout ? <Sun className="w-4 h-4 text-[#00FF95]" /> : <Moon className="w-4 h-4 text-white/60" />}
              </button>
            )}

            {/* Battery */}
            <div className={`rounded-xl px-3 py-2 shadow-2xl ${blackout ? 'bg-black border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
              <div className="flex items-center gap-1.5">
                <BatteryIcon className="w-4 h-4" style={{ color: batteryColor }} />
                <span className="text-xs text-white/80">{battery}%</span>
              </div>
            </div>

            {/* SOS — translated text, but never the brand */}
            <button onClick={handleSOS}
              className={`border-2 border-[#FF3B3B] rounded-xl px-4 py-2 active:scale-95 transition-all shadow-2xl ${
                sosActive ? 'bg-[#FF3B3B] shadow-[0_0_40px_rgba(255,59,59,0.7)] animate-pulse'
                : blackout ? 'bg-[#FF3B3B]/30 hover:bg-[#FF3B3B]/50'
                : 'bg-[#FF3B3B]/20 hover:bg-[#FF3B3B]/30 hover:shadow-[0_0_30px_rgba(255,59,59,0.5)]'
              }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-white" />
                <span className="text-white tracking-wider" style={{ fontWeight: 700, fontSize: '14px' }}>
                  {sosActive ? t(lang, 'sos_sending') : t(lang, 'sos')}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
