import React, { useState } from 'react';
import type { Match, Language } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Radio,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';

interface MatchesDashboardProps {
  matches: Match[];
  lang: Language;
}

const STATUS_COLORS = {
  live: '#ef4444',     // Red
  upcoming: '#ffcc00', // Gold/Yellow
  finished: '#71717a', // Slate/Zinc
};

const LEAGUE_COLORS = ['#ffcc00', '#3b82f6', '#10b981', '#a855f7', '#f97316', '#06b6d4'];

export const MatchesDashboard: React.FC<MatchesDashboardProps> = ({ matches, lang }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeChart, setActiveChart] = useState<'status' | 'leagues'>('status');

  // Compute status metrics
  const liveCount = matches.filter((m) => m.status === '1').length;
  const upcomingCount = matches.filter((m) => m.status === '0').length;
  const finishedCount = matches.filter((m) => m.status === '2').length;
  const totalCount = matches.length;

  const statusData = [
    {
      name: lang === 'ar' ? 'مباشر الآن 🔴' : 'Live Now',
      count: liveCount,
      color: STATUS_COLORS.live,
    },
    {
      name: lang === 'ar' ? 'مباريات قادمة' : 'Upcoming',
      count: upcomingCount,
      color: STATUS_COLORS.upcoming,
    },
    {
      name: lang === 'ar' ? 'مباريات منتهية' : 'Finished',
      count: finishedCount,
      color: STATUS_COLORS.finished,
    },
  ];

  // Group by leagues
  const leagueCounts: Record<string, number> = {};
  matches.forEach((m) => {
    const raw = m.league || 'دوري عام';
    // Shorten long league names for chart
    const shortened = raw.split('|')[0].trim();
    leagueCounts[shortened] = (leagueCounts[shortened] || 0) + 1;
  });

  const leagueData = Object.entries(leagueCounts).map(([name, count]) => ({
    name,
    count,
  }));

  if (totalCount === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-3 pb-2 w-full">
      <div className="rounded-2xl bg-[#0c0c12] border border-zinc-800 shadow-xl overflow-hidden transition-all">
        {/* Dashboard Header Bar */}
        <div className="bg-[#121219] px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center text-[#ffcc00]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'لوحة تحليلات وإحصائيات المباريات' : 'Matches Analytics Dashboard'}</span>
                {liveCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>{liveCount} {lang === 'ar' ? 'مباشر الآن' : 'Live'}</span>
                  </span>
                )}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                {lang === 'ar'
                  ? 'رصد فوري لتوزيع المباريات حسب الحالة والدوريات والبطولات'
                  : 'Live distribution of fixtures by status and leagues powered by Recharts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart view selector */}
            <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveChart('status')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeChart === 'status'
                    ? 'bg-[#ffcc00] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'الحالات' : 'Status'}
              </button>
              <button
                type="button"
                onClick={() => setActiveChart('leagues')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeChart === 'leagues'
                    ? 'bg-[#ffcc00] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'الدوريات' : 'Leagues'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-4 border-b border-zinc-800/80 divide-x rtl:divide-x-reverse divide-zinc-800/80 bg-zinc-950/40">
          <div className="p-2 sm:p-3 text-center">
            <span className="text-[10px] text-zinc-400 font-semibold block">
              {lang === 'ar' ? 'إجمالي المباريات' : 'Total Fixtures'}
            </span>
            <span className="text-sm sm:text-lg font-black text-white font-mono">{totalCount}</span>
          </div>

          <div className="p-2 sm:p-3 text-center bg-red-950/10">
            <span className="text-[10px] text-red-400 font-semibold flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {lang === 'ar' ? 'مباشر الآن' : 'Live Now'}
            </span>
            <span className="text-sm sm:text-lg font-black text-red-400 font-mono">{liveCount}</span>
          </div>

          <div className="p-2 sm:p-3 text-center bg-amber-950/10">
            <span className="text-[10px] text-[#ffcc00] font-semibold block">
              {lang === 'ar' ? 'قادمة اليوم' : 'Upcoming'}
            </span>
            <span className="text-sm sm:text-lg font-black text-[#ffcc00] font-mono">{upcomingCount}</span>
          </div>

          <div className="p-2 sm:p-3 text-center">
            <span className="text-[10px] text-zinc-400 font-semibold block">
              {lang === 'ar' ? 'انتهت' : 'Finished'}
            </span>
            <span className="text-sm sm:text-lg font-black text-zinc-300 font-mono">{finishedCount}</span>
          </div>
        </div>

        {/* Charts Expandable Container */}
        {!isCollapsed && (
          <div className="p-4 bg-gradient-to-b from-[#0a0a10] to-[#0d0d14]">
            {activeChart === 'status' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Status Bar Chart */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12121a',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {statusData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Pie Chart */}
                <div className="h-44 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={62}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12121a',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* Leagues Bar Chart */
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leagueData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#71717a"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12121a',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#ffcc00" radius={[6, 6, 0, 0]}>
                      {leagueData.map((_, index) => (
                        <Cell
                          key={`league-cell-${index}`}
                          fill={LEAGUE_COLORS[index % LEAGUE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
