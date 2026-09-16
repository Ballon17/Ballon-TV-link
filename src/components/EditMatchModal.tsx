import React, { useState } from 'react';
import type { Match, StreamLink, Language } from '../types';
import {
  X,
  Edit3,
  Save,
  Trash2,
  Trophy,
  Clock,
  Radio,
  CheckCircle2,
  Tv,
  Mic,
  MapPin,
  Plus,
  Zap,
  Globe,
  Sliders,
  Play,
  AlertCircle,
  Server,
  Link as LinkIcon,
  Check,
} from 'lucide-react';

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  lang: Language;
  onSave: (updatedMatch: Match) => void;
  onDelete?: (matchId: string) => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  lang,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !match) return null;

  const [home, setHome] = useState<string>(match.home || '');
  const [away, setAway] = useState<string>(match.away || '');
  const [score, setScore] = useState<string>(match.score || 'vs');
  const [status, setStatus] = useState<'0' | '1' | '2'>(match.status || '0');
  const [time, setTime] = useState<string>(match.time || '20:00');
  const [league, setLeague] = useState<string>(match.league || '');
  const [channel, setChannel] = useState<string>(match.channel || 'beIN SPORTS 1 HD');
  const [commentary, setCommentary] = useState<string>(match.commentary || '');
  const [stadium, setStadium] = useState<string>(match.stadium || '');
  const [homeLogo, setHomeLogo] = useState<string>(match.home_logo || '');
  const [awayLogo, setAwayLogo] = useState<string>(match.away_logo || '');

  // Match Stream Links State
  const [streams, setStreams] = useState<StreamLink[]>(match.streams || []);
  const [showAddStream, setShowAddStream] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>('سيرفر 1 - فائق الجودة');
  const [newStreamUrl, setNewStreamUrl] = useState<string>('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [newPlayerType, setNewPlayerType] = useState<
    'shaka' | 'player_wrapper' | 'mux' | 'iframe' | 'hls' | 'dash' | 'video'
  >('player_wrapper');
  const [newQuality, setNewQuality] = useState<'1080p 60fps' | '720p HD' | '480p SD' | 'Auto'>('1080p 60fps');
  const [newReferrer, setNewReferrer] = useState<string>('');
  const [newUserAgent, setNewUserAgent] = useState<string>('');
  const [newOrigin, setNewOrigin] = useState<string>('');
  const [newDrmKey, setNewDrmKey] = useState<string>('');
  const [newClearKey, setNewClearKey] = useState<string>('');

  // Editing single stream inside match
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [editServerName, setEditServerName] = useState<string>('');
  const [editStreamUrl, setEditStreamUrl] = useState<string>('');
  const [editPlayerType, setEditPlayerType] = useState<
    'shaka' | 'player_wrapper' | 'mux' | 'iframe' | 'hls' | 'dash' | 'video'
  >('player_wrapper');
  const [editQuality, setEditQuality] = useState<'1080p 60fps' | '720p HD' | '480p SD' | 'Auto'>('1080p 60fps');
  const [editReferrer, setEditReferrer] = useState<string>('');
  const [editUserAgent, setEditUserAgent] = useState<string>('');
  const [editOrigin, setEditOrigin] = useState<string>('');
  const [editDrmKey, setEditDrmKey] = useState<string>('');
  const [editClearKey, setEditClearKey] = useState<string>('');

  // Stream link test status
  const [testingStatus, setTestingStatus] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; statusText?: string; latencyMs?: number } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleTestUrl = async (url: string) => {
    if (!url) return;
    setTestingStatus(lang === 'ar' ? 'جاري فحص الاتصال...' : 'Pinging stream...');
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ ok: false, statusText: e.message, latencyMs: 0 });
    } finally {
      setTestingStatus(null);
    }
  };

  const handleAddStreamToMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamUrl.trim()) return;

    const newLink: StreamLink = {
      id: 'match-link-' + Date.now(),
      matchId: match.id,
      channelName: channel || `${home} vs ${away}`,
      serverName: newServerName.trim() || 'سيرفر البث المباشر',
      streamUrl: newStreamUrl.trim(),
      playerType: newPlayerType,
      quality: newQuality,
      isActive: true,
      priority: streams.length + 1,
      latencyMs: 38,
      referrer: newReferrer.trim() || undefined,
      userAgent: newUserAgent.trim() || undefined,
      origin: newOrigin.trim() || undefined,
      drmKey: newDrmKey.trim() || undefined,
      clearKey: newClearKey.trim() || undefined,
    };

    setStreams((prev) => [...prev, newLink]);
    setShowAddStream(false);
    setNewStreamUrl('');
    setTestResult(null);
  };

  const handleStartEditStream = (s: StreamLink) => {
    setEditingStreamId(s.id);
    setEditServerName(s.serverName || '');
    setEditStreamUrl(s.streamUrl || '');
    setEditPlayerType(s.playerType || 'player_wrapper');
    setEditQuality(s.quality || '1080p 60fps');
    setEditReferrer(s.referrer || '');
    setEditUserAgent(s.userAgent || '');
    setEditOrigin(s.origin || '');
    setEditDrmKey(s.drmKey || '');
    setEditClearKey(s.clearKey || '');
    setTestResult(null);
  };

  const handleSaveEditStream = (streamId: string) => {
    if (!editStreamUrl.trim()) return;
    setStreams((prev) =>
      prev.map((s) => {
        if (s.id === streamId) {
          return {
            ...s,
            serverName: editServerName.trim() || s.serverName,
            streamUrl: editStreamUrl.trim(),
            playerType: editPlayerType,
            quality: editQuality,
            referrer: editReferrer.trim() || undefined,
            userAgent: editUserAgent.trim() || undefined,
            origin: editOrigin.trim() || undefined,
            drmKey: editDrmKey.trim() || undefined,
            clearKey: editClearKey.trim() || undefined,
          };
        }
        return s;
      })
    );
    setEditingStreamId(null);
    setTestResult(null);
  };

  const handleDeleteStream = (streamId: string) => {
    setStreams((prev) => prev.filter((s) => s.id !== streamId));
  };

  const handleToggleStreamActive = (streamId: string) => {
    setStreams((prev) =>
      prev.map((s) => (s.id === streamId ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updated: Match = {
      ...match,
      home: home.trim(),
      away: away.trim(),
      score: score.trim(),
      status,
      time: time.trim(),
      league: league.trim(),
      channel: channel.trim(),
      commentary: commentary.trim(),
      stadium: stadium.trim(),
      home_logo: homeLogo.trim(),
      away_logo: awayLogo.trim(),
      streams: streams,
    };

    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        onSave(updated);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Failed to update match:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmText =
      lang === 'ar'
        ? 'هل أنت متأكد من رغبتك في حذف هذه المباراة؟'
        : 'Are you sure you want to delete this match?';
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/matches/${match.id}?date=${match.date}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && onDelete) {
        onDelete(match.id);
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete match:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0c0c12] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#13131c] px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center text-[#ffcc00]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {lang === 'ar' ? 'تعديل المباراة وروابط البث' : 'Edit Match & Stream Links'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {lang === 'ar'
                  ? 'تعديل بيانات المباراة، النتيجة، وإضافة أو تعديل روابط البث المباشر'
                  : 'Update match details, score, and manage live stream server links'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {savedSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Changes saved successfully!'}</span>
            </div>
          )}

          {/* Teams Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'الفريق الأول (صاحب الأرض)' : 'Home Team'}
              </label>
              <input
                type="text"
                value={home}
                onChange={(e) => setHome(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'الفريق الثاني (الضيف)' : 'Away Team'}
              </label>
              <input
                type="text"
                value={away}
                onChange={(e) => setAway(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
              />
            </div>
          </div>

          {/* Score, Time & Status */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'النتيجة (Score)' : 'Score'}
              </label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="2 - 1 أو vs"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-[#ffcc00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'التوقيت' : 'Time'}
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="22:00"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white text-center font-mono focus:outline-none focus:border-[#ffcc00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'حالة المباراة' : 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as '0' | '1' | '2')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
              >
                <option value="0">{lang === 'ar' ? 'قادمة (Upcoming)' : 'Upcoming'}</option>
                <option value="1">{lang === 'ar' ? 'مباشر الآن 🔴 (Live)' : 'Live Now'}</option>
                <option value="2">{lang === 'ar' ? 'انتهت (Finished)' : 'Finished'}</option>
              </select>
            </div>
          </div>

          {/* League & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'البطولة / الدوري' : 'League'}
              </label>
              <input
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="الدوري الإسباني"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'القناة الناقلة' : 'Broadcast Channel'}
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="beIN SPORTS 1 HD"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
              />
            </div>
          </div>

          {/* Commentator & Stadium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'المعلق الرياضي' : 'Commentator'}
              </label>
              <input
                type="text"
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                placeholder="عصام الشوالي"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 mb-1 block">
                {lang === 'ar' ? 'الملعب' : 'Stadium'}
              </label>
              <input
                type="text"
                value={stadium}
                onChange={(e) => setStadium(e.target.value)}
                placeholder="الملعب الرئيسي"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffcc00]"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION: STREAM LINKS & SERVERS FOR THIS MATCH */}
          {/* ========================================================= */}
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#ffcc00] flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#ffcc00]" />
                  <span>{lang === 'ar' ? 'روابط وسيرفرات البث المباشر للمباراة' : 'Match Live Stream Links & Servers'}</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {lang === 'ar'
                    ? 'إضافة وتعديل روابط البث (HLS, Shaka DRM, MP4, Iframe) الخاصة بهذه المباراة'
                    : 'Add and edit live stream URLs (HLS, Shaka DRM, MP4, Iframe) for this match'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddStream(!showAddStream);
                  setEditingStreamId(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إضافة رابط بث للمباراة' : 'Add Stream to Match'}</span>
              </button>
            </div>

            {/* ADD STREAM INLINE FORM */}
            {showAddStream && (
              <div className="bg-[#14141c] p-3.5 rounded-xl border border-[#ffcc00]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#ffcc00] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إضافة رابط بث وسيرفر جديد للمباراة' : 'Add New Stream Link'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddStream(false)}
                    className="text-zinc-400 hover:text-white text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets for Quick Testing */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="text-zinc-500 font-bold shrink-0">{lang === 'ar' ? 'قوالب سريعة:' : 'Presets:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                      setNewServerName('سيرفر 1 - HLS Mux Ultra HD');
                      setNewPlayerType('hls');
                      setNewQuality('1080p 60fps');
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] border border-zinc-700 shrink-0 font-medium"
                  >
                    Mux HLS 1080p
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
                      setNewServerName('سيرفر 2 - MP4 مباشر احتياطي');
                      setNewPlayerType('video');
                      setNewQuality('720p HD');
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700 shrink-0 font-medium"
                  >
                    MP4 Direct Fast
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStreamUrl('https://test-streams.mux.dev/test_001/stream.m3u8');
                      setNewServerName('سيرفر 3 - بث جوال خفيف SD');
                      setNewPlayerType('hls');
                      setNewQuality('480p SD');
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 shrink-0 font-medium"
                  >
                    HLS Low SD
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                      {lang === 'ar' ? 'اسم السيرفر (سيرفر 1، 2، 3، 4، 5...)' : 'Server Node Name'}
                    </label>
                    <input
                      type="text"
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                      placeholder="سيرفر 1 - FHD عالي الدقة"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    {/* Quick server number buttons */}
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-400">
                      <span>{lang === 'ar' ? 'سيرفر:' : 'Server:'}</span>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNewServerName(lang === 'ar' ? `سيرفر ${num} - بث مباشر` : `Server ${num} - Live Stream`)}
                          className="px-1.5 py-0.2 rounded bg-zinc-800 hover:bg-[#ffcc00] hover:text-black transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                        {lang === 'ar' ? 'نوع المشغل' : 'Player Engine'}
                      </label>
                      <select
                        value={newPlayerType}
                        onChange={(e: any) => setNewPlayerType(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
                      >
                        <option value="player_wrapper">Player Wrapper (شامل)</option>
                        <option value="shaka">Shaka (DRM / ClearKey)</option>
                        <option value="hls">HLS (.m3u8 فائق السرعة)</option>
                        <option value="mux">Mux Video</option>
                        <option value="iframe">Iframe Embed (تضمين)</option>
                        <option value="dash">MPEG-DASH (.mpd)</option>
                        <option value="video">MP4 / Direct Video</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                        {lang === 'ar' ? 'الجودة' : 'Quality'}
                      </label>
                      <select
                        value={newQuality}
                        onChange={(e: any) => setNewQuality(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="1080p 60fps">1080p 60fps</option>
                        <option value="720p HD">720p HD</option>
                        <option value="480p SD">480p SD</option>
                        <option value="Auto">Auto</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                      {lang === 'ar' ? 'رابط البث (Stream URL / m3u8 / mpd / iframe)' : 'Stream URL'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newStreamUrl}
                        onChange={(e) => setNewStreamUrl(e.target.value)}
                        placeholder="https://rtve01p.origin.c21livecloud.com/live-origin/clan-hls/bitrate_1.m3u8"
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleTestUrl(newStreamUrl)}
                        disabled={!newStreamUrl || !!testingStatus}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'فحص الرابط' : 'Ping'}</span>
                      </button>
                    </div>

                    {testingStatus && (
                      <p className="text-[10px] text-zinc-400 mt-1">{testingStatus}</p>
                    )}
                    {testResult && (
                      <p className={`text-[10px] mt-1 font-bold ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {testResult.ok
                          ? `${lang === 'ar' ? 'الرابط يعمل بنجاح! الاستجابة:' : 'Online! Latency:'} ${testResult.latencyMs || 30}ms`
                          : `${lang === 'ar' ? 'فشل الاتصال:' : 'Error:'} ${testResult.statusText || 'Offline'}`}
                      </p>
                    )}
                  </div>

                  {/* Anti-block headers and DRM: Referrer, User_Agent, Origin, DrmKey, ClearKey */}
                  <div className="sm:col-span-2 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-2.5 text-xs">
                    <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#ffcc00]" />
                      <span>{lang === 'ar' ? 'إعدادات تخطي الحظر ومفاتيح التشفير (اختياري):' : 'Bypass Headers & DRM Keys (Optional):'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold">
                          Refferer / Referer:
                        </label>
                        <input
                          type="text"
                          value={newReferrer}
                          onChange={(e) => setNewReferrer(e.target.value)}
                          placeholder="https://origin-stream.live/"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold">
                          User_Agent:
                        </label>
                        <input
                          type="text"
                          value={newUserAgent}
                          onChange={(e) => setNewUserAgent(e.target.value)}
                          placeholder="Mozilla/5.0..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold">
                          Origin:
                        </label>
                        <input
                          type="text"
                          value={newOrigin}
                          onChange={(e) => setNewOrigin(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-400 block mb-0.5 font-bold">
                          Drmkey (Widevine / License):
                        </label>
                        <input
                          type="text"
                          value={newDrmKey}
                          onChange={(e) => setNewDrmKey(e.target.value)}
                          placeholder="https://license.com/cenc..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-emerald-400 block mb-0.5 font-bold">
                          ClearKey (KeyID:Key):
                        </label>
                        <input
                          type="text"
                          value={newClearKey}
                          onChange={(e) => setNewClearKey(e.target.value)}
                          placeholder="hexKeyId:hexKey"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddStream(false)}
                    className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddStreamToMatch}
                    className="px-4 py-1 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'إضافة الرابط للمباراة' : 'Add to Match'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STREAMS LIST */}
            <div className="space-y-2">
              {streams.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <p className="text-xs text-zinc-400">
                    {lang === 'ar'
                      ? 'لا توجد روابط مخصصة لهذه المباراة حالياً. سيتم تشغيل سيرفرات البث الافتراضية تلقائياً.'
                      : 'No custom streams assigned to this match yet. Default broadcast servers will be used.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddStream(true)}
                    className="mt-2 text-xs text-[#ffcc00] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'إضافة رابط بث مخصص الآن' : 'Add custom stream now'}</span>
                  </button>
                </div>
              ) : (
                streams.map((s, idx) => {
                  const isEditingThis = editingStreamId === s.id;

                  if (isEditingThis) {
                    return (
                      <div key={s.id} className="p-3 bg-[#13131c] rounded-xl border border-[#ffcc00]/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#ffcc00] flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? `تعديل سيرفر البث #${idx + 1}` : `Edit Stream Server #${idx + 1}`}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingStreamId(null)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold">
                              {lang === 'ar' ? 'اسم السيرفر' : 'Server Name'}
                            </label>
                            <input
                              type="text"
                              value={editServerName}
                              onChange={(e) => setEditServerName(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold">
                                {lang === 'ar' ? 'المشغل' : 'Player'}
                              </label>
                              <select
                                value={editPlayerType}
                                onChange={(e: any) => setEditPlayerType(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
                              >
                                <option value="player_wrapper">Player Wrapper (شامل)</option>
                                <option value="shaka">Shaka (DRM / ClearKey)</option>
                                <option value="hls">HLS (.m3u8 فائق السرعة)</option>
                                <option value="mux">Mux Video</option>
                                <option value="iframe">Iframe Embed (تضمين)</option>
                                <option value="dash">MPEG-DASH (.mpd)</option>
                                <option value="video">MP4 / Direct Video</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold">
                                {lang === 'ar' ? 'الجودة' : 'Quality'}
                              </label>
                              <select
                                value={editQuality}
                                onChange={(e: any) => setEditQuality(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white"
                              >
                                <option value="1080p 60fps">1080p</option>
                                <option value="720p HD">720p</option>
                                <option value="480p SD">480p</option>
                                <option value="Auto">Auto</option>
                              </select>
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold">
                              {lang === 'ar' ? 'رابط البث (Stream URL)' : 'Stream URL'}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={editStreamUrl}
                                onChange={(e) => setEditStreamUrl(e.target.value)}
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => handleTestUrl(editStreamUrl)}
                                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] text-xs font-bold flex items-center gap-1 shrink-0"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'فحص' : 'Ping'}</span>
                              </button>
                            </div>
                            {testResult && (
                              <p className={`text-[10px] mt-1 font-bold ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                                {testResult.ok
                                  ? `${lang === 'ar' ? 'يعمل بنجاح! الاستجابة:' : 'Online! Latency:'} ${testResult.latencyMs || 30}ms`
                                  : `${lang === 'ar' ? 'خطأ:' : 'Error:'} ${testResult.statusText || 'Offline'}`}
                              </p>
                            )}
                          </div>

                          {/* Anti-block headers and DRM edit */}
                          <div className="sm:col-span-2 p-2.5 bg-zinc-950 rounded-lg border border-zinc-800/80 space-y-2 text-xs">
                            <div className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                              <Sliders className="w-3 h-3 text-[#ffcc00]" />
                              <span>{lang === 'ar' ? 'الترويسات ومفاتيح التشفير:' : 'Headers & DRM:'}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[9px] text-zinc-400 block font-bold">Refferer:</label>
                                <input
                                  type="text"
                                  value={editReferrer}
                                  onChange={(e) => setEditReferrer(e.target.value)}
                                  placeholder="https://origin..."
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-zinc-400 block font-bold">User_Agent:</label>
                                <input
                                  type="text"
                                  value={editUserAgent}
                                  onChange={(e) => setEditUserAgent(e.target.value)}
                                  placeholder="Mozilla/5.0..."
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-zinc-400 block font-bold">Origin:</label>
                                <input
                                  type="text"
                                  value={editOrigin}
                                  onChange={(e) => setEditOrigin(e.target.value)}
                                  placeholder="https://..."
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-amber-400 block font-bold">Drmkey:</label>
                                <input
                                  type="text"
                                  value={editDrmKey}
                                  onChange={(e) => setEditDrmKey(e.target.value)}
                                  placeholder="https://license..."
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white font-mono"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-[9px] text-emerald-400 block font-bold">ClearKey (KeyID:Key):</label>
                                <input
                                  type="text"
                                  value={editClearKey}
                                  onChange={(e) => setEditClearKey(e.target.value)}
                                  placeholder="hexKeyId:hexKey"
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStreamId(null)}
                            className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditStream(s.id)}
                            className="px-4 py-1 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-black text-xs font-black flex items-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'حفظ تعديل الرابط' : 'Save Link Edit'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={s.id}
                      className="p-3 bg-zinc-900/80 hover:bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-black text-white">{s.serverName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[#ffcc00] font-mono text-[10px] font-bold">
                            {s.quality}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase text-[9px] font-mono">
                            {s.playerType}
                          </span>
                          {s.isActive ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              {lang === 'ar' ? 'مفعل' : 'Active'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px]">
                              {lang === 'ar' ? 'معطل' : 'Disabled'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono truncate max-w-md" title={s.streamUrl}>
                          {s.streamUrl}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStreamActive(s.id)}
                          className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold"
                          title={lang === 'ar' ? 'تفعيل / تعطيل الرابط' : 'Toggle Active'}
                        >
                          {s.isActive ? (lang === 'ar' ? 'تعطيل' : 'Disable') : (lang === 'ar' ? 'تفعيل' : 'Enable')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTestUrl(s.streamUrl)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] transition-colors"
                          title={lang === 'ar' ? 'فحص الاتصال' : 'Ping Test'}
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditStream(s)}
                          className="px-2.5 py-1 rounded-lg bg-[#ffcc00]/15 hover:bg-[#ffcc00] text-[#ffcc00] hover:text-black border border-[#ffcc00]/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          title={lang === 'ar' ? 'تعديل رابط البث' : 'Edit Stream Link'}
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStream(s.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                          title={lang === 'ar' ? 'حذف الرابط من المباراة' : 'Delete Stream'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'حذف المباراة' : 'Delete Match'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? lang === 'ar'
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : lang === 'ar'
                    ? 'حفظ التعديلات والروابط'
                    : 'Save Changes & Streams'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
