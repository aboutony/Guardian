import React, { useState, useEffect } from 'react';
import { Map, Bell, Shield, Settings, Check } from 'lucide-react';
import { type Lang, t } from '../i18n';

interface BottomNavigationProps {
  activeTab: 'map' | 'alerts' | 'safe' | 'settings';
  onTabChange: (tab: 'map' | 'alerts' | 'safe' | 'settings') => void;
  alertCount?: number;
  alertPulsing?: boolean;
  lang?: Lang;
  blackout?: boolean;
}

export function BottomNavigation({ activeTab, onTabChange, alertCount = 0, alertPulsing = false, lang = 'en', blackout = false }: BottomNavigationProps) {
  const [safeConfirmed, setSafeConfirmed] = useState(false);

  useEffect(() => {
    if (safeConfirmed) {
      const timer = setTimeout(() => setSafeConfirmed(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [safeConfirmed]);

  const handleTabClick = (tabId: 'map' | 'alerts' | 'safe' | 'settings') => {
    if (tabId === 'safe') {
      setSafeConfirmed(true);
      try { navigator.vibrate(100); } catch {}
    }
    onTabChange(tabId);
  };

  // ── Build tabs with translated labels ──
  const tabs = [
    { id: 'map' as const, icon: Map, label: t(lang, 'tab_map') },
    { id: 'alerts' as const, icon: Bell, label: t(lang, 'tab_alerts'), badge: alertCount },
    { id: 'safe' as const, icon: safeConfirmed ? Check : Shield, label: safeConfirmed ? t(lang, 'safe_confirmed') : t(lang, 'tab_safe') },
    { id: 'settings' as const, icon: Settings, label: t(lang, 'tab_settings') },
  ];

  // ── RTL: flip the tab order for Arabic ──
  const orderedTabs = lang === 'ar' ? [...tabs].reverse() : tabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe pointer-events-none">
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className={`rounded-3xl shadow-2xl pointer-events-auto ${blackout ? 'bg-black border border-[#333]' : 'backdrop-blur-2xl bg-[#05070A]/95 border border-white/10'}`}>
          <div className="flex items-center justify-around px-2 py-2">
            {orderedTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isSafe = tab.id === 'safe';
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl
                    transition-all duration-200 active:scale-95 min-w-[72px]
                    ${isActive ? (blackout ? 'bg-white/5' : 'bg-white/10') : 'hover:bg-white/5'}
                    ${isSafe ? 'flex-1 mx-2' : ''}`}
                >
                  {isActive && (
                    <div className="absolute inset-0 blur-xl opacity-30 rounded-2xl"
                         style={{ backgroundColor: isSafe ? '#00FF95' : '#00D1FF' }} />
                  )}

                  <div className="relative">
                    {isSafe ? (
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all
                        ${safeConfirmed ? 'shadow-[0_0_40px_rgba(0,255,149,0.7)]' : isActive ? 'shadow-[0_0_30px_rgba(0,255,149,0.5)]' : 'shadow-[0_0_20px_rgba(0,255,149,0.3)]'}`}
                        style={{ backgroundColor: safeConfirmed ? '#00CC77' : '#00FF95', borderColor: '#00FF95' }}>
                        <Icon className="w-7 h-7 text-[#05070A]" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="relative">
                        <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-[#00D1FF]' : 'text-white/60'}`}
                              strokeWidth={isActive ? 2.5 : 2} />
                        {tab.badge != null && tab.badge > 0 && (
                          <div className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center
                            bg-[#FF3B3B] border-2 border-[#05070A] rounded-full shadow-[0_0_10px_rgba(255,59,59,0.6)]
                            ${alertPulsing ? 'animate-pulse' : ''}`}>
                            <span className="text-[10px] text-white px-1" style={{ fontWeight: 700 }}>
                              {tab.badge > 99 ? '99+' : tab.badge}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className={`text-xs transition-colors relative
                    ${isActive ? (isSafe ? 'text-[#00FF95]' : 'text-[#00D1FF]') : 'text-white/60'}`}
                    style={{ fontWeight: isActive ? 600 : 500, fontSize: isSafe ? '11px' : '10px' }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mt-2">
          <div className={`rounded-full px-3 py-1.5 ${blackout ? 'bg-black border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00FF95] animate-pulse" />
              <span className="text-xs text-white/60">{t(lang, 'connected')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
