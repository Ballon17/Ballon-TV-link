import React from 'react';
import { translations } from '../translations';
import type { Match, Language } from '../types';
import { Trophy, Tv, Mic, Play, MapPin, Clock, Edit3 } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (match: Match) => void;
  lang: Language;
  isLoading: boolean;
  onEditMatch?: (match: Match) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  onSelectMatch,
  lang,
  isLoading,
  onEditMatch,
}) => {
  const t = translations[lang];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-[#ffcc00] animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-zinc-300">
          {lang === 'ar' ? 'جاري مزامنة بيانات المباريات عبر Mondepro Engine...' : 'Syncing matches via Mondepro Engine...'}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          {lang === 'ar' ? 'يتم فحص خوادم البروكسي المشفرة وتحديث النتائج المباشرة' : 'Verifying encrypted proxy nodes and updating scores'}
        </p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-600">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">{t.noMatches}</h3>
        <p className="text-xs text-zinc-500">
          {lang === 'ar'
            ? 'جرب اختيار تاريخ آخر من شريط التقويم بالأعلى أو تغيير معايير البحث.'
            : 'Try selecting a different date from the calendar or changing search criteria.'}
        </p>
      </div>
    );
  }

  // Group matches by league
  const grouped: Record<string, Match[]> = {};
  matches.forEach((m) => {
    const lName = m.league || 'مباريات ودية / عامة';
    if (!grouped[lName]) grouped[lName] = [];
    grouped[lName].push(m);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 space-y-6">
      {Object.entries(grouped).map(([leagueName, leagueMatches]) => (
        <div key={leagueName} className="space-y-3">
          {/* League Header */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent border-l-4 rtl:border-l-0 rtl:border-r-4 border-[#ffcc00] shadow-sm">
            <Trophy className="w-4 h-4 text-[#ffcc00] flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
              {leagueName}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 mr-auto rtl:mr-0 rtl:ml-auto">
              {leagueMatches.length} {lang === 'ar' ? 'مباريات' : 'Matches'}
            </span>
          </div>

          {/* Matches Grid / List */}
          <div className="grid grid-cols-1 gap-3">
            {leagueMatches.map((m) => {
              const isLive = m.status === '1';
              const isFinished = m.status === '2';

              return (
                <div
                  key={m.id}
                  id={`match-card-${m.id}`}
                  onClick={() => onSelectMatch(m)}
                  className="group relative bg-[#0e0e13] hover:bg-[#13131a] rounded-2xl p-4 sm:p-5 border border-zinc-800/80 hover:border-[#ffcc00]/50 transition-all duration-200 shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] cursor-pointer overflow-hidden"
                >
                  {/* Status Ribbon */}
                  {isLive ? (
                    <div className="absolute top-0 left-0 rtl:left-auto rtl:right-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-br-xl rtl:rounded-br-none rtl:rounded-bl-xl flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>{t.statusLive}</span>
                    </div>
                  ) : isFinished ? (
                    <div className="absolute top-0 left-0 rtl:left-auto rtl:right-0 bg-zinc-800 text-zinc-400 text-[10px] font-bold px-3 py-0.5 rounded-br-xl rtl:rounded-br-none rtl:rounded-bl-xl">
                      {t.statusFinished}
                    </div>
                  ) : null}

                  {/* Main Grid: Home Team - Score/Time - Away Team */}
                  <div className="grid grid-cols-3 sm:grid-cols-[1fr_120px_1fr] items-center gap-2 sm:gap-4 my-2">
                    {/* Home Team */}
                    <div className="flex flex-col items-center text-center group-hover:scale-105 transition-transform">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-2 flex items-center justify-center mb-2 shadow-inner">
                        <img
                          src={m.home_logo}
                          alt={m.home}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://ui-avatars.com/api/?name=' +
                              encodeURIComponent(m.home.charAt(0)) +
                              '&background=222&color=ffcc00';
                          }}
                          className="w-full h-full object-contain filter drop-shadow"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white line-clamp-1">
                        {m.home}
                      </span>
                    </div>

                    {/* Score / Status Center */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="px-3 sm:px-4 py-1.5 rounded-xl bg-black border border-zinc-800 text-center min-w-[75px] sm:min-w-[90px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                        <span
                          className={`text-lg sm:text-2xl font-black font-mono tracking-wider ${
                            isLive
                              ? 'text-[#ffcc00] drop-shadow-[0_0_8px_rgba(255,204,0,0.5)]'
                              : 'text-zinc-200'
                          }`}
                        >
                          {m.score || 'vs'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-[11px] text-zinc-400 font-semibold">
                        <Clock className="w-3 h-3 text-[#ffcc00]" />
                        <span>{m.time}</span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center text-center group-hover:scale-105 transition-transform">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-2 flex items-center justify-center mb-2 shadow-inner">
                        <img
                          src={m.away_logo}
                          alt={m.away}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://ui-avatars.com/api/?name=' +
                              encodeURIComponent(m.away.charAt(0)) +
                              '&background=222&color=ffcc00';
                          }}
                          className="w-full h-full object-contain filter drop-shadow"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-black text-white line-clamp-1">
                        {m.away}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Footer: Channel, Commentator, Watch Button */}
                  <div className="mt-4 pt-3 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Tv className="w-3.5 h-3.5 text-[#ffcc00]" />
                        <span className="text-zinc-300 font-medium">
                          {m.channel || 'beIN SPORTS 1 HD'}
                        </span>
                      </span>

                      {m.commentary && (
                        <span className="flex items-center gap-1 hidden sm:flex">
                          <Mic className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{m.commentary}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {onEditMatch && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditMatch(m);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                          title={lang === 'ar' ? 'تعديل المباراة' : 'Edit match'}
                        >
                          <Edit3 className="w-3 h-3 text-[#ffcc00]" />
                          <span className="hidden sm:inline">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMatch(m);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#ffcc00]/10 hover:bg-[#ffcc00] text-[#ffcc00] hover:text-black border border-[#ffcc00]/30 hover:border-[#ffcc00] text-xs font-black transition-all flex items-center gap-1.5 shadow-sm group-hover:bg-[#ffcc00] group-hover:text-black"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t.watchLive}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
