import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, StreamLink, Language } from './types';
import { Header } from './components/Header';
import { CalendarStrip } from './components/CalendarStrip';
import { FilterBar } from './components/FilterBar';
import { MatchesDashboard } from './components/MatchesDashboard';
import { MatchList } from './components/MatchList';
import { PlayerWrapper } from './components/PlayerWrapper';
import { AdminModal } from './components/AdminModal';
import { EditMatchModal } from './components/EditMatchModal';
import { SupportModal } from './components/SupportModal';
import { MatchesListPage } from './components/MatchesListPage';
import { AdminPanelPage } from './components/AdminPanelPage';
import { QuickStreamBox } from './components/QuickStreamBox';
import { ShieldCheck, Zap, Server, Radio, HelpCircle, Trophy, ListFilter, Lock } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (p === '/admin' || h === '#/admin' || h === '#admin') return '/admin';
      if (p === '/matches-list' || h === '#/matches-list') return '/matches-list';
    }
    return '/';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mondepro_admin_auth') === 'true';
    }
    return false;
  });
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [matches, setMatches] = useState<Match[]>([]);
  const [availableStreams, setAvailableStreams] = useState<StreamLink[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals
  const [activeMatchForPlayer, setActiveMatchForPlayer] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      // Sync auth status from session
      setIsAdminAuthenticated(sessionStorage.getItem('mondepro_admin_auth') === 'true');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (p === '/admin' || h === '#/admin' || h === '#admin') {
        setCurrentPath('/admin');
      } else if (p === '/matches-list' || h === '#/matches-list') {
        setCurrentPath('/matches-list');
      } else {
        setCurrentPath('/');
      }
      setIsAdminAuthenticated(sessionStorage.getItem('mondepro_admin_auth') === 'true');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update HTML document dir and lang attribute
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Fetch matches for selected date
  const fetchMatches = useCallback(async (date: string, showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/matches?date=${date}`);
      const data = await res.json();
      if (data && Array.isArray(data.matches)) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch available stream links
  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/links');
      const data = await res.json();
      if (data && Array.isArray(data.links)) {
        setAvailableStreams(data.links);
      }
    } catch (err) {
      console.error('Error fetching stream links:', err);
    }
  }, []);

  useEffect(() => {
    fetchMatches(selectedDate);
    fetchStreams();
  }, [selectedDate, fetchMatches, fetchStreams]);

  // Auto-refresh live matches every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches(selectedDate, false);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedDate, fetchMatches]);

  // Filter and Search matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Status Filter
      if (filter === 'live' && m.status !== '1') return false;
      if (filter === 'upcoming' && m.status !== '0') return false;
      if (filter === 'finished' && m.status !== '2') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const homeMatch = m.home.toLowerCase().includes(q);
        const awayMatch = m.away.toLowerCase().includes(q);
        const leagueMatch = m.league.toLowerCase().includes(q);
        const channelMatch = (m.channel || '').toLowerCase().includes(q);
        const commentaryMatch = (m.commentary || '').toLowerCase().includes(q);
        return homeMatch || awayMatch || leagueMatch || channelMatch || commentaryMatch;
      }

      return true;
    });
  }, [matches, filter, searchQuery]);

  const liveMatchesCount = useMemo(() => {
    return matches.filter((m) => m.status === '1').length;
  }, [matches]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handlePlayDirectStream = (streamUrl: string, title?: string) => {
    const isM3u8 = streamUrl.includes('.m3u8');
    const isMpd = streamUrl.includes('.mpd');
    const isEmbed = streamUrl.includes('<iframe') || (streamUrl.startsWith('http') && !streamUrl.includes('.m3u8') && !streamUrl.includes('.mp4'));
    const isDirectMp4 = streamUrl.includes('.mp4');

    let pType: 'hls' | 'dash' | 'iframe' | 'video' = 'hls';
    if (isM3u8) pType = 'hls';
    else if (isMpd) pType = 'dash';
    else if (isEmbed) pType = 'iframe';
    else if (isDirectMp4) pType = 'video';

    const directMatch: Match = {
      id: 'stream-direct-' + Date.now(),
      home: title || (lang === 'ar' ? 'بث مباشر فوري' : 'Live Stream Channel'),
      away: 'Mondepro Ultra Player',
      league: 'HD Live Stream',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: selectedDate,
      status: '1',
      score: 'LIVE',
      channel: title || 'سيرفر HLS فائق الدقة',
      commentary: 'صوت الملعب الأصلي',
      home_logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80',
      away_logo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=100&auto=format&fit=crop&q=80',
      streams: [
        {
          id: 'str-' + Date.now(),
          channelName: 'Mondepro Ultra Live',
          serverName: title || (lang === 'ar' ? 'سيرفر 1 - HLS فائق الدقة' : 'Server 1 - HD Live'),
          quality: '1080p 60fps',
          playerType: pType,
          streamUrl: streamUrl,
          isActive: true,
          priority: 1,
          referrer: 'https://rtve.es/',
          origin: 'https://rtve.es'
        }
      ]
    };

    setActiveMatchForPlayer(directMatch);
  };

  const handleAssignStreamToMatch = async (matchId: string, streamUrl: string, serverName?: string): Promise<boolean> => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return false;

    const isM3u8 = streamUrl.includes('.m3u8');
    const isMpd = streamUrl.includes('.mpd');
    const isEmbed = streamUrl.includes('<iframe') || (streamUrl.startsWith('http') && !streamUrl.includes('.m3u8') && !streamUrl.includes('.mp4'));

    let pType: 'hls' | 'dash' | 'iframe' | 'video' = 'hls';
    if (isM3u8) pType = 'hls';
    else if (isMpd) pType = 'dash';
    else if (isEmbed) pType = 'iframe';
    else if (streamUrl.includes('.mp4')) pType = 'video';

    const newStream: StreamLink = {
      id: 'st-' + Date.now(),
      matchId: targetMatch.id,
      channelName: targetMatch.channel || 'HD Channel',
      serverName: serverName || (lang === 'ar' ? `سيرفر ${ (targetMatch.streams?.length || 0) + 1 }` : `Server ${(targetMatch.streams?.length || 0) + 1}`),
      quality: '1080p 60fps',
      playerType: pType,
      streamUrl: streamUrl,
      isActive: true,
      priority: 1,
    };

    const existingStreams = targetMatch.streams || [];
    const updatedMatch: Match = {
      ...targetMatch,
      status: targetMatch.status === '0' ? '1' : targetMatch.status,
      streams: [newStream, ...existingStreams]
    };

    setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMatch)
      });
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error(e);
      return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-['Cairo',sans-serif]">
      {/* Top Header with live clock, proxy status, lang switch, and discrete admin portal */}
      <Header
        lang={lang}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onToggleLang={handleToggleLang}
        onOpenAdmin={() => handleNavigate('/admin')}
        onOpenSupport={() => setIsSupportOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Main View Router */}
      {/* Route Controller */}
      {currentPath === '/admin' ? (
        <AdminPanelPage
          lang={lang}
          onNavigateHome={() => handleNavigate('/')}
          onPlayMatch={(match) => setActiveMatchForPlayer(match)}
        />
      ) : currentPath === '/matches-list' ? (
        <main className="flex-1 pb-16">
          <MatchesListPage
            lang={lang}
            onNavigateHome={() => handleNavigate('/')}
            onPlayMatch={(match) => setActiveMatchForPlayer(match)}
            onEditMatch={isAdminAuthenticated ? (match) => setEditingMatch(match) : undefined}
          />
        </main>
      ) : (
        <>
          {/* Date selector strip */}
          <CalendarStrip
            selectedDate={selectedDate}
            onSelectDate={(newDate) => setSelectedDate(newDate)}
            lang={lang}
          />

          {/* Hero Welcome / System Status Banner */}
          <div className="max-w-7xl mx-auto px-4 pt-2 pb-1 w-full">
            <div className="rounded-2xl bg-gradient-to-r from-[#121218] via-[#161622] to-[#121218] border border-zinc-800/80 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center text-[#ffcc00] flex-shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'مركز مباريات Mondepro الاحترافي' : 'Mondepro Ultra Football Hub'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {lang === 'ar' ? 'مباشر وسريع' : 'Ultra Fast'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    {lang === 'ar'
                      ? 'بث مباشر عالي الدقة عبر بروكسي داخلي مخصص مع مشغل متعدد السيرفرات'
                      : 'High definition streams via resilient dedicated proxy engine and multi-server player'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsSupportOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#ffcc00]" />
                  <span>{lang === 'ar' ? 'دعم فني 24/7' : '24/7 Support'}</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{lang === 'ar' ? 'البث المباشر نشط' : 'Live Streams Ready'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Matches Analytics Dashboard powered by Recharts */}
          <MatchesDashboard matches={matches} lang={lang} />

          {/* Filter and Search Bar */}
          <FilterBar
            currentFilter={filter}
            onSetFilter={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            lang={lang}
            onRefresh={() => fetchMatches(selectedDate, true)}
            isRefreshing={isRefreshing}
            liveCount={liveMatchesCount}
          />

          {/* Main Matches Content */}
          <main className="flex-1 pb-16">
            <MatchList
              matches={filteredMatches}
              onSelectMatch={(match) => setActiveMatchForPlayer(match)}
              onEditMatch={isAdminAuthenticated ? (match) => setEditingMatch(match) : undefined}
              lang={lang}
              isLoading={isLoading}
            />
          </main>
        </>
      )}

      {/* Sticky Bottom Status Footer */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-[#0c0c10]/95 backdrop-blur-md border-t border-zinc-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-300">Mondepro Engine v3.0</span>
            <span className="text-zinc-600">•</span>
            <span>{lang === 'ar' ? 'تشفير آمن TLS 1.3' : 'TLS 1.3 Encrypted'}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-mono">Ping: 38ms</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSupportOpen(true)}
              className="text-zinc-400 hover:text-[#ffcc00] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#ffcc00]" />
              <span>{lang === 'ar' ? 'مركز المساعدة والتشخيص' : 'Help & Diagnostics'}</span>
            </button>

            {/* Discrete Admin Gate Link */}
            <button
              onClick={() => handleNavigate('/admin')}
              className="text-zinc-500 hover:text-[#ffcc00] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              title={lang === 'ar' ? 'بوابة لوحة التحكم المشفرة والمحمية للمشرف' : 'Protected Admin Portal'}
            >
              <Lock className="w-3 h-3 text-[#ffcc00]" />
              <span>{lang === 'ar' ? 'بوابة المشرف 🔒' : 'Admin Portal 🔒'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Player Wrapper Modal */}
      {activeMatchForPlayer && (
        <PlayerWrapper
          match={activeMatchForPlayer}
          onClose={() => setActiveMatchForPlayer(null)}
          lang={lang}
          availableStreams={
            activeMatchForPlayer.streams && activeMatchForPlayer.streams.length > 0
              ? activeMatchForPlayer.streams
              : availableStreams
          }
        />
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <EditMatchModal
          isOpen={!!editingMatch}
          match={editingMatch}
          onClose={() => setEditingMatch(null)}
          lang={lang}
          onSave={(updated) => {
            setMatches((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
            if (activeMatchForPlayer && activeMatchForPlayer.id === updated.id) {
              setActiveMatchForPlayer(updated);
            }
          }}
          onDelete={(id) => {
            setMatches((prev) => prev.filter((m) => m.id !== id));
            if (activeMatchForPlayer && activeMatchForPlayer.id === id) {
              setActiveMatchForPlayer(null);
            }
          }}
        />
      )}

      {/* Admin Dashboard Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        lang={lang}
        onLinksUpdated={fetchStreams}
        matches={matches}
        onMatchesUpdated={() => fetchMatches(selectedDate, false)}
        onOpenMatchesList={() => handleNavigate('/matches-list')}
        onEditSingleMatch={(match) => {
          setIsAdminOpen(false);
          setEditingMatch(match);
        }}
      />

      {/* 24/7 Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        lang={lang}
      />
    </div>
  );
}
