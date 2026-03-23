import React, { useState } from 'react';
import { ChevronDown, Navigation, Phone, Clock, CheckCircle, Users, ThumbsUp, ThumbsDown, ShieldCheck } from 'lucide-react';
import { type Lang, t } from '../i18n';

interface Location {
  id: string; name: string;
  type: 'hospital' | 'shelter' | 'police' | 'danger' | 'safe-zone';
  lat: number; lng: number;
  safetyScore?: number; verifiedBy?: number;
  status?: 'open' | 'closed' | 'limited';
  distance?: string; eta?: string; address?: string; phone?: string; services?: string[];
  trustScore?: number; upvotes?: number; downvotes?: number; lastReported?: string;
}

interface HospitalSheetProps {
  location: Location | null;
  onClose: () => void;
  onStartRoute: (location: Location) => void;
  onVote?: (locationId: string, vote: 'up' | 'down') => void;
  lang?: Lang;
  blackout?: boolean;
}

export function HospitalSheet({ location, onClose, onStartRoute, onVote, lang = 'en', blackout = false }: HospitalSheetProps) {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  if (!location) return null;

  const handleTouchStart = (e: React.TouchEvent) => setDragStart(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStart === null) return;
    const offset = e.touches[0].clientY - dragStart;
    if (offset > 0) setDragOffset(offset);
  };
  const handleTouchEnd = () => {
    if (dragOffset > 100) onClose();
    setDragStart(null); setDragOffset(0);
  };

  const getSafetyColor = (score: number) => {
    if (score >= 80) return '#00FF95';
    if (score >= 50) return '#00D1FF';
    if (score >= 30) return '#FF8C00';
    return '#FF3B3B';
  };

  const trustScore = location.trustScore ?? location.safetyScore ?? 80;
  const upvotes = location.upvotes ?? location.verifiedBy ?? 0;
  const downvotes = location.downvotes ?? 0;
  const totalVotes = upvotes + downvotes;

  const handleVote = (vote: 'up' | 'down') => {
    setVoted(vote);
    if (onVote) onVote(location.id, vote);
    try { navigator.vibrate(50); } catch {}
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose}
           style={{ opacity: dragOffset > 0 ? 1 - dragOffset / 200 : 1 }} />

      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
        style={{ transform: `translateY(${dragOffset}px)`, transition: dragStart === null ? 'transform 0.3s ease-out' : 'none' }}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className={`rounded-t-3xl shadow-2xl ${blackout ? 'bg-black border-t border-[#333]' : 'backdrop-blur-2xl bg-[#05070A]/95 border-t border-white/10'}`}>
          <div className="flex justify-center pt-3 pb-2">
            <div className={`w-12 h-1.5 rounded-full ${blackout ? 'bg-[#333]' : 'bg-white/20'}`} />
          </div>

          <div className="px-6 pb-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {location.status === 'open' && <CheckCircle className="w-4 h-4 text-[#00FF95]" />}
                  <span className="text-xs text-white/60 uppercase tracking-wide">{t(lang, location.type)}</span>
                  {trustScore >= 80 && totalVotes >= 5 && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#00FF95]/20 text-[#00FF95] border border-[#00FF95]/40">
                      <ShieldCheck className="w-3 h-3" /> {t(lang, 'verified')}
                    </span>
                  )}
                </div>
                <h2 className="text-white mb-1" style={{ fontSize: '24px', fontWeight: 700 }}>{location.name}</h2>
                <p className="text-white/60 text-sm">{location.address || ''}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <ChevronDown className="w-6 h-6 text-white/60" />
              </button>
            </div>

            {/* Trust Score */}
            <div className="mb-5">
              <div className={`rounded-2xl p-4 ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/80 text-sm">{t(lang, 'trust_score')}</span>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/60" />
                    <span className="text-xs text-white/60">
                      {totalVotes} {t(lang, 'reports')} · {upvotes} {t(lang, 'confirmed')}
                    </span>
                  </div>
                </div>
                <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                    style={{ width: `${trustScore}%`, backgroundColor: getSafetyColor(trustScore), boxShadow: `0 0 20px ${getSafetyColor(trustScore)}60` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '28px', fontWeight: 700, color: getSafetyColor(trustScore) }}>{trustScore}%</span>
                  <span className="text-xs text-white/60">{location.lastReported || ''}</span>
                </div>
              </div>
            </div>

            {/* ═══ P2P VOTING — translated ═══ */}
            <div className="mb-5">
              <p className="text-white/60 text-sm mb-3">{t(lang, 'operational_q')}</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleVote('up')} disabled={voted !== null}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all active:scale-95 ${
                    voted === 'up' ? 'bg-[#00FF95]/20 border-[#00FF95] shadow-[0_0_20px_rgba(0,255,149,0.4)]'
                    : voted === 'down' ? 'bg-white/5 border-white/10 opacity-50'
                    : 'bg-white/5 border-white/10 hover:bg-[#00FF95]/10 hover:border-[#00FF95]/50'}`}>
                  <ThumbsUp className="w-5 h-5" style={{ color: voted === 'up' ? '#00FF95' : '#fff' }} />
                  <span style={{ fontWeight: 600, color: voted === 'up' ? '#00FF95' : '#fff', fontSize: '12px' }}>
                    {t(lang, 'vote_operational')}
                  </span>
                </button>
                <button onClick={() => handleVote('down')} disabled={voted !== null}
                  className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all active:scale-95 ${
                    voted === 'down' ? 'bg-[#FF3B3B]/20 border-[#FF3B3B] shadow-[0_0_20px_rgba(255,59,59,0.4)]'
                    : voted === 'up' ? 'bg-white/5 border-white/10 opacity-50'
                    : 'bg-white/5 border-white/10 hover:bg-[#FF3B3B]/10 hover:border-[#FF3B3B]/50'}`}>
                  <ThumbsDown className="w-5 h-5" style={{ color: voted === 'down' ? '#FF3B3B' : '#fff' }} />
                  <span style={{ fontWeight: 600, color: voted === 'down' ? '#FF3B3B' : '#fff', fontSize: '12px' }}>
                    {t(lang, 'vote_out')}
                  </span>
                </button>
              </div>
              {voted && <p className="text-center text-xs text-white/40 mt-2">{t(lang, 'vote_thanks')}</p>}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className={`rounded-xl p-3 ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-xs text-white/60">{t(lang, 'distance')}</span>
                </div>
                <p className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>{location.distance || '—'}</p>
              </div>
              <div className={`rounded-xl p-3 ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[#00D1FF]" />
                  <span className="text-xs text-white/60">{t(lang, 'eta')}</span>
                </div>
                <p className="text-white" style={{ fontSize: '18px', fontWeight: 600 }}>{location.eta || '—'}</p>
              </div>
            </div>

            {/* Services */}
            {location.services && location.services.length > 0 && (
              <div className="mb-5">
                <p className="text-white/60 text-sm mb-3">{t(lang, 'services')}</p>
                <div className="flex flex-wrap gap-2">
                  {location.services.map((service, idx) => (
                    <span key={idx} className={`px-3 py-1.5 rounded-full text-xs text-white/80 ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => window.alert(t(lang, 'call') + ' ' + (location.phone || '125'))}
                className={`flex-1 rounded-2xl py-4 active:scale-95 transition-all ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/10 border border-white/10'} hover:bg-white/15`}>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5 text-white" />
                  <span className="text-white" style={{ fontWeight: 600 }}>{t(lang, 'call')}</span>
                </div>
              </button>
              <button onClick={() => onStartRoute(location)}
                className="flex-[2] rounded-2xl py-4 border-2 hover:shadow-[0_0_40px_rgba(0,255,149,0.4)] active:scale-95 transition-all"
                style={{ backgroundColor: '#00FF95', borderColor: '#00FF95', boxShadow: '0 0 30px rgba(0,255,149,0.3)' }}>
                <div className="flex items-center justify-center gap-2">
                  <Navigation className="w-5 h-5 text-[#05070A]" />
                  <span className="text-[#05070A]" style={{ fontWeight: 700, fontSize: '14px' }}>{t(lang, 'start_route')}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
