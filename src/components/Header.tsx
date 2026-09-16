import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import type { Language } from '../types';
import { Shield, Headphones, Globe, Radio, Sparkles, Trophy, Calendar, ListFilter } from 'lucide-react';

interface HeaderProps {
  lang: Language;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onToggleLang: () => void;
  onOpenAdmin: () => void;
  onOpenSupport: () => void;
  isAdminAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  currentPath = '/',
  onNavigate,
  onToggleLang,
  onOpenAdmin,
  onOpenSupport,
  isAdminAuthenticated = false,
}) => {
  const t = translations[lang];
  const [timeStr, setTimeStr] = useState<string>('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-xl border-b border-[#ffcc00]/20 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Edition */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('/')}
            className="flex items-center gap-3 text-left rtl:text-right cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffcc00] via-[#f59e0b] to-[#d97706] p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.3)] transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#0d0d11] rounded-[10px] flex items-center justify-center">
                <span className="font-black text-lg text-[#ffcc00] tracking-tighter">M</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl md:text-2xl font-black tracking-tight text-white">
                  {t.brand}
                  <span className="text-[#ffcc00] drop-shadow-[0_0_10px_rgba(255,204,0,0.6)]">
                    {t.brandSuffix}
                  </span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffcc00]/10 text-[#ffcc00] border border-[#ffcc00]/30 tracking-wider">
                  ULTRA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                {t.edition}
              </p>
            </div>
          </button>
        </div>

        {/* Center: Live Match status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-zinc-300 font-bold">{lang === 'ar' ? 'بث مباشر عالي الدقة بدون تقطيع' : 'HD Ultra Live Streams'}</span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-[#ffcc00]">{timeStr}</span>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* 24/7 Support Trigger */}
          <button
            id="btn-support"
            onClick={onOpenSupport}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={t.supportTitle}
          >
            <Headphones className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span className="hidden lg:inline">{t.adminTabSupport}</span>
          </button>

          {/* Language Switcher */}
          <button
            id="btn-lang"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'English' : 'العربية'}</span>
            <span className="sm:hidden">{lang === 'ar' ? 'EN' : 'AR'}</span>
          </button>

          {/* Discrete Admin Link (Directs to /admin protected page) */}
          <button
            id="btn-admin-discrete"
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAdminAuthenticated
                ? 'bg-[#ffcc00] text-black font-black shadow-[0_0_10px_rgba(255,204,0,0.3)]'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-[#ffcc00] border border-zinc-800 hover:border-[#ffcc00]/40'
            }`}
            title={lang === 'ar' ? 'بوابة لوحة التحكم المحمية للمشرف' : 'Protected Admin Panel'}
          >
            <Shield className={`w-3.5 h-3.5 ${isAdminAuthenticated ? 'text-black' : 'text-[#ffcc00]'}`} />
            <span className="hidden sm:inline">
              {isAdminAuthenticated ? (lang === 'ar' ? 'لوحة التحكم' : 'Admin Panel') : (lang === 'ar' ? 'المشرف 🔒' : 'Admin 🔒')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
