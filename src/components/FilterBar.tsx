import React from 'react';
import { translations } from '../translations';
import type { Language } from '../types';
import { Search, Radio, RotateCw, Filter } from 'lucide-react';

interface FilterBarProps {
  currentFilter: 'all' | 'live' | 'upcoming' | 'finished';
  onSetFilter: (filter: 'all' | 'live' | 'upcoming' | 'finished') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  lang: Language;
  onRefresh: () => void;
  isRefreshing: boolean;
  liveCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onSetFilter,
  searchQuery,
  onSearchChange,
  lang,
  onRefresh,
  isRefreshing,
  liveCount,
}) => {
  const t = translations[lang];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-x-auto no-scrollbar">
          <button
            id="filter-all"
            onClick={() => onSetFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              currentFilter === 'all'
                ? 'bg-[#ffcc00] text-black shadow-[0_0_12px_rgba(255,204,0,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <span>{t.allMatches}</span>
          </button>

          <button
            id="filter-live"
            onClick={() => onSetFilter('live')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentFilter === 'live'
                ? 'bg-red-600 text-white shadow-[0_0_14px_rgba(239,68,68,0.4)]'
                : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>{t.liveNow}</span>
            {liveCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                {liveCount}
              </span>
            )}
          </button>

          <button
            id="filter-upcoming"
            onClick={() => onSetFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              currentFilter === 'upcoming'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <span>{t.upcoming}</span>
          </button>

          <button
            id="filter-finished"
            onClick={() => onSetFilter('finished')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              currentFilter === 'finished'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <span>{t.finished}</span>
          </button>
        </div>

        {/* Search & Refresh Bar */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 pointer-events-none" />
            <input
              type="text"
              id="match-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl py-2 px-3 pl-9 rtl:pl-3 rtl:pr-9 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffcc00]/70 focus:ring-1 focus:ring-[#ffcc00]/30 transition-all"
            />
          </div>

          <button
            id="btn-refresh-matches"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-[#ffcc00] transition-colors cursor-pointer flex-shrink-0"
            title={t.refresh}
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ffcc00]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
