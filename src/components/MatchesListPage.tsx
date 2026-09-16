import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, Language } from '../types';
import { translations } from '../translations';
import {
  Trophy,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  Filter,
  Calendar,
  Clock,
  Radio,
  Tv,
  Mic,
  MapPin,
  Edit3,
  Trash2,
  Play,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Download,
  AlertCircle,
  X,
  Save,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface MatchesListPageProps {
  lang: Language;
  onNavigateHome: () => void;
  onPlayMatch: (match: Match) => void;
  onEditMatch: (match: Match) => void;
}

export const MatchesListPage: React.FC<MatchesListPageProps> = ({
  lang,
  onNavigateHome,
  onPlayMatch,
  onEditMatch
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    upcoming: 0,
    finished: 0,
    datesCount: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | '0' | '1' | '2'>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Add Match Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Match Form
  const [newHome, setNewHome] = useState<string>('ريال مدريد');
  const [newAway, setNewAway] = useState<string>('برشلونة');
  const [newLeague, setNewLeague] = useState<string>('الدوري الإسباني | La Liga');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('21:00');
  const [newChannel, setNewChannel] = useState<string>('beIN SPORTS 1 HD');
  const [newCommentary, setNewCommentary] = useState<string>('عصام الشوالي');
  const [newStadium, setNewStadium] = useState<string>('سانتياغو برنابيو');
  const [newScore, setNewScore] = useState<string>('vs');
  const [newStatus, setNewStatus] = useState<'0' | '1' | '2'>('0');
  const [newStreamUrl, setNewStreamUrl] = useState<string>('');

  // Quick Score Edit modal
  const [editingScoreMatch, setEditingScoreMatch] = useState<Match | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Fetch all matches from backend
  const loadAllMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/matches/all');
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setMatches(data.matches);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load all matches:', err);
      showToast(lang === 'ar' ? 'فشل تحميل المباريات من السيرفر' : 'Failed to load matches from server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadAllMatches();
  }, [loadAllMatches]);

  // Extract unique leagues and dates
  const availableLeagues = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(m => {
      if (m.league) set.add(m.league);
    });
    return Array.from(set);
  }, [matches]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    matches.forEach(m => {
      if (m.date) set.add(m.date);
    });
    return Array.from(set).sort().reverse();
  }, [matches]);

  // Filtered matches
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Status filter
      if (statusFilter !== 'all' && String(m.status) !== statusFilter) {
        return false;
      }
      // League filter
      if (leagueFilter !== 'all' && m.league !== leagueFilter) {
        return false;
      }
      // Date filter
      if (dateFilter !== 'all' && m.date !== dateFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchHome = m.home?.toLowerCase().includes(q);
        const matchAway = m.away?.toLowerCase().includes(q);
        const matchLeague = m.league?.toLowerCase().includes(q);
        const matchChannel = m.channel?.toLowerCase().includes(q);
        const matchCommentary = m.commentary?.toLowerCase().includes(q);
        const matchStadium = m.stadium?.toLowerCase().includes(q);
        const matchDate = m.date?.toLowerCase().includes(q);
        return matchHome || matchAway || matchLeague || matchChannel || matchCommentary || matchStadium || matchDate;
      }
      return true;
    });
  }, [matches, statusFilter, leagueFilter, dateFilter, searchQuery]);

  // Quick toggle status (0 -> 1 -> 2 -> 0)
  const handleToggleStatus = async (match: Match) => {
    let nextStatus: '0' | '1' | '2' = '0';
    if (match.status === '0') nextStatus = '1';
    else if (match.status === '1') nextStatus = '2';
    else nextStatus = '0';

    const updated = { ...match, status: nextStatus };

    // Optimistic UI update
    setMatches(prev => prev.map(m => (m.id === match.id ? updated : m)));

    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'ar'
            ? `تم تغيير حالة المباراة إلى: ${nextStatus === '1' ? 'مباشر' : nextStatus === '2' ? 'انتهت' : 'لم تبدأ'}`
            : `Match status updated to: ${nextStatus === '1' ? 'Live' : nextStatus === '2' ? 'Finished' : 'Upcoming'}`
        );
        loadAllMatches();
      }
    } catch (err) {
      console.error(err);
      loadAllMatches();
    }
  };

  // Quick Score Update
  const handleSaveScore = async () => {
    if (!editingScoreMatch) return;
    const updated = { ...editingScoreMatch, score: scoreInput.trim() || 'vs' };

    setMatches(prev => prev.map(m => (m.id === editingScoreMatch.id ? updated : m)));
    setEditingScoreMatch(null);

    try {
      const res = await fetch(`/api/matches/${editingScoreMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        showToast(t.matchUpdated);
        loadAllMatches();
      }
    } catch (err) {
      console.error(err);
      loadAllMatches();
    }
  };

  // Delete Match
  const handleDeleteMatch = async (id: string, matchName: string) => {
    const confirmMsg =
      lang === 'ar'
        ? `هل أنت متأكد من رغبتك في حذف مباراة "${matchName}" نهائياً من قاعدة البيانات؟`
        : `Are you sure you want to permanently delete match "${matchName}"?`;
    if (!window.confirm(confirmMsg)) return;

    setMatches(prev => prev.filter(m => m.id !== id));

    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(t.matchDeleted);
        loadAllMatches();
      }
    } catch (err) {
      console.error('Failed to delete match:', err);
      loadAllMatches();
    }
  };

  // Create New Match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHome || !newAway) return;

    setIsSubmitting(true);
    try {
      const createdStreams = newStreamUrl.trim()
        ? [
            {
              id: 'match-stream-' + Date.now(),
              channelName: newChannel.trim() || `${newHome} vs ${newAway}`,
              serverName: 'سيرفر 1 - فائق السرعة CDN',
              streamUrl: newStreamUrl.trim(),
              playerType: (newStreamUrl.endsWith('.m3u8')
                ? 'hls'
                : newStreamUrl.includes('/embed') || newStreamUrl.includes('<iframe')
                ? 'iframe'
                : 'video') as any,
              quality: '1080p 60fps' as const,
              isActive: true,
              priority: 1,
              latencyMs: 35,
            },
          ]
        : [];

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home: newHome.trim(),
          away: newAway.trim(),
          league: newLeague.trim(),
          date: newDate,
          time: newTime.trim(),
          channel: newChannel.trim(),
          commentary: newCommentary.trim(),
          stadium: newStadium.trim(),
          score: newScore.trim() || 'vs',
          status: newStatus,
          streams: createdStreams,
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewStreamUrl('');
        showToast(t.matchAdded);
        loadAllMatches();
      }
    } catch (err) {
      console.error('Failed to create match:', err);
      showToast(lang === 'ar' ? 'فشل إضافة المباراة' : 'Failed to add match', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (filteredMatches.length === 0) return;
    const headers = ['ID', 'Date', 'Time', 'League', 'Home', 'Away', 'Score', 'Status', 'Channel', 'Commentary', 'Stadium'];
    const rows = filteredMatches.map(m => [
      m.id,
      m.date,
      m.time,
      `"${m.league.replace(/"/g, '""')}"`,
      `"${m.home.replace(/"/g, '""')}"`,
      `"${m.away.replace(/"/g, '""')}"`,
      `"${m.score}"`,
      m.status === '1' ? 'Live' : m.status === '2' ? 'Finished' : 'Upcoming',
      `"${(m.channel || '').replace(/"/g, '""')}"`,
      `"${(m.commentary || '').replace(/"/g, '""')}"`,
      `"${(m.stadium || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mondepro_matches_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Presets for quick generation
  const applyPreset = (home: string, away: string, league: string, ch: string, comm: string, stad: string) => {
    setNewHome(home);
    setNewAway(away);
    setNewLeague(league);
    setNewChannel(ch);
    setNewCommentary(comm);
    setNewStadium(stad);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-['Cairo',sans-serif]">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 backdrop-blur-md'
              : 'bg-red-950/90 border-red-500/40 text-red-300 backdrop-blur-md'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span className="text-xs sm:text-sm font-bold">{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="ms-auto p-1 rounded hover:bg-white/10 text-white/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Page Banner */}
      <div className="bg-[#0b0b0f] border-b border-zinc-800/80 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-[#ffcc00] transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
              title={t.backToHome}
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{t.backToHome}</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#ffcc00]" />
                  <span>{t.matchesManagement}</span>
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#ffcc00]/15 text-[#ffcc00] border border-[#ffcc00]/30 font-extrabold">
                  /matches-list
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">
                {t.matchesListSub}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={loadAllMatches}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#ffcc00] ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t.refresh}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,204,0,0.3)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewMatch}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Statistics Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-[#0e0e14] border border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-bold">{t.totalMatches}</span>
              <Trophy className="w-4 h-4 text-[#ffcc00]" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{stats.total}</div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {stats.datesCount} {lang === 'ar' ? 'تواريخ مجدولة' : 'scheduled dates'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e0e14] border border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-bold">{t.liveNow}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="text-2xl font-black text-red-400 font-mono">{stats.live}</div>
            <div className="text-[10px] text-red-400/80 mt-1 flex items-center gap-1">
              <Radio className="w-3 h-3" />
              <span>{lang === 'ar' ? 'بث مباشر نشط' : 'Active Broadcasts'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e0e14] border border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-bold">{t.upcoming}</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono">{stats.upcoming}</div>
            <div className="text-[10px] text-blue-400/80 mt-1">
              {lang === 'ar' ? 'جاهزة للانطلاق' : 'Ready to start'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e0e14] border border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-bold">{t.finished}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-zinc-300 font-mono">{stats.finished}</div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {lang === 'ar' ? 'مباريات منتهية' : 'Ended matches'}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-4 rounded-2xl bg-[#0e0e14] border border-zinc-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-bold">{lang === 'ar' ? 'البطولات والدوريات' : 'Active Leagues'}</span>
              <Sparkles className="w-4 h-4 text-[#ffcc00]" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{availableLeagues.length}</div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {lang === 'ar' ? 'دوريات مختلفة' : 'Distinct leagues'}
            </div>
          </div>
        </div>

        {/* Filter, Search & View Mode Controls Bar */}
        <div className="rounded-2xl bg-[#0e0e14] border border-zinc-800/80 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchMatchesPlaceholder}
                className={`w-full bg-[#13131a] border border-zinc-800 rounded-xl ${
                  isRtl ? 'pr-10 pl-9' : 'pl-10 pr-9'
                } py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffcc00] transition-colors`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#13131a] border border-zinc-800 rounded-xl p-1 self-end lg:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#ffcc00] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={t.viewModeTable}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.viewModeTable}</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#ffcc00] text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={t.viewModeGrid}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.viewModeGrid}</span>
              </button>
            </div>
          </div>

          {/* Filters row: Status, League, Date */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60 text-xs">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-[#13131a] p-1 rounded-xl border border-zinc-800/80">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#ffcc00] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.allMatches} ({matches.length})
              </button>
              <button
                onClick={() => setStatusFilter('1')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === '1'
                    ? 'bg-red-500 text-white'
                    : 'text-zinc-400 hover:text-red-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span>{t.liveNow} ({stats.live})</span>
              </button>
              <button
                onClick={() => setStatusFilter('0')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  statusFilter === '0'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-blue-400'
                }`}
              >
                {t.upcoming} ({stats.upcoming})
              </button>
              <button
                onClick={() => setStatusFilter('2')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  statusFilter === '2'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {t.finished} ({stats.finished})
              </button>
            </div>

            {/* League Dropdown Filter */}
            <div className="flex items-center gap-1 bg-[#13131a] border border-zinc-800/80 rounded-xl px-2.5 py-1">
              <Trophy className="w-3.5 h-3.5 text-[#ffcc00]" />
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#13131a]">{t.allLeagues}</option>
                {availableLeagues.map(lg => (
                  <option key={lg} value={lg} className="bg-[#13131a]">{lg}</option>
                ))}
              </select>
            </div>

            {/* Date Dropdown Filter */}
            <div className="flex items-center gap-1 bg-[#13131a] border border-zinc-800/80 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-[#ffcc00]" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#13131a]">{t.allDates}</option>
                {availableDates.map(d => (
                  <option key={d} value={d} className="bg-[#13131a]">{d}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters button if any is active */}
            {(searchQuery || statusFilter !== 'all' || leagueFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setLeagueFilter('all');
                  setDateFilter('all');
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer ms-auto"
              >
                {lang === 'ar' ? 'إلغاء التصفية' : 'Reset Filters'}
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && matches.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#ffcc00] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-xs font-semibold">
              {lang === 'ar' ? 'جاري جلب كافة المباريات من قاعدة البيانات...' : 'Fetching all matches from database...'}
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center rounded-2xl bg-[#0e0e14] border border-zinc-800 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">{t.noMatchesFound}</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {lang === 'ar'
                ? 'لا توجد مباريات تطابق معايير البحث الحالية. يمكنك تغيير كلمة البحث أو إضافة مباراة جديدة الآن.'
                : 'No matches found matching your filters. Try different keywords or add a new match.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ffcc00] text-black text-xs font-black cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewMatch}</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* DETAILED TABLE VIEW */
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e14] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-[#12121a] text-zinc-400 font-bold border-b border-zinc-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">{t.teamsLabel}</th>
                    <th className="p-3.5">{t.scoreLabel}</th>
                    <th className="p-3.5">{t.statusLabel}</th>
                    <th className="p-3.5">{t.dateLabel} & {t.timeLabel}</th>
                    <th className="p-3.5 hidden md:table-cell">{t.detailsLabel}</th>
                    <th className="p-3.5 text-center">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-[#0e0e14]">
                  {filteredMatches.map((match) => (
                    <tr
                      key={match.id}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Teams & League */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#ffcc00] block truncate max-w-xs">
                            {match.league}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={match.home_logo || 'https://ui-avatars.com/api/?name=H&background=222&color=fff'}
                                alt={match.home}
                                className="w-5 h-5 object-contain rounded-full bg-zinc-800 p-0.5"
                                onError={(e: any) => {
                                  e.target.src = 'https://ui-avatars.com/api/?name=H&background=222&color=fff';
                                }}
                              />
                              <span className="font-extrabold text-white text-xs sm:text-sm">
                                {match.home}
                              </span>
                            </div>
                            <span className="text-zinc-600 font-bold text-xs">VS</span>
                            <div className="flex items-center gap-2">
                              <img
                                src={match.away_logo || 'https://ui-avatars.com/api/?name=A&background=222&color=fff'}
                                alt={match.away}
                                className="w-5 h-5 object-contain rounded-full bg-zinc-800 p-0.5"
                                onError={(e: any) => {
                                  e.target.src = 'https://ui-avatars.com/api/?name=A&background=222&color=fff';
                                }}
                              />
                              <span className="font-extrabold text-white text-xs sm:text-sm">
                                {match.away}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Score with Quick Edit Button */}
                      <td className="p-3.5">
                        <button
                          onClick={() => {
                            setEditingScoreMatch(match);
                            setScoreInput(match.score);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 font-mono font-black text-sm text-white hover:text-[#ffcc00] transition-colors flex items-center gap-1.5 cursor-pointer"
                          title={t.quickScoreUpdate}
                        >
                          <span>{match.score}</span>
                          <Edit3 className="w-3 h-3 text-zinc-500 opacity-60 group-hover:opacity-100" />
                        </button>
                      </td>

                      {/* Status Badge with Click-to-Toggle */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleStatus(match)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer ${
                            match.status === '1'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : match.status === '2'
                              ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                          title={t.quickStatusChange}
                        >
                          {match.status === '1' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                          )}
                          <span>
                            {match.status === '1'
                              ? t.statusLive
                              : match.status === '2'
                              ? t.statusFinished
                              : t.statusUpcoming}
                          </span>
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="p-3.5 font-mono">
                        <div className="text-white text-xs font-bold">{match.date}</div>
                        <div className="text-zinc-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#ffcc00]" />
                          <span>{match.time}</span>
                        </div>
                      </td>

                      {/* Broadcast Details */}
                      <td className="p-3.5 hidden md:table-cell text-zinc-400 text-[11px]">
                        <div className="space-y-0.5">
                          {match.channel && (
                            <div className="flex items-center gap-1 text-zinc-300 font-semibold truncate max-w-xs">
                              <Tv className="w-3 h-3 text-[#ffcc00] flex-shrink-0" />
                              <span>{match.channel}</span>
                            </div>
                          )}
                          {match.commentary && (
                            <div className="flex items-center gap-1 text-zinc-400 truncate max-w-xs">
                              <Mic className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                              <span>{match.commentary}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Play Stream */}
                          <button
                            onClick={() => onPlayMatch(match)}
                            className="p-1.5 rounded-lg bg-[#ffcc00]/10 hover:bg-[#ffcc00] text-[#ffcc00] hover:text-black border border-[#ffcc00]/30 transition-all cursor-pointer"
                            title={t.watchLive}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            onClick={() => onEditMatch(match)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title={t.editMatch}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteMatch(match.id, `${match.home} vs ${match.away}`)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title={t.deleteMatch}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-2xl bg-[#0e0e14] border border-zinc-800/80 p-4 shadow-lg hover:border-[#ffcc00]/40 transition-all flex flex-col justify-between group space-y-3"
              >
                {/* Card Header: League & Status */}
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2.5">
                  <span className="text-[11px] font-bold text-[#ffcc00] truncate">
                    {match.league}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(match)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 cursor-pointer ${
                      match.status === '1'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : match.status === '2'
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {match.status === '1' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                    )}
                    <span>
                      {match.status === '1'
                        ? t.statusLive
                        : match.status === '2'
                        ? t.statusFinished
                        : t.statusUpcoming}
                    </span>
                  </button>
                </div>

                {/* Teams & Score */}
                <div className="flex items-center justify-between gap-2 py-1">
                  {/* Home Team */}
                  <div className="flex-1 flex flex-col items-center text-center space-y-1">
                    <img
                      src={match.home_logo || 'https://ui-avatars.com/api/?name=H&background=222&color=fff'}
                      alt={match.home}
                      className="w-10 h-10 object-contain rounded-full bg-zinc-900 p-1 border border-zinc-800"
                      onError={(e: any) => {
                        e.target.src = 'https://ui-avatars.com/api/?name=H&background=222&color=fff';
                      }}
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-white line-clamp-1">
                      {match.home}
                    </span>
                  </div>

                  {/* Score Pill */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => {
                        setEditingScoreMatch(match);
                        setScoreInput(match.score);
                      }}
                      className="px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-mono font-black text-sm text-white hover:text-[#ffcc00] transition-colors"
                      title={t.quickScoreUpdate}
                    >
                      {match.score}
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {match.time}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex flex-col items-center text-center space-y-1">
                    <img
                      src={match.away_logo || 'https://ui-avatars.com/api/?name=A&background=222&color=fff'}
                      alt={match.away}
                      className="w-10 h-10 object-contain rounded-full bg-zinc-900 p-1 border border-zinc-800"
                      onError={(e: any) => {
                        e.target.src = 'https://ui-avatars.com/api/?name=A&background=222&color=fff';
                      }}
                    />
                    <span className="font-extrabold text-xs sm:text-sm text-white line-clamp-1">
                      {match.away}
                    </span>
                  </div>
                </div>

                {/* Details Pill */}
                <div className="bg-[#12121a] rounded-xl p-2.5 text-[11px] text-zinc-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-zinc-300 font-bold truncate">
                      <Tv className="w-3 h-3 text-[#ffcc00]" />
                      <span>{match.channel || 'beIN SPORTS'}</span>
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">{match.date}</span>
                  </div>
                  {match.commentary && (
                    <div className="flex items-center gap-1 text-zinc-400 truncate">
                      <Mic className="w-3 h-3 text-zinc-500" />
                      <span>{match.commentary}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => onPlayMatch(match)}
                    className="flex-1 py-1.5 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t.watchLive}</span>
                  </button>

                  <button
                    onClick={() => onEditMatch(match)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title={t.editMatch}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteMatch(match.id, `${match.home} vs ${match.away}`)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-red-500/20 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    title={t.deleteMatch}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Add New Match */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#0e0e14] border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#ffcc00]" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  {t.addNewMatch}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1.5">
                {lang === 'ar' ? 'قوالب مباريات جاهزة للاختبار السريع:' : 'Quick Fixture Presets:'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'ريال مدريد',
                      'برشلونة',
                      'الدوري الإسباني | La Liga',
                      'beIN SPORTS 1 HD',
                      'عصام الشوالي',
                      'سانتياغو برنابيو'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-bold cursor-pointer"
                >
                  كلاسيكو إسبانيا 🇪🇸
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'الهلال',
                      'النصر',
                      'دوري روشن السعودي | Saudi Pro League',
                      'SSC SPORTS 1 HD',
                      'فهد العتيبي',
                      'المملكة أرينا'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-bold cursor-pointer"
                >
                  ديربي الرياض 🇸🇦
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'ليفربول',
                      'مانشستر سيتي',
                      'الدوري الإنجليزي الممتاز | Premier League',
                      'beIN SPORTS 1 HD',
                      'خليل البلوشي',
                      'أنفيلد'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-bold cursor-pointer"
                >
                  قمة البريميرليج 🏴󠁧󠁢󠁥󠁮󠁧󠁿
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      'الأهلي',
                      'الزمالك',
                      'الدوري المصري الممتاز | Egyptian League',
                      'OnTime Sports 1',
                      'أيمن الكاشف',
                      'ستاد القاهرة'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-bold cursor-pointer"
                >
                  ديربي القاهرة 🇪🇬
                </button>
              </div>
            </div>

            {/* Add Match Form */}
            <form onSubmit={handleCreateMatch} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {lang === 'ar' ? 'الفريق الأول (صاحب الأرض)' : 'Home Team'}
                  </label>
                  <input
                    type="text"
                    value={newHome}
                    onChange={(e) => setNewHome(e.target.value)}
                    required
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {lang === 'ar' ? 'الفريق الثاني (الضيف)' : 'Away Team'}
                  </label>
                  <input
                    type="text"
                    value={newAway}
                    onChange={(e) => setNewAway(e.target.value)}
                    required
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">
                  {lang === 'ar' ? 'اسم الدوري أو البطولة' : 'League / Tournament'}
                </label>
                <input
                  type="text"
                  value={newLeague}
                  onChange={(e) => setNewLeague(e.target.value)}
                  required
                  className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {t.dateLabel}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {t.timeLabel}
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="21:00"
                    required
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {t.scoreLabel}
                  </label>
                  <input
                    type="text"
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                    placeholder="vs"
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {t.statusLabel}
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="0">{t.statusUpcoming} (Upcoming)</option>
                    <option value="1">{t.statusLive} (Live Now)</option>
                    <option value="2">{t.statusFinished} (Finished)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {t.channel}
                  </label>
                  <input
                    type="text"
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    placeholder="beIN SPORTS 1 HD"
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {t.commentary}
                  </label>
                  <input
                    type="text"
                    value={newCommentary}
                    onChange={(e) => setNewCommentary(e.target.value)}
                    placeholder="عصام الشوالي"
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    {t.stadium}
                  </label>
                  <input
                    type="text"
                    value={newStadium}
                    onChange={(e) => setNewStadium(e.target.value)}
                    placeholder="الملعب الرئيسي"
                    className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Stream URL Input */}
              <div className="pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#ffcc00] font-bold text-xs flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#ffcc00]" />
                    <span>{lang === 'ar' ? 'رابط البث المباشر (HLS .m3u8 أو Embed)' : 'Live Stream Link (Optional)'}</span>
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00]"
                    >
                      Mux HLS
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4')}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-400"
                    >
                      MP4 HD
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  value={newStreamUrl}
                  onChange={(e) => setNewStreamUrl(e.target.value)}
                  placeholder="https://example.com/live/match.m3u8"
                  className="w-full bg-[#13131a] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#ffcc00]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black font-black flex items-center gap-1.5 cursor-pointer shadow disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? '...' : t.addNewMatch}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Score Modal */}
      {editingScoreMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#0e0e14] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-[#ffcc00]" />
              <span>{t.quickScoreUpdate}</span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              {editingScoreMatch.home} vs {editingScoreMatch.away}
            </p>

            <input
              type="text"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder="2 - 1"
              autoFocus
              className="w-full bg-[#13131a] border border-[#ffcc00]/40 rounded-xl px-3 py-2 text-center text-lg font-black text-white font-mono focus:outline-none"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingScoreMatch(null)}
                className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveScore}
                className="flex-1 py-1.5 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-xs font-black text-black"
              >
                {t.saveSettings}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
