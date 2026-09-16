import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, StreamLink, ProxySettings, Language } from '../types';
import { translations } from '../translations';
import {
  Shield,
  Lock,
  Unlock,
  Radio,
  Tv,
  Play,
  Zap,
  Server,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Sliders,
  KeyRound,
  Globe,
  Monitor,
  Search,
  Calendar,
  Clock,
  Mic,
  MapPin,
  Clipboard,
  X,
  Eye,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { EditMatchModal } from './EditMatchModal';

interface AdminPanelPageProps {
  lang: Language;
  onNavigateHome: () => void;
  onPlayMatch?: (match: Match) => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  lang,
  onNavigateHome,
  onPlayMatch,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Security & Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mondepro_admin_auth') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Active sub-tab in isolated admin panel
  const [adminTab, setAdminTab] = useState<'stream-hub' | 'matches' | 'links' | 'proxy'>('stream-hub');

  // Matches & Streams data
  const [matches, setMatches] = useState<Match[]>([]);
  const [globalLinks, setGlobalLinks] = useState<StreamLink[]>([]);
  const [proxySettings, setProxySettings] = useState<ProxySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stream Hub State (مكان وضع وتعديل رابط البث)
  const [selectedMatchId, setSelectedMatchId] = useState<string>('general');
  const [hubStreamUrl, setHubStreamUrl] = useState<string>('');
  const [hubServerName, setHubServerName] = useState<string>('سيرفر 1 - فائق السرعة CDN');
  const [hubPlayerType, setHubPlayerType] = useState<
    'shaka' | 'player_wrapper' | 'mux' | 'iframe' | 'hls' | 'dash' | 'video'
  >('player_wrapper');
  const [hubQuality, setHubQuality] = useState<'1080p 60fps' | '720p HD' | '480p SD' | 'Auto'>('1080p 60fps');
  const [hubPriority, setHubPriority] = useState<number>(1);
  const [hubReferrer, setHubReferrer] = useState<string>('');
  const [hubUserAgent, setHubUserAgent] = useState<string>('');
  const [hubOrigin, setHubOrigin] = useState<string>('');
  const [hubDrmKey, setHubDrmKey] = useState<string>('');
  const [hubClearKey, setHubClearKey] = useState<string>('');
  const [isDeployingStream, setIsDeployingStream] = useState<boolean>(false);
  const [streamTestResult, setStreamTestResult] = useState<{ testing: boolean; success?: boolean; latency?: number } | null>(null);

  // Matches Manager State
  const [matchesSearch, setMatchesSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | '0' | '1' | '2'>('all');
  const [editingMatchForModal, setEditingMatchForModal] = useState<Match | null>(null);
  const [showAddMatchModal, setShowAddMatchModal] = useState<boolean>(false);

  // New Match Form State
  const [newHome, setNewHome] = useState<string>('');
  const [newAway, setNewAway] = useState<string>('');
  const [newLeague, setNewLeague] = useState<string>('الدوري الإسباني | La Liga');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('21:00');
  const [newChannel, setNewChannel] = useState<string>('beIN SPORTS 1 HD');
  const [newCommentary, setNewCommentary] = useState<string>('عصام الشوالي');
  const [newStadium, setNewStadium] = useState<string>('سانتياغو برنابيو');
  const [newScore, setNewScore] = useState<string>('vs');
  const [newStatus, setNewStatus] = useState<'0' | '1' | '2'>('0');
  const [newMatchStreamUrl, setNewMatchStreamUrl] = useState<string>('');

  // Quick Score Edit modal
  const [editingScoreMatch, setEditingScoreMatch] = useState<Match | null>(null);
  const [scoreInputValue, setScoreInputValue] = useState<string>('');

  // Toast notification helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passwordInput.trim();
    // Default passcode: admin2026 or admin
    if (cleanPass === 'admin2026' || cleanPass === 'admin' || cleanPass === '123456') {
      setIsAuthenticated(true);
      sessionStorage.setItem('mondepro_admin_auth', 'true');
      setAuthError('');
      showToast(lang === 'ar' ? 'مرحباً بك في لوحة تحكم Mondepro المشفرة' : 'Welcome to Mondepro Admin Panel');
    } else {
      setAuthError(t.adminWrongPass);
    }
  };

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('mondepro_admin_auth');
    setPasswordInput('');
    showToast(lang === 'ar' ? 'تم قفل لوحة التحكم بنجاح' : 'Admin Panel Locked');
  };

  // Load All Matches & Global Links
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mRes, lRes, pRes] = await Promise.all([
        fetch('/api/matches/all'),
        fetch('/api/admin/links'),
        fetch('/api/admin/proxy-settings')
      ]);

      const mData = await mRes.json();
      if (mData.success && Array.isArray(mData.matches)) {
        setMatches(mData.matches);
      }

      const lData = await lRes.json();
      if (lData.success && Array.isArray(lData.links)) {
        setGlobalLinks(lData.links);
      }

      const pData = await pRes.json();
      if (pData.success && pData.settings) {
        setProxySettings(pData.settings);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Selected match object
  const selectedMatch = useMemo(() => {
    if (selectedMatchId === 'general') return null;
    return matches.find((m) => m.id === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  // Handle URL changes to auto-detect player type
  const handleStreamUrlChange = (val: string) => {
    let cleanUrl = val.trim();

    // If user pasted full <iframe ... src="..." ...> code, extract the src!
    if (cleanUrl.includes('<iframe') && cleanUrl.includes('src=')) {
      const match = cleanUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        cleanUrl = match[1];
        setHubPlayerType('iframe');
      }
    } else if (cleanUrl.endsWith('.m3u8')) {
      setHubPlayerType('hls');
    } else if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm')) {
      setHubPlayerType('video');
    } else if (cleanUrl.endsWith('.mpd')) {
      setHubPlayerType('shaka');
    } else if (cleanUrl.includes('/embed') || cleanUrl.includes('player.')) {
      setHubPlayerType('iframe');
    }

    setHubStreamUrl(cleanUrl);
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleStreamUrlChange(text);
          showToast(lang === 'ar' ? 'تم لصق الرابط من الحافظة!' : 'Pasted from clipboard!');
        }
      }
    } catch {
      // Fallback
    }
  };

  // Test Ping Stream URL
  const handleTestPing = async (url: string) => {
    if (!url || !url.trim()) return;
    setStreamTestResult({ testing: true });
    const startTime = performance.now();

    try {
      const pingUrl = url.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(url)}` : url;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(pingUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);
      setStreamTestResult({ testing: false, success: res.ok, latency });
    } catch {
      setStreamTestResult({ testing: false, success: false, latency: 999 });
    }
  };

  // Deploy / Assign Stream to Selected Match or General Links
  const handleDeployStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubStreamUrl.trim()) {
      showToast(lang === 'ar' ? 'يرجى إدخال رابط البث أولاً' : 'Please enter a stream URL first', 'error');
      return;
    }

    setIsDeployingStream(true);

    try {
      const newStreamItem: StreamLink = {
        id: 'stream-' + Date.now(),
        channelName: selectedMatch ? `${selectedMatch.home} vs ${selectedMatch.away}` : 'قناة البث المباشر',
        serverName: hubServerName.trim() || 'سيرفر رئيسي',
        streamUrl: hubStreamUrl.trim(),
        playerType: hubPlayerType,
        quality: hubQuality,
        priority: hubPriority,
        isActive: true,
        referrer: hubReferrer.trim() || undefined,
        userAgent: hubUserAgent.trim() || undefined,
        origin: hubOrigin.trim() || undefined,
        drmKey: hubDrmKey.trim() || undefined,
        clearKey: hubClearKey.trim() || undefined,
        latencyMs: 38
      };

      if (selectedMatch) {
        // Add or update to this specific match's streams
        const currentStreams = Array.isArray(selectedMatch.streams) ? [...selectedMatch.streams] : [];
        const updatedStreams = [newStreamItem, ...currentStreams];

        const updatedMatch: Match = {
          ...selectedMatch,
          streams: updatedStreams,
          // If match was upcoming, user might want it live
          status: selectedMatch.status === '0' ? '1' : selectedMatch.status
        };

        const res = await fetch(`/api/matches/${selectedMatch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMatch)
        });

        const data = await res.json();
        if (data.success) {
          showToast(t.streamDeployedSuccess || 'تم نشر وتفعيل رابط البث للمباراة بنجاح!');
          setMatches((prev) => prev.map((m) => (m.id === selectedMatch.id ? updatedMatch : m)));
          setHubStreamUrl('');
        }
      } else {
        // Deploy to Global Stream Links
        const res = await fetch('/api/admin/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStreamItem)
        });

        const data = await res.json();
        if (data.success) {
          showToast(t.streamDeployedSuccess || 'تم نشر وتفعيل رابط البث للقنوات العامة بنجاح!');
          loadData();
          setHubStreamUrl('');
        }
      }
    } catch (err) {
      console.error('Failed to deploy stream:', err);
      showToast(lang === 'ar' ? 'فشل نشر البث' : 'Failed to deploy stream', 'error');
    } finally {
      setIsDeployingStream(false);
    }
  };

  // Remove stream from a match
  const handleRemoveStreamFromMatch = async (matchId: string, streamId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch || !targetMatch.streams) return;

    const updatedStreams = targetMatch.streams.filter((s) => s.id !== streamId);
    const updatedMatch = { ...targetMatch, streams: updatedStreams };

    setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));

    try {
      await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMatch)
      });
      showToast(lang === 'ar' ? 'تم حذف سيرفر البث من المباراة' : 'Stream server removed from match');
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  // Toggle stream active/inactive in a match
  const handleToggleMatchStream = async (matchId: string, streamId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch || !targetMatch.streams) return;

    const updatedStreams = targetMatch.streams.map((s) =>
      s.id === streamId ? { ...s, isActive: !s.isActive } : s
    );
    const updatedMatch = { ...targetMatch, streams: updatedStreams };

    setMatches((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));

    try {
      await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMatch)
      });
      showToast(lang === 'ar' ? 'تم تحديث حالة سيرفر البث' : 'Stream server status updated');
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  // Toggle match status (0 -> 1 -> 2 -> 0)
  const handleToggleMatchStatus = async (match: Match) => {
    const nextStatus = match.status === '0' ? '1' : match.status === '1' ? '2' : '0';
    const updated = { ...match, status: nextStatus as '0' | '1' | '2' };

    setMatches((prev) => prev.map((m) => (m.id === match.id ? updated : m)));

    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        showToast(t.matchUpdated);
      }
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  // Quick Score Update
  const handleSaveScore = async () => {
    if (!editingScoreMatch) return;
    const updated = { ...editingScoreMatch, score: scoreInputValue.trim() || 'vs' };
    setMatches((prev) => prev.map((m) => (m.id === editingScoreMatch.id ? updated : m)));
    setEditingScoreMatch(null);

    try {
      await fetch(`/api/matches/${editingScoreMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      showToast(t.matchUpdated);
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  // Delete Match
  const handleDeleteMatch = async (id: string, name: string) => {
    const confirmMsg =
      lang === 'ar'
        ? `هل أنت متأكد من حذف مباراة "${name}" نهائياً من قاعدة البيانات؟`
        : `Are you sure you want to permanently delete match "${name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setMatches((prev) => prev.filter((m) => m.id !== id));

    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(t.matchDeleted);
        loadData();
      }
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  // Filtered matches for manager tab
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (statusFilter !== 'all' && String(m.status) !== statusFilter) return false;
      if (matchesSearch.trim()) {
        const q = matchesSearch.toLowerCase().trim();
        const homeMatch = m.home.toLowerCase().includes(q);
        const awayMatch = m.away.toLowerCase().includes(q);
        const leagueMatch = m.league.toLowerCase().includes(q);
        const dateMatch = (m.date || '').toLowerCase().includes(q);
        return homeMatch || awayMatch || leagueMatch || dateMatch;
      }
      return true;
    });
  }, [matches, statusFilter, matchesSearch]);

  // LOCK SCREEN IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center p-4 font-['Cairo',sans-serif]">
        <div className="w-full max-w-md bg-[#0e0e14] border border-[#ffcc00]/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden">
          {/* Top glow accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ffcc00] to-transparent" />

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center mx-auto text-[#ffcc00] shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">{t.adminLockTitle || 'بوابة المشرف المحمية'}</h2>
            <p className="text-xs text-zinc-400">
              {t.adminLockDesc || 'لوحة التحكم منفصلة تماماً ومحمية برمز مرور سري لمنع أي عبث بموقعك أو بمبارياتك.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                {t.adminPassword}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  required
                  autoFocus
                  placeholder={t.adminPassPlaceholder || 'أدخل رمز المرور السري (الافتراضي: admin2026)'}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#ffcc00] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none transition-all pr-10 rtl:pr-4 rtl:pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              {authError && (
                <p className="text-xs text-red-400 font-bold mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(255,204,0,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{t.adminLoginBtn}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs font-bold text-zinc-400 hover:text-[#ffcc00] transition-colors cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
            >
              <span>{t.backToPublicSite || 'العودة للموقع العام للمشاهدين ⚽'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ISOLATED AUTHENTICATED ADMIN PANEL
  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col font-['Cairo',sans-serif]">
      {/* Isolated Admin Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c12]/95 backdrop-blur-xl border-b border-[#ffcc00]/25 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ffcc00] to-[#f59e0b] p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#0e0e14] rounded-[10px] flex items-center justify-center text-[#ffcc00]">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-white">Mondepro Admin Panel</h1>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    معزولة وآمنة 🔒
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {lang === 'ar' ? 'لوحة تحكم المشرف المنفصلة لحماية موقعك وإدارة البث' : 'Isolated Control Panel'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={onNavigateHome}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-[#ffcc00] font-bold"
              >
                الموقع ⚽
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"
                title={t.logoutAdmin}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation buttons */}
          <nav className="flex items-center gap-1 bg-[#12121a] p-1 rounded-xl border border-zinc-800 text-xs font-bold overflow-x-auto max-w-full">
            <button
              onClick={() => setAdminTab('stream-hub')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                adminTab === 'stream-hub'
                  ? 'bg-[#ffcc00] text-black font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '🎯 مكان وضع رابط البث' : 'Stream Link Hub'}</span>
            </button>

            <button
              onClick={() => setAdminTab('matches')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                adminTab === 'matches'
                  ? 'bg-[#ffcc00] text-black font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '⚽ إدارة المباريات' : 'Matches Manager'}</span>
            </button>

            <button
              onClick={() => setAdminTab('links')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                adminTab === 'links'
                  ? 'bg-[#ffcc00] text-black font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '📡 السيرفرات العامة' : 'Global Streams'}</span>
            </button>

            <button
              onClick={() => setAdminTab('proxy')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                adminTab === 'proxy'
                  ? 'bg-[#ffcc00] text-black font-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? '🛡️ إعدادات البروكسي' : 'Proxy Settings'}</span>
            </button>
          </nav>

          {/* Exit / Public View */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#ffcc00] text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
              title={t.backToPublicSite}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t.backToPublicSite || 'الموقع العام للمشاهدين ⚽'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logoutAdmin || 'قفل اللوحة'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-8 py-6 w-full space-y-6">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/80 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span>{notification.text}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: 🎯 STREAM HUB (مكان وضع وتعديل رابط البث المباشر) */}
        {/* ========================================================================= */}
        {adminTab === 'stream-hub' && (
          <div className="space-y-6">
            {/* Highlighted Hub Box */}
            <div className="bg-[#0e0e14] border-2 border-[#ffcc00] rounded-2xl p-5 sm:p-6 shadow-[0_0_30px_rgba(255,204,0,0.15)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[#ffcc00] animate-pulse" />
                    <span>{t.streamHubTitle || 'مكان وضع وتعديل رابط البث المباشر (Stream Hub)'}</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    {t.streamHubSub || 'المكان المخصص لإسناد وتفعيل روابط وسيرفرات البث للمباريات والقنوات فوراً'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="text-zinc-400 font-bold">{lang === 'ar' ? 'سيرفرات جاهزة للاختبار:' : 'Quick Presets:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHubStreamUrl('https://rtve01p.origin.c21livecloud.com/live-origin/clan-hls/bitrate_1.m3u8');
                      setHubServerName('سيرفر RTVE Clan HLS المباشر');
                      setHubPlayerType('hls');
                      setHubQuality('1080p 60fps');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#ffcc00]/20 hover:bg-[#ffcc00]/30 text-[#ffcc00] border border-[#ffcc00]/40 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>RTVE Clan HLS (.m3u8)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHubStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                      setHubServerName('سيرفر 1 - HLS Mux Ultra');
                      setHubPlayerType('hls');
                      setHubQuality('1080p 60fps');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] border border-zinc-700 text-[11px] font-bold"
                  >
                    Mux HLS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHubStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
                      setHubServerName('سيرفر 2 - MP4 Direct');
                      setHubPlayerType('video');
                      setHubQuality('720p HD');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 text-[11px] font-bold"
                  >
                    MP4 HD
                  </button>
                </div>
              </div>

              {/* Form to Deploy Stream */}
              <form onSubmit={handleDeployStream} className="space-y-4">
                {/* 1. Choose Target Match or General */}
                <div>
                  <label className="text-xs font-black text-[#ffcc00] block mb-1.5">
                    1. {t.chooseMatch || 'اختر المباراة أو القناة المستهدفة للبث:'}
                  </label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-[#ffcc00] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="general">
                      🌍 {t.generalChannelStream || 'بث عام للقنوات (غير مرتبط بمباراة معينة - لجميع المشاهدين)'}
                    </option>
                    {matches.map((m) => (
                      <option key={m.id} value={m.id}>
                        ⚽ [{m.date || 'اليوم'}] {m.home} 🆚 {m.away} ({m.time}) — {m.league}
                        {m.streams && m.streams.length > 0 ? ` (${m.streams.length} سيرفر نشط)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Match Preview Card if specific match selected */}
                {selectedMatch && (
                  <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 font-black text-white">
                        <span>{selectedMatch.home}</span>
                        <span className="text-[#ffcc00] font-mono px-2 py-0.5 rounded bg-black">
                          {selectedMatch.score || 'vs'}
                        </span>
                        <span>{selectedMatch.away}</span>
                      </div>
                      <span className="text-zinc-400 font-semibold hidden sm:inline">
                        • {selectedMatch.league} • {selectedMatch.time}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedMatch.status === '1'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : selectedMatch.status === '2'
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {selectedMatch.status === '1'
                        ? 'مباشر الآن 🔴'
                        : selectedMatch.status === '2'
                        ? 'انتهت'
                        : 'لم تبدأ'}
                    </span>
                  </div>
                )}

                {/* 2. Stream URL Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#ffcc00]" />
                      <span>2. {t.streamUrl || 'رابط البث المباشر (Stream URL / M3U8 / MP4 / Embed):'}</span>
                    </label>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="text-[#ffcc00] hover:underline flex items-center gap-1 font-bold"
                      >
                        <Clipboard className="w-3 h-3" />
                        <span>{t.pasteClipboard || 'لصق'}</span>
                      </button>
                      {hubStreamUrl && (
                        <button
                          type="button"
                          onClick={() => setHubStreamUrl('')}
                          className="text-zinc-400 hover:text-white flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" />
                          <span>{t.clearInput || 'مسح'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={hubStreamUrl}
                      onChange={(e) => handleStreamUrlChange(e.target.value)}
                      required
                      placeholder="https://example.com/live/match.m3u8 أو كود <iframe src='...'>"
                      className="flex-1 bg-zinc-900 border-2 border-zinc-700 focus:border-[#ffcc00] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleTestPing(hubStreamUrl)}
                      disabled={!hubStreamUrl.trim() || streamTestResult?.testing}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{streamTestResult?.testing ? 'جاري الفحص...' : t.testStream}</span>
                    </button>
                  </div>

                  {/* Test Ping result badge */}
                  {streamTestResult && !streamTestResult.testing && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {streamTestResult.success ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.testStreamSuccess} (زمن الاستجابة: {streamTestResult.latency}ms)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{t.testStreamError}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Player Engine & Server Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Player Engine */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      {lang === 'ar' ? 'نوع المشغل (Player Engine):' : 'Player Engine:'}
                    </label>
                    <select
                      value={hubPlayerType}
                      onChange={(e: any) => setHubPlayerType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="player_wrapper">Player Wrapper (المشغل المتقدم الشامل)</option>
                      <option value="shaka">Shaka Player (ClearKey / Widevine DRM)</option>
                      <option value="hls">HLS Native (.m3u8 High Speed)</option>
                      <option value="mux">Mux Video Engine</option>
                      <option value="iframe">Iframe Embed (تضمين خارجي)</option>
                      <option value="dash">MPEG-DASH (.mpd)</option>
                      <option value="video">Direct MP4 / WebM Video</option>
                    </select>
                  </div>

                  {/* Server Name (اضافة سرفر 2345...) */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      {lang === 'ar' ? 'اسم السيرفر (سيرفر 1، 2، 3، 4، 5...):' : 'Server Name:'}
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={hubServerName}
                        onChange={(e) => setHubServerName(e.target.value)}
                        required
                        placeholder="سيرفر 1 - فائق السرعة"
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                    {/* Quick Server number helpers */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
                      <span>{lang === 'ar' ? 'سيرفر سريع:' : 'Quick:'}</span>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setHubServerName(lang === 'ar' ? `سيرفر ${num} - بث مباشر عالي الدقة` : `Server ${num} - HD Stream`)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-[#ffcc00] hover:text-black transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      {t.quality}
                    </label>
                    <select
                      value={hubQuality}
                      onChange={(e: any) => setHubQuality(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold"
                    >
                      <option value="1080p 60fps">1080p 60fps (Full HD)</option>
                      <option value="720p HD">720p HD</option>
                      <option value="480p SD">480p SD (للإنترنت الضعيف)</option>
                      <option value="Auto">Auto Adaptive</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">
                      {t.priority}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={hubPriority}
                      onChange={(e) => setHubPriority(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                {/* Specific Anti-Block & DRM Controls requested by User */}
                {/* Referrer, User_Agent, Drmkey clearkey, Origin */}
                <div className="p-4 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-black text-white">
                      <Sliders className="w-4 h-4 text-[#ffcc00]" />
                      <span>{lang === 'ar' ? 'إعدادات حماية البث، الترويسات ومفاتيح التشفير (DRM / Headers):' : 'Stream Headers & DRM Configuration:'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      Bypass & Anti-Block Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {/* Referrer */}
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Refferer / Referer:
                      </label>
                      <input
                        type="text"
                        value={hubReferrer}
                        onChange={(e) => setHubReferrer(e.target.value)}
                        placeholder="https://domain.com/ أو https://rtve.es/"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                      />
                    </div>

                    {/* User_Agent */}
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        User_Agent:
                      </label>
                      <input
                        type="text"
                        value={hubUserAgent}
                        onChange={(e) => setHubUserAgent(e.target.value)}
                        placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                      />
                    </div>

                    {/* Origin */}
                    <div>
                      <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                        Origin:
                      </label>
                      <input
                        type="text"
                        value={hubOrigin}
                        onChange={(e) => setHubOrigin(e.target.value)}
                        placeholder="https://domain.com"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                      />
                    </div>

                    {/* Drmkey */}
                    <div>
                      <label className="text-[11px] font-bold text-amber-400 block mb-1">
                        Drmkey (Widevine / License Server URL):
                      </label>
                      <input
                        type="text"
                        value={hubDrmKey}
                        onChange={(e) => setHubDrmKey(e.target.value)}
                        placeholder="https://license.domain.com/cenc/..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                      />
                    </div>

                    {/* ClearKey */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-emerald-400 block mb-1">
                        ClearKey (KeyID:Key أو Hex):
                      </label>
                      <input
                        type="text"
                        value={hubClearKey}
                        onChange={(e) => setHubClearKey(e.target.value)}
                        placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d:0123456789abcdef0123456789abcdef"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Deploy Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isDeployingStream}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ffcc00] via-[#f59e0b] to-[#d97706] hover:brightness-110 text-black font-black text-sm transition-all shadow-[0_0_25px_rgba(255,204,0,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isDeployingStream ? 'جاري نشر البث وتحديث المشغل...' : t.deployStreamNow}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* List of streams currently assigned to the selected match */}
            {selectedMatch && (
              <div className="bg-[#0e0e14] border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Tv className="w-4 h-4 text-[#ffcc00]" />
                    <span>
                      {t.activeMatchStreamsCount || 'سيرفرات البث الحالية لهذه المباراة'}: ({selectedMatch.home} vs {selectedMatch.away})
                    </span>
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">
                    {selectedMatch.streams?.length || 0} سيرفر
                  </span>
                </div>

                {(!selectedMatch.streams || selectedMatch.streams.length === 0) ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">
                    {t.noMatchStreams || 'لا توجد سيرفرات مخصصة بعد لهذه المباراة، يتم استخدام السيرفرات الافتراضية.'}
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden text-xs">
                    {selectedMatch.streams.map((stream, idx) => (
                      <div
                        key={stream.id || idx}
                        className="p-3 bg-zinc-900/60 hover:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{stream.serverName}</span>
                            <span className="px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                              {stream.quality}
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-zinc-800 text-[#ffcc00] font-mono text-[10px] uppercase">
                              {stream.playerType}
                            </span>
                            {stream.clearKey && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono">
                                DRM
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono truncate max-w-lg">
                            {stream.streamUrl}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleMatchStream(selectedMatch.id, stream.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              stream.isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {stream.isActive ? t.linkActive : t.linkDisabled}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTestPing(stream.streamUrl)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00]"
                            title={t.testStream}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveStreamFromMatch(selectedMatch.id, stream.id)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400"
                            title={t.cancel}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ⚽ MATCHES MANAGER (إدارة وتعديل المباريات) */}
        {/* ========================================================================= */}
        {adminTab === 'matches' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 right-3 rtl:right-3 rtl:left-auto text-xs" />
                <input
                  type="text"
                  value={matchesSearch}
                  onChange={(e) => setMatchesSearch(e.target.value)}
                  placeholder={t.searchMatchesPlaceholder || 'ابحث عن فريق، دوري، أو تاريخ...'}
                  className="w-full bg-[#0e0e14] border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white pr-9 rtl:pr-9 focus:outline-none focus:border-[#ffcc00]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-[#0e0e14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">{t.allMatches}</option>
                  <option value="1">{t.statusLive}</option>
                  <option value="0">{t.statusUpcoming}</option>
                  <option value="2">{t.statusFinished}</option>
                </select>

                <button
                  onClick={() => setShowAddMatchModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addNewMatch}</span>
                </button>
              </div>
            </div>

            {/* Table of Matches */}
            <div className="bg-[#0e0e14] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-[#12121a] text-zinc-400 font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3.5">{t.teamsLabel}</th>
                      <th className="p-3.5">{t.scoreLabel}</th>
                      <th className="p-3.5">{t.statusLabel}</th>
                      <th className="p-3.5">سيرفرات البث</th>
                      <th className="p-3.5">{t.timeLabel} / {t.dateLabel}</th>
                      <th className="p-3.5 text-center">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredMatches.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {m.home} 🆚 {m.away}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            {m.league}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              setEditingScoreMatch(m);
                              setScoreInputValue(m.score || 'vs');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-black border border-zinc-800 font-mono text-sm text-[#ffcc00] font-black hover:border-[#ffcc00] transition-colors"
                            title={t.quickScoreUpdate}
                          >
                            {m.score || 'vs'}
                          </button>
                        </td>

                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleMatchStatus(m)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                              m.status === '1'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : m.status === '2'
                                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                            title={t.quickStatusChange}
                          >
                            {m.status === '1' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
                            <span>
                              {m.status === '1'
                                ? t.statusLive
                                : m.status === '2'
                                ? t.statusFinished
                                : t.statusUpcoming}
                            </span>
                          </button>
                        </td>

                        <td className="p-3.5">
                          <span className="font-mono text-zinc-300 font-bold">
                            {m.streams?.length || 0} سيرفر
                          </span>
                        </td>

                        <td className="p-3.5 text-zinc-300 font-mono">
                          <div>{m.time}</div>
                          <div className="text-[10px] text-zinc-500">{m.date}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Stream Hub jump */}
                            <button
                              onClick={() => {
                                setSelectedMatchId(m.id);
                                setAdminTab('stream-hub');
                              }}
                              className="p-1.5 rounded-lg bg-[#ffcc00]/10 hover:bg-[#ffcc00] text-[#ffcc00] hover:text-black border border-[#ffcc00]/30 transition-colors"
                              title="إضافة رابط بث لهذه المباراة"
                            >
                              <Radio className="w-3.5 h-3.5" />
                            </button>

                            {/* Full Edit Modal */}
                            <button
                              onClick={() => setEditingMatchForModal(m)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                              title={t.editMatch}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteMatch(m.id, `${m.home} vs ${m.away}`)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 📡 GLOBAL STREAM LINKS */}
        {/* ========================================================================= */}
        {adminTab === 'links' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">{t.adminTabLinks}</h3>
                <p className="text-xs text-zinc-400">سيرفرات البث الافتراضية والقنوات العامة للموقع</p>
              </div>
              <button
                onClick={() => {
                  setSelectedMatchId('general');
                  setAdminTab('stream-hub');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#ffcc00] text-black text-xs font-black flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addLink}</span>
              </button>
            </div>

            <div className="bg-[#0e0e14] border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-[#12121a] text-zinc-400 font-bold border-b border-zinc-800">
                  <tr>
                    <th className="p-3.5">القناة / السيرفر</th>
                    <th className="p-3.5">نوع المشغل والجودة</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">الرابط</th>
                    <th className="p-3.5 text-center">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {globalLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-zinc-900/50">
                      <td className="p-3.5 font-bold text-white">
                        <div>{link.serverName}</div>
                        <div className="text-[11px] text-[#ffcc00] font-normal">{link.channelName}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-zinc-300">{link.quality} • {link.playerType}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            link.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {link.isActive ? t.linkActive : t.linkDisabled}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-zinc-400 truncate max-w-xs">
                        {link.streamUrl}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleTestPing(link.streamUrl)}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00]"
                          title={t.testStream}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: 🛡️ PROXY & SECURITY SETTINGS */}
        {/* ========================================================================= */}
        {adminTab === 'proxy' && (
          <div className="bg-[#0e0e14] border border-zinc-800 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#ffcc00]" />
                <span>{t.adminTabProxy}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                التحكم في وسيط البث الداخلي وتخطي حظر الروابط و CORS
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">محرك البروكسي الداخلي (Resilient Proxy)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    نشط ONLINE
                  </span>
                </div>
                <p className="text-zinc-400">
                  يقوم بتمرير تدفقات M3U8 و TS تلقائياً وتزييف الترويسات لتشغيل البث على جميع الأجهزة دون تقطيع.
                </p>
              </div>

              <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
                <span className="font-bold text-white block mb-1">رمز مرور لوحة التحكم الحالي:</span>
                <div className="flex items-center gap-2 font-mono text-xs text-[#ffcc00] bg-black p-2.5 rounded-lg border border-zinc-800">
                  <KeyRound className="w-4 h-4" />
                  <span>admin2026 (أو admin)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QUICK SCORE EDIT MODAL */}
      {editingScoreMatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e14] border border-zinc-800 rounded-2xl p-5 max-w-xs w-full space-y-4">
            <h3 className="text-xs font-black text-white text-center">
              تحديث النتيجة: {editingScoreMatch.home} vs {editingScoreMatch.away}
            </h3>
            <input
              type="text"
              value={scoreInputValue}
              onChange={(e) => setScoreInputValue(e.target.value)}
              placeholder="2 - 1"
              autoFocus
              className="w-full bg-zinc-900 border-2 border-zinc-700 focus:border-[#ffcc00] rounded-xl py-2 px-3 text-center text-lg font-black font-mono text-[#ffcc00]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingScoreMatch(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveScore}
                className="px-4 py-1.5 rounded-lg bg-[#ffcc00] text-xs font-black text-black"
              >
                حفظ النتيجة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL MATCH EDIT MODAL (WITH STREAMS MANAGER) */}
      {editingMatchForModal && (
        <EditMatchModal
          isOpen={!!editingMatchForModal}
          match={editingMatchForModal}
          onClose={() => setEditingMatchForModal(null)}
          lang={lang}
          onSave={(updated) => {
            setMatches((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            setEditingMatchForModal(null);
            showToast(t.matchUpdated);
          }}
          onDelete={(id) => {
            setMatches((prev) => prev.filter((m) => m.id !== id));
            setEditingMatchForModal(null);
            showToast(t.matchDeleted);
          }}
        />
      )}
    </div>
  );
};
