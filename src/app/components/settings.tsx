import React from 'react';
import { Globe, Moon, Phone, Shield, Info, ChevronRight } from 'lucide-react';
import { type Lang, t } from '../i18n';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  blackout: boolean;
  onBlackoutToggle: () => void;
}

export function Settings({ isOpen, onClose, lang, onLangChange, blackout, onBlackoutToggle }: SettingsProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto">
        <div className={`rounded-t-3xl shadow-2xl ${blackout ? 'bg-black border-t border-[#333]' : 'backdrop-blur-2xl bg-[#05070A]/95 border-t border-white/10'}`}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className={`w-12 h-1.5 rounded-full ${blackout ? 'bg-[#333]' : 'bg-white/20'}`} />
          </div>

          <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
            <h2 className="text-white text-xl mb-6" style={{ fontWeight: 700 }}>
              ⚙️ {t(lang, 'settings_title')}
            </h2>

            <div className="space-y-3">
              {/* ═══ LANGUAGE TOGGLE ═══ */}
              <div className={`rounded-2xl p-4 ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00D1FF]/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-[#00D1FF]" />
                    </div>
                    <div>
                      <p className="text-white text-sm" style={{ fontWeight: 600 }}>{t(lang, 'language')}</p>
                      <p className="text-white/50 text-xs">{lang === 'en' ? 'English' : 'العربية'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => onLangChange('en')}
                      className={`px-4 py-2 rounded-lg text-xs transition-all ${
                        lang === 'en'
                          ? 'bg-[#00D1FF] text-[#05070A] shadow-[0_0_10px_rgba(0,209,255,0.4)]'
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                      style={{ fontWeight: 600 }}
                    >EN</button>
                    <button
                      onClick={() => onLangChange('ar')}
                      className={`px-4 py-2 rounded-lg text-xs transition-all ${
                        lang === 'ar'
                          ? 'bg-[#00D1FF] text-[#05070A] shadow-[0_0_10px_rgba(0,209,255,0.4)]'
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                      style={{ fontWeight: 600 }}
                    >AR</button>
                  </div>
                </div>
              </div>

              {/* ═══ BLACKOUT MODE TOGGLE ═══ */}
              <div className={`rounded-2xl p-4 ${blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm" style={{ fontWeight: 600 }}>{t(lang, 'blackout_mode')}</p>
                      <p className="text-white/50 text-xs">{t(lang, 'blackout_desc')}</p>
                    </div>
                  </div>
                  <button
                    onClick={onBlackoutToggle}
                    className={`w-14 h-8 rounded-full transition-all p-1 ${
                      blackout
                        ? 'bg-[#00FF95] shadow-[0_0_10px_rgba(0,255,149,0.4)]'
                        : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transition-transform shadow-lg ${
                        blackout ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* ═══ MENU ITEMS ═══ */}
              {[
                { icon: Phone, label: t(lang, 'emergency_contacts'), color: '#FF3B3B' },
                { icon: Shield, label: t(lang, 'privacy'), color: '#00D1FF' },
                { icon: Info, label: t(lang, 'about'), color: '#00FF95' },
              ].map((item, i) => (
                <button
                  key={i}
                  className={`w-full flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-white/10 ${
                    blackout ? 'bg-[#111] border border-[#333]' : 'backdrop-blur-xl bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: `${item.color}20` }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-white text-sm" style={{ fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </button>
              ))}
            </div>

            {/* Version */}
            <p className="text-center text-white/30 text-xs mt-6">
              {t(lang, 'version')} 2.3.0 — Guardian Vanguard
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
