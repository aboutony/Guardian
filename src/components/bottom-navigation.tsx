// ============================================================================
// Guardian — BottomNavigation Component
// Thumb-zone glass navigation panel for the Figma blueprint
// ============================================================================

import React from 'react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSafeCheckIn?: () => void;
}

const NAV_ITEMS = [
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'alerts', label: 'Alerts', icon: '⚠️' },
  { id: 'safe', label: 'I AM SAFE', icon: '✅', isSafe: true },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function BottomNavigation({ activeTab, onTabChange, onSafeCheckIn }: BottomNavigationProps) {
  return (
    <div className="thumb-nav glass-panel flex justify-around items-center px-4">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (item.isSafe && onSafeCheckIn) {
              onSafeCheckIn();
            } else {
              onTabChange(item.id);
            }
          }}
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${
            item.isSafe
              ? 'bg-[#00FF95] text-black px-4 py-2 rounded-2xl font-bold'
              : activeTab === item.id
                ? 'text-[#00FF95]'
                : 'text-white/60'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-[10px] uppercase font-bold tracking-tighter">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
