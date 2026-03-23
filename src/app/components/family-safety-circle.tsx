import React from 'react';
import { Battery, X } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  batteryLevel: number;
  lastSeen: string;
  status: 'safe' | 'warning' | 'danger';
  location?: string;
}

interface FamilySafetyCircleProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
}

export function FamilySafetyCircle({ isOpen, onClose, members }: FamilySafetyCircleProps) {
  if (!isOpen) return null;

  const getStatusColor = (status: FamilyMember['status']) => {
    switch (status) {
      case 'safe':
        return '#00FF95';
      case 'warning':
        return '#00D1FF';
      case 'danger':
        return '#FF3B3B';
      default:
        return '#00D1FF';
    }
  };

  const getStatusLabel = (status: FamilyMember['status']) => {
    switch (status) {
      case 'safe':
        return 'Safe';
      case 'warning':
        return 'Low Battery';
      case 'danger':
        return 'Needs Help';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Circle Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="max-w-md w-full pointer-events-auto">
          {/* Header */}
          <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 mb-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-white mb-1" style={{ fontSize: '24px', fontWeight: 700 }}>
                  Family Circle
                </h2>
                <p className="text-white/60 text-sm">
                  {members.filter(m => m.status === 'safe').length} of {members.length} are safe
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white/60" />
              </button>
            </div>

            {/* Overall Status Bar */}
            <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(members.filter(m => m.status === 'safe').length / members.length) * 100}%`,
                  backgroundColor: '#00FF95',
                  boxShadow: '0 0 20px rgba(0, 255, 149, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Member Cards */}
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
            {members.map((member) => (
              <div
                key={member.id}
                className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-4 
                         shadow-xl hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with glow */}
                  <div className="relative">
                    <div
                      className="absolute inset-0 blur-xl opacity-60 rounded-full"
                      style={{ backgroundColor: getStatusColor(member.status) }}
                    />
                    <div
                      className="relative w-16 h-16 rounded-full overflow-hidden border-2"
                      style={{
                        borderColor: getStatusColor(member.status),
                        boxShadow: `0 0 20px ${getStatusColor(member.status)}60`,
                      }}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center text-white"
                        style={{ 
                          backgroundColor: `${getStatusColor(member.status)}20`,
                          fontSize: '24px',
                          fontWeight: 700,
                        }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    </div>
                    {/* Status indicator */}
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#05070A]"
                      style={{ backgroundColor: getStatusColor(member.status) }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
                        {member.name}
                      </h3>
                      <span
                        className="text-xs px-2 py-1 rounded-full backdrop-blur-xl border"
                        style={{
                          backgroundColor: `${getStatusColor(member.status)}20`,
                          borderColor: `${getStatusColor(member.status)}40`,
                          color: getStatusColor(member.status),
                        }}
                      >
                        {getStatusLabel(member.status)}
                      </span>
                    </div>

                    {/* Location */}
                    {member.location && (
                      <p className="text-white/60 text-sm mb-2 truncate">
                        {member.location}
                      </p>
                    )}

                    {/* Battery & Last Seen */}
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <div className="flex items-center gap-1.5">
                        <Battery 
                          className="w-3.5 h-3.5"
                          style={{ 
                            color: member.batteryLevel < 20 ? '#FF3B3B' : '#00D1FF' 
                          }}
                        />
                        <span>{member.batteryLevel}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-white/30" />
                        <span>Last seen {member.lastSeen}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions (show on hover) */}
                <div className="mt-3 pt-3 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 backdrop-blur-xl bg-white/5 border border-white/10 
                               rounded-xl text-xs text-white hover:bg-white/10 transition-colors"
                    >
                      Message
                    </button>
                    <button
                      className="flex-1 px-3 py-2 backdrop-blur-xl bg-white/5 border border-white/10 
                               rounded-xl text-xs text-white hover:bg-white/10 transition-colors"
                    >
                      Track
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Button */}
          <button
            className="w-full mt-4 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl py-4
                     hover:bg-white/10 active:scale-98 transition-all"
          >
            <span className="text-white" style={{ fontWeight: 600 }}>
              + Add Family Member
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
