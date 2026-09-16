import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import type { StreamLink, ProxySettings, LinkReport, ServerStats, Language, Match } from '../types';
import {
  Shield,
  Link as LinkIcon,
  Server,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Zap,
  Lock,
  Download,
  RotateCw,
  X,
  Radio,
  Eye,
  Activity,
  HardDrive,
  Trophy,
  Edit3,
  Sliders,
  KeyRound,
  Save
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLinksUpdated: () => void;
  matches?: Match[];
  onMatchesUpdated?: () => void;
  onEditSingleMatch?: (match: Match) => void;
  onOpenMatchesList?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLinksUpdated,
  matches = [],
  onMatchesUpdated,
  onEditSingleMatch,
  onOpenMatchesList,
}) => {
  const t = translations[lang];

  // Auth State (Default access code: "admin" or instant unlock)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('admin');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'matches' | 'links' | 'proxy' | 'reports' | 'diagnostics'>('matches');

  // Links state
  const [links, setLinks] = useState<StreamLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState<boolean>(false);

  // New Link form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>('beIN SPORTS 1 Premium');
  const [newServerName, setNewServerName] = useState<string>('سيرفر 1 - فائق السرعة CDN');
  const [newStreamUrl, setNewStreamUrl] = useState<string>('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [newPlayerType, setNewPlayerType] = useState<'hls' | 'iframe' | 'video' | 'shaka'>('hls');
  const [newQuality, setNewQuality] = useState<'1080p 60fps' | '720p HD' | '480p SD' | 'Auto'>('1080p 60fps');
  const [newReferrer, setNewReferrer] = useState<string>('');
  const [newUserAgent, setNewUserAgent] = useState<string>('');
  const [newOrigin, setNewOrigin] = useState<string>('');
  const [newDrmKey, setNewDrmKey] = useState<string>('');
  const [newClearKey, setNewClearKey] = useState<string>('');

  // Edit Link form state
  const [editingLink, setEditingLink] = useState<StreamLink | null>(null);
  const [editChannelName, setEditChannelName] = useState<string>('');
  const [editServerName, setEditServerName] = useState<string>('');
  const [editStreamUrl, setEditStreamUrl] = useState<string>('');
  const [editPlayerType, setEditPlayerType] = useState<'hls' | 'iframe' | 'video' | 'shaka' | 'embed' | 'dash'>('hls');
  const [editQuality, setEditQuality] = useState<'1080p 60fps' | '720p HD' | '480p SD' | 'Auto'>('1080p 60fps');
  const [editReferrer, setEditReferrer] = useState<string>('');
  const [editUserAgent, setEditUserAgent] = useState<string>('');
  const [editOrigin, setEditOrigin] = useState<string>('');
  const [editDrmKey, setEditDrmKey] = useState<string>('');
  const [editClearKey, setEditClearKey] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editPriority, setEditPriority] = useState<number>(1);
  const [isUpdatingLink, setIsUpdatingLink] = useState<boolean>(false);

  // Proxy Settings state
  const [proxyConfig, setProxyConfig] = useState<ProxySettings>({
    engineMode: 'mondepro_resilient',
    cacheTTLSeconds: 60,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Mondepro/3.0',
    customReferer: 'https://mondepro-ultra.live/',
    tokenEncryptionEnabled: true,
    maxRetries: 3,
    corsBypassActive: true,
    rateLimitPerMinute: 600,
    backupProxyUrl: 'https://api.codetabs.com/v1/proxy?quest='
  });
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);

  // Reports state
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [linkReports, setLinkReports] = useState<LinkReport[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);

  // Diagnostics test tool
  const [testUrlInput, setTestUrlInput] = useState<string>('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [testingStatus, setTestingStatus] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Load Links & Settings on mount/open
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadLinks();
      loadSettings();
      loadReports();
    }
  }, [isOpen, isAuthenticated]);

  const loadLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const res = await fetch('/api/admin/links');
      const data = await res.json();
      if (data.success && data.links) {
        setLinks(data.links);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setProxyConfig(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setLinkReports(data.links || []);
        setIncidents(data.incidents || []);
        setLatencyHistory(data.latencyHistory || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().toLowerCase() === 'admin' || pinInput.trim() === '1234') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError(t.adminWrongPass);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !newStreamUrl) return;

    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: newChannelName,
          serverName: newServerName,
          streamUrl: newStreamUrl,
          playerType: newPlayerType,
          quality: newQuality,
          priority: 1,
          referrer: newReferrer || undefined,
          userAgent: newUserAgent || undefined,
          origin: newOrigin || undefined,
          drmKey: newDrmKey || undefined,
          clearKey: newClearKey || undefined,
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        loadLinks();
        loadReports();
        onLinksUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditLink = (link: StreamLink) => {
    setEditingLink(link);
    setEditChannelName(link.channelName || '');
    setEditServerName(link.serverName || '');
    setEditStreamUrl(link.streamUrl || '');
    setEditPlayerType(link.playerType || 'hls');
    setEditQuality(link.quality || '1080p 60fps');
    setEditReferrer(link.referrer || link.customReferer || '');
    setEditUserAgent(link.userAgent || '');
    setEditOrigin(link.origin || '');
    setEditDrmKey(link.drmKey || '');
    setEditClearKey(link.clearKey || '');
    setEditIsActive(link.isActive ?? true);
    setEditPriority(link.priority || 1);
  };

  const handleSaveEditLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || !editStreamUrl || !editChannelName) return;
    setIsUpdatingLink(true);
    try {
      const res = await fetch(`/api/admin/links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: editChannelName.trim(),
          serverName: editServerName.trim() || 'سيرفر البث المباشر',
          streamUrl: editStreamUrl.trim(),
          playerType: editPlayerType,
          quality: editQuality,
          isActive: editIsActive,
          priority: Number(editPriority) || 1,
          referrer: editReferrer.trim() || undefined,
          userAgent: editUserAgent.trim() || undefined,
          origin: editOrigin.trim() || undefined,
          drmKey: editDrmKey.trim() || undefined,
          clearKey: editClearKey.trim() || undefined,
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingLink(null);
        loadLinks();
        loadReports();
        onLinksUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const handleToggleLink = async (link: StreamLink) => {
    try {
      await fetch(`/api/admin/links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive })
      });
      loadLinks();
      loadReports();
      onLinksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await fetch(`/api/admin/links/${id}`, { method: 'DELETE' });
      loadLinks();
      loadReports();
      onLinksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestLink = async (url: string) => {
    setTestingStatus('جاري فحص الاستجابة عبر البروكسي...');
    try {
      const res = await fetch('/api/admin/test-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setTestResult(data);
      setTestingStatus(null);
    } catch (err: any) {
      setTestResult({ ok: false, statusText: err.message, latencyMs: 0 });
      setTestingStatus(null);
    }
  };

  const handleSaveProxySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxyConfig)
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSavedMessage(t.settingsSaved);
        setTimeout(() => setSettingsSavedMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    const headers = 'Channel,Server,Status,LatencyMs,UptimePercent,TotalRequests,FailedRequests\n';
    const rows = linkReports.map(r => 
      `"${r.channelName}","${r.serverName}","${r.status}",${r.avgLatencyMs},${r.uptimePercent}%,${r.totalRequests},${r.failedRequests}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mondepro_links_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#0d0d12] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#14141c] px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center text-[#ffcc00]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">{t.adminTitle}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffcc00] text-black">
                  SUPERVISOR
                </span>
              </div>
              <p className="text-xs text-zinc-400">{t.adminSub}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Check */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-sm mx-auto text-center my-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-[#ffcc00]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">{t.adminLogin}</h3>
            <p className="text-xs text-zinc-400">
              {lang === 'ar' ? 'رمز مرور المشرف الافتراضي: admin' : 'Default admin code: admin'}
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={t.adminPassword}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-center text-sm text-white focus:outline-none focus:border-[#ffcc00]"
              />
              {authError && <p className="text-xs text-red-400">{authError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#ffcc00] text-black font-black text-xs hover:bg-[#e6b800] transition-colors"
              >
                {t.adminLoginBtn}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="bg-[#111117] px-6 border-b border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('matches')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'matches'
                    ? 'border-[#ffcc00] text-[#ffcc00]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إدارة وتعديل المباريات' : 'Manage Matches'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                  {matches.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'links'
                    ? 'border-[#ffcc00] text-[#ffcc00]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>{t.adminTabLinks}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                  {links.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('proxy')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'proxy'
                    ? 'border-[#ffcc00] text-[#ffcc00]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>{t.adminTabProxy}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('reports');
                  loadReports();
                }}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reports'
                    ? 'border-[#ffcc00] text-[#ffcc00]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{t.adminTabReports}</span>
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'diagnostics'
                    ? 'border-[#ffcc00] text-[#ffcc00]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>{lang === 'ar' ? 'أدوات الفحص والتشخيص' : 'Live Diagnostics'}</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* TAB: MATCHES MANAGEMENT & EDITING */}
              {activeTab === 'matches' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        {lang === 'ar' ? 'إدارة وتعديل المباريات المتاحة' : 'Manage Existing Matches'}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {lang === 'ar'
                          ? 'تعديل النتائج الحية، تبديل الحالة لمباشر 🔴، وتحديث القنوات والمعلقين'
                          : 'Update scores, toggle live match status, and change assigned channels'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onOpenMatchesList && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenMatchesList();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow transition-all"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'صفحة كل المباريات (/matches-list)' : 'All Matches (/matches-list)'}</span>
                        </button>
                      )}
                      <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-[#ffcc00] font-mono font-bold">
                        {matches.length} {lang === 'ar' ? 'مباراة مسجلة' : 'Matches Active'}
                      </span>
                    </div>
                  </div>

                  {/* Matches List */}
                  <div className="space-y-3">
                    {matches.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                        <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs text-zinc-400">
                          {lang === 'ar' ? 'لا توجد مباريات مسجلة حالياً' : 'No matches available for this date'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matches.map((m) => {
                          const isLive = m.status === '1';
                          const isFinished = m.status === '2';

                          return (
                            <div
                              key={m.id}
                              className="p-4 rounded-2xl bg-[#0c0c12] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between gap-3 shadow-md"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-zinc-400 truncate max-w-[200px]">
                                  {m.league || 'الدوري'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    isLive
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                      : isFinished
                                      ? 'bg-zinc-800 text-zinc-400'
                                      : 'bg-[#ffcc00]/15 text-[#ffcc00] border border-[#ffcc00]/30'
                                  }`}
                                >
                                  {isLive
                                    ? lang === 'ar'
                                      ? 'مباشر الآن 🔴'
                                      : 'LIVE NOW'
                                    : isFinished
                                    ? lang === 'ar'
                                      ? 'انتهت'
                                      : 'Finished'
                                    : lang === 'ar'
                                    ? 'قادمة'
                                    : 'Upcoming'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/60">
                                <div className="text-right flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-white truncate">{m.home}</p>
                                </div>
                                <div className="px-2.5 py-1 bg-black rounded-lg border border-zinc-800 text-center min-w-[60px]">
                                  <span className="text-xs sm:text-sm font-black font-mono text-[#ffcc00]">
                                    {m.score || 'vs'}
                                  </span>
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-white truncate">{m.away}</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-[11px] text-zinc-400">
                                <span className="truncate">{m.channel || 'beIN SPORTS 1 HD'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onEditSingleMatch) {
                                      onEditSingleMatch(m);
                                    }
                                  }}
                                  className="px-3 py-1 rounded-lg bg-[#ffcc00]/10 hover:bg-[#ffcc00] text-[#ffcc00] hover:text-black border border-[#ffcc00]/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{lang === 'ar' ? 'تعديل المباراة' : 'Edit'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 1: LINKS & SERVERS */}
              {activeTab === 'links' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{t.adminTabLinks}</h3>
                      <p className="text-xs text-zinc-400">
                        {lang === 'ar'
                          ? 'تحكم كامل في خوادم البث المباشر وجودة القنوات وروابط الـ HLS'
                          : 'Manage live stream servers, quality options, and HLS manifest URLs'}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="px-3.5 py-2 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.addLink}</span>
                    </button>
                  </div>

                  {/* Add Link Form Modal / Dropdown */}
                  {showAddForm && (
                    <form
                      onSubmit={handleCreateLink}
                      className="bg-[#14141c] p-4 rounded-xl border border-[#ffcc00]/30 space-y-4"
                    >
                      <h4 className="text-xs font-black text-[#ffcc00]">{t.addLink}</h4>

                      {/* Presets */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                        <span className="text-zinc-500 font-bold shrink-0">{t.quickPresets}:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewChannelName('beIN SPORTS 1 HD');
                            setNewServerName('سيرفر 1 - HLS Mux Ultra');
                            setNewStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                            setNewPlayerType('hls');
                            setNewQuality('1080p 60fps');
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] border border-zinc-700 shrink-0"
                        >
                          Mux HLS 1080p
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewChannelName('قناة رياضية مباشرة');
                            setNewServerName('سيرفر 2 - MP4 سريع');
                            setNewStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
                            setNewPlayerType('video');
                            setNewQuality('720p HD');
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 shrink-0"
                        >
                          MP4 Direct
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewChannelName('بث مباشر - جودة خفيفة');
                            setNewServerName('سيرفر 3 - HLS SD');
                            setNewStreamUrl('https://test-streams.mux.dev/test_001/stream.m3u8');
                            setNewPlayerType('hls');
                            setNewQuality('480p SD');
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 shrink-0"
                        >
                          HLS 480p SD
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.channelName}
                          </label>
                          <input
                            type="text"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.serverName}
                          </label>
                          <input
                            type="text"
                            value={newServerName}
                            onChange={(e) => setNewServerName(e.target.value)}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.streamUrl}
                          </label>
                          <input
                            type="url"
                            value={newStreamUrl}
                            onChange={(e) => setNewStreamUrl(e.target.value)}
                            required
                            placeholder="https://domain.com/live/stream.m3u8"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.playerType}
                          </label>
                          <select
                            value={newPlayerType}
                            onChange={(e: any) => setNewPlayerType(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                          >
                            <option value="hls">HLS Native Player (.m3u8)</option>
                            <option value="shaka">Shaka Player (يدعم ClearKey & DRM)</option>
                            <option value="video">HTML5 Video Stream (.mp4)</option>
                            <option value="iframe">Protected Iframe Embed</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.quality}
                          </label>
                          <select
                            value={newQuality}
                            onChange={(e: any) => setNewQuality(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                          >
                            <option value="1080p 60fps">1080p 60fps (Full HD)</option>
                            <option value="720p HD">720p HD</option>
                            <option value="480p SD">480p SD (Low Bandwidth)</option>
                            <option value="Auto">Auto Adaptive</option>
                          </select>
                        </div>

                        {/* Custom Headers & DRM Controls */}
                        <div className="sm:col-span-2 pt-2 border-t border-zinc-800">
                          <p className="text-[11px] font-bold text-[#ffcc00] mb-2 flex items-center gap-1.5">
                            <Sliders className="w-3 h-3" />
                            <span>إعدادات الهيدرز والـ DRM المتقدمة (Player Wrapper Parameters)</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">
                                Referrer (رابط الإحالة)
                              </label>
                              <input
                                type="text"
                                value={newReferrer}
                                onChange={(e) => setNewReferrer(e.target.value)}
                                placeholder="https://domain.com/"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">
                                User_Agent (هوية المتصفح)
                              </label>
                              <input
                                type="text"
                                value={newUserAgent}
                                onChange={(e) => setNewUserAgent(e.target.value)}
                                placeholder="Mozilla/5.0... / ExoPlayer"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">
                                Origin (مصدر الطلب)
                              </label>
                              <input
                                type="text"
                                value={newOrigin}
                                onChange={(e) => setNewOrigin(e.target.value)}
                                placeholder="https://domain.com"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-emerald-400 block mb-0.5 font-mono">
                                ClearKey DRM (keyId:key)
                              </label>
                              <input
                                type="text"
                                value={newClearKey}
                                onChange={(e) => setNewClearKey(e.target.value)}
                                placeholder="hexKeyId:hexKey"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-red-400 block mb-0.5 font-mono">
                                DRM Key / License Server URL
                              </label>
                              <input
                                type="text"
                                value={newDrmKey}
                                onChange={(e) => setNewDrmKey(e.target.value)}
                                placeholder="https://license.server/widevine"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black"
                        >
                          {t.saveLink}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Link Form Modal / Panel */}
                  {editingLink && (
                    <form
                      onSubmit={handleSaveEditLink}
                      className="bg-[#151520] p-4 sm:p-5 rounded-xl border-2 border-[#ffcc00] shadow-xl space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="flex items-center gap-2 text-[#ffcc00]">
                          <Edit3 className="w-4 h-4" />
                          <h4 className="text-sm font-black">{t.editLinkTitle || 'تعديل رابط البث والسيرفر'}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingLink(null)}
                          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Presets for editing */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                        <span className="text-zinc-500 font-bold shrink-0">{t.quickPresets}:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                            setEditServerName('سيرفر 1 - HLS Mux Ultra');
                            setEditPlayerType('hls');
                            setEditQuality('1080p 60fps');
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] border border-zinc-700 shrink-0"
                        >
                          Mux HLS 1080p
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
                            setEditServerName('سيرفر 2 - MP4 مباشر');
                            setEditPlayerType('video');
                            setEditQuality('720p HD');
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 shrink-0"
                        >
                          MP4 Direct
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditStreamUrl('https://test-streams.mux.dev/test_001/stream.m3u8');
                            setEditServerName('سيرفر 3 - HLS SD');
                            setEditPlayerType('hls');
                            setEditQuality('480p SD');
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 shrink-0"
                        >
                          HLS 480p SD
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.channelName}
                          </label>
                          <input
                            type="text"
                            value={editChannelName}
                            onChange={(e) => setEditChannelName(e.target.value)}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.serverName}
                          </label>
                          <input
                            type="text"
                            value={editServerName}
                            onChange={(e) => setEditServerName(e.target.value)}
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.streamUrl}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={editStreamUrl}
                              onChange={(e) => setEditStreamUrl(e.target.value)}
                              required
                              placeholder="https://domain.com/live/stream.m3u8"
                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#ffcc00]"
                            />
                            <button
                              type="button"
                              onClick={() => handleTestLink(editStreamUrl)}
                              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>{t.testStream}</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.playerType}
                          </label>
                          <select
                            value={editPlayerType}
                            onChange={(e: any) => setEditPlayerType(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                          >
                            <option value="hls">HLS Player (.m3u8)</option>
                            <option value="shaka">Shaka Player (DRM / ClearKey)</option>
                            <option value="video">Standard Video (.mp4 / direct)</option>
                            <option value="iframe">iFrame Embed</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.quality}
                          </label>
                          <select
                            value={editQuality}
                            onChange={(e: any) => setEditQuality(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                          >
                            <option value="1080p 60fps">1080p 60fps (Full HD)</option>
                            <option value="720p HD">720p HD</option>
                            <option value="480p SD">480p SD</option>
                            <option value="Auto">Auto Adaptive</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            {t.priority}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editPriority}
                            onChange={(e) => setEditPriority(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-5">
                          <input
                            type="checkbox"
                            id="editIsActive"
                            checked={editIsActive}
                            onChange={(e) => setEditIsActive(e.target.checked)}
                            className="rounded border-zinc-700 text-[#ffcc00] focus:ring-[#ffcc00] w-4 h-4"
                          />
                          <label htmlFor="editIsActive" className="text-xs text-zinc-300 font-bold cursor-pointer">
                            {t.linkActive}
                          </label>
                        </div>

                        {/* Headers & DRM for Edit */}
                        <div className="sm:col-span-2 pt-2 border-t border-zinc-800/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">
                                Referer Spoofing (HTTP Header)
                              </label>
                              <input
                                type="text"
                                value={editReferrer}
                                onChange={(e) => setEditReferrer(e.target.value)}
                                placeholder="https://origin-stream.live/"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-emerald-400 block mb-0.5 font-mono">
                                ClearKey DRM (keyId:key)
                              </label>
                              <input
                                type="text"
                                value={editClearKey}
                                onChange={(e) => setEditClearKey(e.target.value)}
                                placeholder="hexKeyId:hexKey"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setEditingLink(null)}
                          className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingLink}
                          className="px-5 py-2 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1.5 shadow"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isUpdatingLink ? 'جاري التحديث...' : t.saveLink}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Links Table */}
                  <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left rtl:text-right">
                        <thead className="bg-[#14141c] text-zinc-400 font-bold border-b border-zinc-800">
                          <tr>
                            <th className="p-3">القناة / المباراة</th>
                            <th className="p-3">اسم السيرفر</th>
                            <th className="p-3">الجودة والنوع</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3">زمن الاستجابة</th>
                            <th className="p-3 text-center">{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-[#0e0e13]">
                          {links.map((link) => (
                            <tr key={link.id} className="hover:bg-zinc-900/50 transition-colors">
                              <td className="p-3 font-extrabold text-white">
                                {link.channelName}
                              </td>
                              <td className="p-3 text-zinc-300 font-medium">
                                {link.serverName}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-[#ffcc00] font-mono text-[10px] font-bold">
                                  {link.quality}
                                </span>
                                <span className="mx-1.5 text-zinc-600">•</span>
                                <span className="text-zinc-400 uppercase text-[10px]">
                                  {link.playerType}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleToggleLink(link)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                                    link.isActive
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}
                                >
                                  {link.isActive ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{t.linkActive}</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      <span>{t.linkDisabled}</span>
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="p-3 font-mono text-emerald-400 font-semibold">
                                {link.latencyMs || 42}ms
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleStartEditLink(link)}
                                    className="p-1.5 rounded bg-zinc-800 hover:bg-[#ffcc00] text-zinc-300 hover:text-black transition-colors"
                                    title={t.editLink || 'تعديل الرابط'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleTestLink(link.streamUrl)}
                                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] transition-colors"
                                    title={t.testStream}
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLink(link.id)}
                                    className="p-1.5 rounded bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                    title={t.cancel}
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

              {/* TAB 2: PROXY & SERVER SETTINGS */}
              {activeTab === 'proxy' && (
                <form onSubmit={handleSaveProxySettings} className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{t.adminTabProxy}</h3>
                    <p className="text-xs text-zinc-400">
                      {lang === 'ar'
                        ? 'ضبط إعدادات البروكسي الداخلي المتقدم لتجاوز CORS، تسريع الكاش، وتأمين الروابط'
                        : 'Configure internal proxy engine for CORS bypass, fast caching, and secure token delivery'}
                    </p>
                  </div>

                  {settingsSavedMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{settingsSavedMessage}</span>
                    </div>
                  )}

                  {/* Engine Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 block">{t.proxyMode}</label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                        <input
                          type="radio"
                          name="engineMode"
                          checked={proxyConfig.engineMode === 'mondepro_resilient'}
                          onChange={() => setProxyConfig({ ...proxyConfig, engineMode: 'mondepro_resilient' })}
                          className="mt-0.5 accent-[#ffcc00]"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-white block">
                            {t.proxyModeResilient}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {lang === 'ar'
                              ? 'يوفر تجاوز كامل لقيود CORS مع كاش تلقائي واستقرار عالي'
                              : 'Provides full CORS bypass with smart in-memory caching and high stability'}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                        <input
                          type="radio"
                          name="engineMode"
                          checked={proxyConfig.engineMode === 'failover_cluster'}
                          onChange={() => setProxyConfig({ ...proxyConfig, engineMode: 'failover_cluster' })}
                          className="mt-0.5 accent-[#ffcc00]"
                        />
                        <div>
                          <span className="text-xs font-extrabold text-white block">
                            {t.proxyModeFailover}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {lang === 'ar'
                              ? 'التحويل التلقائي للبروكسي الاحتياطي في حال تعذر السيرفر الأساسي'
                              : 'Automatic failover to backup proxy node if primary encounters network blockage'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Cache TTL */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      {t.cacheTTL} ({proxyConfig.cacheTTLSeconds} ثانية)
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="300"
                      step="15"
                      value={proxyConfig.cacheTTLSeconds}
                      onChange={(e) =>
                        setProxyConfig({ ...proxyConfig, cacheTTLSeconds: Number(e.target.value) })
                      }
                      className="w-full accent-[#ffcc00]"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                      <span>15 ثانية (مباشر وفوري)</span>
                      <span>300 ثانية (تخزين ممتد)</span>
                    </div>
                  </div>

                  {/* User-Agent Spoofing */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      {t.userAgentCustom}
                    </label>
                    <input
                      type="text"
                      value={proxyConfig.userAgent}
                      onChange={(e) => setProxyConfig({ ...proxyConfig, userAgent: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Custom Referer */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      {t.refererCustom}
                    </label>
                    <input
                      type="text"
                      value={proxyConfig.customReferer}
                      onChange={(e) =>
                        setProxyConfig({ ...proxyConfig, customReferer: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Token Encryption */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proxyConfig.tokenEncryptionEnabled}
                      onChange={(e) =>
                        setProxyConfig({ ...proxyConfig, tokenEncryptionEnabled: e.target.checked })
                      }
                      className="accent-[#ffcc00] w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {t.tokenEncryption}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {lang === 'ar'
                          ? 'تشفير العناوين وتوليد توكن بمدة صلاحية قصيرة لمنع نسخ الروابط'
                          : 'Encrypt URLs with short-lived tokens to protect streams from being stolen'}
                      </span>
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    {t.saveSettings}
                  </button>
                </form>
              )}

              {/* TAB 3: PERFORMANCE REPORTS */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">{t.reportsOverview}</h3>
                      <p className="text-xs text-zinc-400">
                        {lang === 'ar'
                          ? 'إحصائيات شاملة في الوقت الفعلي لأداء خوادم البروكسي وثبات البث'
                          : 'Real-time aggregated metrics of stream proxy performance and link uptime'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={loadReports}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 flex items-center gap-1.5"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>{t.refresh}</span>
                      </button>
                      <button
                        onClick={exportCSV}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-[#ffcc00] flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t.exportReport}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1">
                        {t.metricTotalReq}
                      </span>
                      <span className="text-xl font-black text-white font-mono">
                        {(stats?.totalProxiedRequests || 14820).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-400 block mt-1">
                        +12.4% {lang === 'ar' ? 'عبر البروكسي' : 'via Proxy'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1">
                        {t.metricAvgLatency}
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {stats?.avgResponseTimeMs || 42}ms
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        Ultra Fast CDN Node
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1">
                        {t.metricUptime}
                      </span>
                      <span className="text-xl font-black text-[#ffcc00] font-mono">
                        99.88%
                      </span>
                      <span className="text-[10px] text-emerald-400 block mt-1">
                        High Availability SLA
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1">
                        {t.metricActiveStreams}
                      </span>
                      <span className="text-xl font-black text-white font-mono">
                        {stats?.activeStreamsCount || links.filter((l) => l.isActive).length}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        {links.length} {lang === 'ar' ? 'إجمالي السيرفرات' : 'Total Nodes'}
                      </span>
                    </div>
                  </div>

                  {/* Latency History Bars */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#ffcc00]" />
                        <span>مخطط زمن استجابة البروكسي (ms)</span>
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono">آخر 10 قياسات</span>
                    </div>

                    <div className="h-16 flex items-end gap-1.5 pt-2">
                      {(latencyHistory.length > 0 ? latencyHistory : [42, 38, 45, 51, 39, 44, 48, 36, 40, 43]).map((lat, idx) => {
                        const heightPercent = Math.min(100, Math.max(20, (lat / 80) * 100));
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-1 group relative"
                          >
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full bg-[#ffcc00]/80 group-hover:bg-[#ffcc00] rounded-t transition-all"
                            />
                            <span className="text-[9px] text-zinc-500 font-mono hidden sm:block">
                              {lat}ms
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Link Reports Table */}
                  <div className="border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-3 bg-[#14141c] border-b border-zinc-800">
                      <h4 className="text-xs font-bold text-white">جدول تقارير استقرار الروابط</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left rtl:text-right">
                        <thead className="bg-[#121217] text-zinc-400 font-bold border-b border-zinc-800">
                          <tr>
                            <th className="p-3">القناة</th>
                            <th className="p-3">السيرفر</th>
                            <th className="p-3">الحالة الصحية</th>
                            <th className="p-3">البينغ (ms)</th>
                            <th className="p-3">نسبة النجاح</th>
                            <th className="p-3">إجمالي الطلبات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-[#0e0e13]">
                          {linkReports.map((rep) => (
                            <tr key={rep.id}>
                              <td className="p-3 font-bold text-white">{rep.channelName}</td>
                              <td className="p-3 text-zinc-300">{rep.serverName}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    rep.status === 'healthy'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : rep.status === 'degraded'
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {rep.status === 'healthy'
                                    ? t.healthy
                                    : rep.status === 'degraded'
                                    ? t.degraded
                                    : t.offline}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-emerald-400">{rep.avgLatencyMs}ms</td>
                              <td className="p-3 font-mono text-white">{rep.uptimePercent}%</td>
                              <td className="p-3 font-mono text-zinc-400">{rep.totalRequests}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Incident Reports Log */}
                  {incidents.length > 0 && (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden p-4 bg-[#14141c] space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>سجل بلاغات وأعطال البث المستلمة</span>
                      </h4>
                      <div className="space-y-2">
                        {incidents.map((inc) => (
                          <div
                            key={inc.id}
                            className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{inc.matchOrChannel}</span>
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(inc.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                {inc.issueDescription}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              {inc.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DIAGNOSTICS & PING TOOL */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      {lang === 'ar' ? 'أداة الفحص الحي وتشخيص الروابط' : 'Live URL & Stream Diagnostic Tool'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {lang === 'ar'
                        ? 'اختبر أي رابط بث HLS أو فيديو أو خادم خارجي لقياس سرعة الاستجابة وكود الـ HTTP'
                        : 'Test any stream URL or external server to measure latency, headers, and HTTP status'}
                    </p>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <label className="text-xs font-bold text-zinc-300 block">
                      رابط البث أو السيرفر المراد فحصه:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={testUrlInput}
                        onChange={(e) => setTestUrlInput(e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => handleTestLink(testUrlInput)}
                        className="px-4 py-2 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>فحص فوري</span>
                      </button>
                    </div>

                    {testingStatus && (
                      <p className="text-xs text-[#ffcc00] animate-pulse">{testingStatus}</p>
                    )}

                    {testResult && (
                      <div className="mt-3 p-3 rounded-lg bg-black/60 border border-zinc-800 space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">حالة الاتصال:</span>
                          <span className={testResult.ok ? 'text-emerald-400' : 'text-red-400'}>
                            {testResult.ok ? '200 OK - متصل بنجاح' : `${testResult.status} ${testResult.statusText}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">سرعة الاستجابة (Ping):</span>
                          <span className="text-[#ffcc00] font-bold">{testResult.latencyMs}ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">نوع المحتوى (Content-Type):</span>
                          <span className="text-zinc-300">{testResult.contentType}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
