import React from 'react';
import { translations } from '../translations';
import type { Language } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  lang: Language;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
  lang,
}) => {
  const t = translations[lang];

  // Generate 7 days centered around today
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];

  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setDate(todayObj.getDate() + i);
    const dStr = d.toISOString().split('T')[0];

    const dayName = d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'short',
    });
    const monthName = d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
    });
    const dayNum = d.getDate();

    days.push({
      dateStr: dStr,
      dayName,
      monthName,
      dayNum,
      isToday: dStr === todayStr,
    });
  }

  const setRelativeDay = (offset: number) => {
    const d = new Date();
    d.setDate(todayObj.getDate() + offset);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-[#0c0c10] border-y border-zinc-800/80 py-3.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Quick Quick Jumps */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
          <button
            id="btn-yesterday"
            onClick={() => setRelativeDay(-1)}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            {t.yesterday}
          </button>
          <button
            id="btn-today"
            onClick={() => setRelativeDay(0)}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              selectedDate === todayStr
                ? 'bg-[#ffcc00] text-black shadow-[0_0_10px_rgba(255,204,0,0.3)]'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {t.today}
          </button>
          <button
            id="btn-tomorrow"
            onClick={() => setRelativeDay(1)}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            {t.tomorrow}
          </button>

          {/* Custom Date Input */}
          <div className="relative flex items-center ml-2 rtl:mr-2 rtl:ml-0">
            <input
              type="date"
              id="custom-date-picker"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="w-8 h-7 opacity-0 absolute cursor-pointer"
              title={t.selectDate}
            />
            <div className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-[#ffcc00] pointer-events-none">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 7-Day Horizontal Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto justify-start sm:justify-center no-scrollbar">
          {days.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                id={`date-tab-${item.dateStr}`}
                onClick={() => onSelectDate(item.dateStr)}
                className={`flex-shrink-0 min-w-[70px] sm:min-w-[75px] py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#ffcc00] to-[#e6b800] text-black border-[#ffcc00] font-black shadow-[0_4px_16px_rgba(255,204,0,0.25)] scale-105'
                    : 'bg-zinc-900/90 text-zinc-300 hover:text-white border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`text-[10px] font-bold block uppercase tracking-wider ${
                      isSelected ? 'text-black/80' : 'text-zinc-400'
                    }`}
                  >
                    {item.dayName}
                  </span>
                  {item.isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffcc00]" />
                  )}
                </div>
                <span className="text-lg font-extrabold block leading-tight mt-0.5">
                  {item.dayNum}
                </span>
                <span
                  className={`text-[9px] block ${
                    isSelected ? 'text-black/70 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {item.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
