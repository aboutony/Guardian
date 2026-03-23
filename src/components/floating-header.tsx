// ============================================================================
// Guardian — FloatingHeader Component
// Floating glass pill header for the Figma blueprint
// ============================================================================

import React from 'react';

interface FloatingHeaderProps {
  title?: string;
  battery?: number;
  onSOS?: () => void;
}

export function FloatingHeader({ title = 'GUARDIAN', battery = 73, onSOS }: FloatingHeaderProps) {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
      <div className="glass-panel px-6 py-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00FF95] animate-pulse" />
        <span className="font-bold tracking-widest text-sm">{title}</span>
      </div>
      <div className="glass-panel px-4 py-2 flex items-center gap-2">
        <span className="text-xs text-[#00FF95]">{battery}%</span>
        <div className="w-8 h-4 border border-white/20 rounded-sm p-0.5">
          <div className="bg-[#00FF95] h-full" style={{ width: `${battery}%` }} />
        </div>
      </div>
      <button
        onClick={onSOS}
        className="bg-[#FF3B3B] px-4 py-2 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(255,59,59,0.4)]"
      >
        SOS
      </button>
    </div>
  );
}
