// ============================================================================
// Guardian — App.tsx
// Vanguard V1.2: Salvaged & Merged High-Fidelity UI
// Figma Blueprint + 113 Resources + Trust System
// Generated via Antigravity Editor
// ============================================================================

import React, { useState } from 'react';
import { TacticalMap } from './components/tactical-map';
import { FloatingHeader } from './components/floating-header';
import { BottomNavigation } from './components/bottom-navigation';
import { GUARDIAN_DATA, TRANSLATIONS } from './constants';

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05070A]">
      {/* 1. TACTICAL LAYER: Restore 113 Resources + Trust System */}
      <TacticalMap 
        locations={GUARDIAN_DATA} 
        onLocationSelect={setSelectedLocation}
      />

      {/* 2. FIGMA HEADER: Floating Glass Pill */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
        <div className="glass-panel px-6 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF95] animate-pulse" />
          <span className="font-bold tracking-widest text-sm">GUARDIAN</span>
        </div>
        <div className="glass-panel px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-[#00FF95]">73%</span>
          <div className="w-8 h-4 border border-white/20 rounded-sm p-0.5">
             <div className="bg-[#00FF95] h-full w-[73%]" />
          </div>
        </div>
        <button className="bg-[#FF3B3B] px-4 py-2 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(255,59,59,0.4)]">
          SOS
        </button>
      </div>

      {/* 3. THUMB-ZONE NAVIGATION: Figma Ergonomics */}
      <div className="thumb-nav glass-panel flex justify-around items-center px-4">
        {['Map', 'Alerts', 'I AM SAFE', 'Settings'].map((label) => (
          <button key={label} className={`flex flex-col items-center gap-1 ${label === 'I AM SAFE' ? 'bg-[#00FF95] text-black px-4 py-2 rounded-2xl font-bold' : 'text-white/60'}`}>
            <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
          </button>
        ))}
      </div>
      
      {/* 4. NETWORK STATUS: Figma Footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-1 text-[8px] flex items-center gap-2 text-white/40">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00FF95]" />
        CONNECTED TO EMERGENCY NETWORK
      </div>
    </div>
  );
}
