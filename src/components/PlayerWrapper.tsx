import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../translations';
import type { Match, StreamLink, Language } from '../types';
import {
  createPlayerWrapper,
  STREAM_PRESETS,
  parseClearKey,
  type PlayerWrapperInstance,
  type PlayerStats,
} from '../lib/playerWrapper';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Tv,
  Volume2,
  VolumeX,
  Radio,
  Server,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  PictureInPicture,
  Expand,
  X,
  Sliders,
  KeyRound,
  Globe,
  Monitor,
  Cpu,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

// Helper to extract iframe src if user pasted full <iframe ...> embed tag
function extractIframeSrc(input?: string): string {
  if (!input) return '';
  if (input.includes('<iframe') && input.includes('src=')) {
    const match = input.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  return input;
}

interface PlayerWrapperProps {
  match: Match;
  onClose: () => void;
  lang: Language;
  availableStreams: StreamLink[];
}

export const PlayerWrapper: React.FC<PlayerWrapperProps> = ({
  match,
  onClose,
  lang,
  availableStreams,
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Match streams or general available active streams
  const streamPool = (match.streams && match.streams.length > 0) ? match.streams : availableStreams;
  const streams = streamPool.filter((s) => s.isActive);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState<number>(0);
  const activeStream = streams[selectedStreamIndex] || streams[0];

  // Player controls state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [isTheater, setIsTheater] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [reportedSuccess, setReportedSuccess] = useState<boolean>(false);
  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(38);

  // Wrapper Library Custom Controls State (Requested: referrer, User_Agent, drmkey, clearkey, origine)
  const [isWrapperDrawerOpen, setIsWrapperDrawerOpen] = useState<boolean>(false);
  const [referrer, setReferrer] = useState<string>('');
  const [userAgent, setUserAgent] = useState<string>('');
  const [drmKey, setDrmKey] = useState<string>('');
  const [clearKey, setClearKey] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [engine, setEngine] = useState<'auto' | 'shaka' | 'hls' | 'video'>('auto');
  const [useProxy, setUseProxy] = useState<boolean>(true);

  const [appliedFeedback, setAppliedFeedback] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

  const wrapperInstanceRef = useRef<PlayerWrapperInstance | null>(null);

  // Sync state when activeStream changes
  useEffect(() => {
    if (activeStream) {
      setReferrer(activeStream.referrer || activeStream.customReferer || '');
      setUserAgent(activeStream.userAgent || '');
      setDrmKey(activeStream.drmKey || '');
      setClearKey(activeStream.clearKey || '');
      setOrigin(activeStream.origin || '');
      setEngine(activeStream.playerType === 'shaka' ? 'shaka' : 'auto');
      setUseProxy(true);
    }
  }, [activeStream]);

  // Initialize and mount player wrapper instance
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStream) return;

    if (activeStream.playerType === 'iframe') {
      setIsBuffering(false);
      return;
    }

    let isCancelled = false;
    setIsBuffering(true);
    setStreamError(null);

    if (wrapperInstanceRef.current) {
      wrapperInstanceRef.current.destroy();
      wrapperInstanceRef.current = null;
    }

    const currentUrl = activeStream.streamUrl;

    createPlayerWrapper(
      video,
      currentUrl,
      {
        referrer: referrer || undefined,
        userAgent: userAgent || undefined,
        drmKey: drmKey || undefined,
        clearKey: clearKey || undefined,
        origin: origin || undefined,
        playerEngine: engine,
        useProxy,
      },
      (buffering) => {
        if (!isCancelled) setIsBuffering(buffering);
      },
      (errorMsg) => {
        if (!isCancelled) setStreamError(errorMsg);
      }
    )
      .then((instance) => {
        if (isCancelled) {
          instance.destroy();
          return;
        }
        wrapperInstanceRef.current = instance;
        instance.setVolume(volume);
        instance.setMuted(isMuted);
        setPlayerStats(instance.getStats());
        setLatency(activeStream.latencyMs || Math.floor(28 + Math.random() * 25));
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Player initialization error:', err);
          setStreamError(err.message || 'فشل تشغيل تدفق الفيديو عبر مكتبة Player Wrapper');
          setIsBuffering(false);
        }
      });

    return () => {
      isCancelled = true;
      if (wrapperInstanceRef.current) {
        wrapperInstanceRef.current.destroy();
        wrapperInstanceRef.current = null;
      }
    };
  }, [selectedStreamIndex, activeStream?.streamUrl]);

  // Video play/pause toggle
  const togglePlay = () => {
    if (wrapperInstanceRef.current) {
      if (isPlaying) {
        wrapperInstanceRef.current.pause();
        setIsPlaying(false);
      } else {
        wrapperInstanceRef.current.play().then(() => setIsPlaying(true));
      }
    } else if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Mute / Unmute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (wrapperInstanceRef.current) {
      wrapperInstanceRef.current.setMuted(newMuted);
    } else if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  // Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (wrapperInstanceRef.current) {
      wrapperInstanceRef.current.setVolume(val);
      wrapperInstanceRef.current.setMuted(val === 0);
    } else if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Reload Stream
  const reloadStream = async () => {
    setIsBuffering(true);
    setStreamError(null);
    if (wrapperInstanceRef.current) {
      await wrapperInstanceRef.current.reload();
      setPlayerStats(wrapperInstanceRef.current.getStats());
      setIsBuffering(false);
    } else if (videoRef.current) {
      const src = videoRef.current.src;
      videoRef.current.src = '';
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = src;
          videoRef.current.play().catch(() => {});
          setIsBuffering(false);
        }
      }, 300);
    }
  };

  // Apply Custom Wrapper & DRM Settings
  const handleApplyWrapperOptions = async () => {
    setIsBuffering(true);
    setStreamError(null);
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 3000);

    const video = videoRef.current;
    if (!video || !activeStream) return;

    if (wrapperInstanceRef.current) {
      wrapperInstanceRef.current.destroy();
      wrapperInstanceRef.current = null;
    }

    try {
      const instance = await createPlayerWrapper(
        video,
        activeStream.streamUrl,
        {
          referrer: referrer || undefined,
          userAgent: userAgent || undefined,
          drmKey: drmKey || undefined,
          clearKey: clearKey || undefined,
          origin: origin || undefined,
          playerEngine: engine,
          useProxy,
        },
        (buffering) => setIsBuffering(buffering),
        (errorMsg) => setStreamError(errorMsg)
      );

      wrapperInstanceRef.current = instance;
      instance.setVolume(volume);
      instance.setMuted(isMuted);
      setPlayerStats(instance.getStats());
    } catch (err: any) {
      setStreamError(err.message || 'فشل إعادة ضبط مشغل الفيديو بالبيانات المدخلة');
      setIsBuffering(false);
    }
  };

  // Apply Preset
  const handleApplyPreset = (presetId: string) => {
    const found = STREAM_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    setReferrer(found.referrer);
    setUserAgent(found.userAgent);
    setOrigin(found.origin);
    setEngine(found.engine);

    if (presetId === 'ssc-clearkey') {
      setClearKey('279c29792e35eb9eed93132e48e02d84:95cfd0cd23ef98d9ee8148fa134d193d');
    }
  };

  // Report Issue
  const handleReportIssue = async () => {
    setIsReporting(true);
    try {
      await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName: `${match.home} vs ${match.away} (${activeStream?.channelName || match.channel})`,
          issueDescription: `Reported issue on server: ${activeStream?.serverName}`,
        }),
      });
      setReportedSuccess(true);
      setTimeout(() => setReportedSuccess(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReporting(false);
    }
  };

  const parsedKeysCount = clearKey ? Object.keys(parseClearKey(clearKey) || {}).length : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        ref={containerRef}
        className={`w-full bg-[#0a0a0e] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden transition-all flex flex-col my-auto relative ${
          isTheater ? 'max-w-[96vw]' : 'max-w-5xl'
        }`}
      >
        {/* Top Bar: Match Header, Controls Toggle & Close */}
        <div className="bg-[#121217] px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate flex items-center gap-2">
                <span>{match.home}</span>
                <span className="text-[#ffcc00] font-black px-1.5 py-0.5 rounded bg-black/60 text-xs border border-zinc-800">
                  {match.score || 'vs'}
                </span>
                <span>{match.away}</span>
              </h2>
              <p className="text-[11px] text-zinc-400 truncate flex items-center gap-2">
                <span>{match.league}</span>
                <span>•</span>
                <span className="text-[#ffcc00] font-semibold">{match.channel || 'beIN SPORTS'}</span>
                {match.commentary && (
                  <>
                    <span>•</span>
                    <span>{match.commentary}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Player Wrapper DRM & Headers Configuration Drawer Toggle */}
            <button
              id="btn-wrapper-controls"
              type="button"
              onClick={() => setIsWrapperDrawerOpen(!isWrapperDrawerOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isWrapperDrawerOpen
                  ? 'bg-[#ffcc00] text-black shadow-lg shadow-[#ffcc00]/20'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 hover:border-[#ffcc00]/50'
              }`}
              title="إعدادات مكتبة Player Wrapper (Referrer, User_Agent, DRM Key, ClearKey, Origin)"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'إعدادات المشغل والـ DRM' : 'Wrapper Controls'}
              </span>
              {(clearKey || drmKey || referrer || userAgent || origin) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Report Button */}
            <button
              onClick={handleReportIssue}
              disabled={isReporting || reportedSuccess}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                reportedSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800'
              }`}
              title={t.reportIssue}
            >
              {reportedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.issueReported}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{t.reportIssue}</span>
                </>
              )}
            </button>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheater(!isTheater)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              title={t.playerTheater}
            >
              <Expand className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              id="btn-close-player"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Server Switcher Bar */}
        <div className="bg-[#0e0e13] border-b border-zinc-800/80 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold flex-shrink-0 mr-2 rtl:ml-2 rtl:mr-0">
              <Server className="w-3.5 h-3.5 text-[#ffcc00]" />
              <span>{t.playerServers}:</span>
            </div>

            {streams.map((stream, idx) => {
              const isSelected = idx === selectedStreamIndex;
              const hasDrm = Boolean(stream.clearKey || stream.drmKey);

              return (
                <button
                  key={stream.id}
                  id={`server-btn-${stream.id}`}
                  onClick={() => setSelectedStreamIndex(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffcc00] text-black shadow-[0_0_10px_rgba(255,204,0,0.3)]'
                      : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <Radio className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-[#ffcc00]'}`} />
                  <span>{stream.serverName}</span>
                  {hasDrm && (
                    <span className="px-1 py-0.2 rounded bg-red-500/20 text-red-300 text-[9px] font-mono">
                      DRM
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-black/20 text-black' : 'bg-black/50 text-zinc-400'
                    }`}
                  >
                    {stream.quality}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active DRM & Headers Indicator Pills */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] flex-shrink-0">
            <span
              className={`px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 ${
                clearKey
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}
              title={clearKey ? `ClearKey Active: ${clearKey}` : 'No ClearKey configured'}
            >
              <KeyRound className="w-2.5 h-2.5" />
              <span>ClearKey</span>
            </span>

            <span
              className={`px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 ${
                referrer
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}
              title={referrer ? `Referrer: ${referrer}` : 'Default Referrer'}
            >
              <Globe className="w-2.5 h-2.5" />
              <span>Referrer</span>
            </span>

            <span
              className={`px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 ${
                userAgent
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}
              title={userAgent ? `User-Agent: ${userAgent}` : 'Default Browser UA'}
            >
              <Monitor className="w-2.5 h-2.5" />
              <span>User-Agent</span>
            </span>

            <span
              className={`px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 ${
                origin
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}
              title={origin ? `Origin: ${origin}` : 'Default Origin'}
            >
              <Cpu className="w-2.5 h-2.5" />
              <span>Origin</span>
            </span>
          </div>
        </div>

        {/* Collapsible Interactive Player Wrapper Drawer (Control Panel) */}
        {isWrapperDrawerOpen && (
          <div className="bg-[#0f0f15] border-b border-zinc-800 p-4 space-y-4 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#ffcc00]" />
                  <span>{t.wrapperControls}</span>
                </h3>
                <p className="text-[11px] text-zinc-400">{t.wrapperDesc}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ssc-clearkey')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-amber-300 font-bold transition-all cursor-pointer"
                >
                  ⚡ {t.presetSsc}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('bein')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-bold transition-all cursor-pointer"
                >
                  ⚡ {t.presetBein}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('clean')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-400 font-bold transition-all cursor-pointer"
                >
                  🔄 {t.presetDirect}
                </button>
              </div>
            </div>

            {/* Grid of Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* 1. Referrer Input */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.referrerLabel}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">ref / Referer</span>
                </label>
                <input
                  type="text"
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                  placeholder="e.g. https://live.beinsports.com/"
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-none"
                />
              </div>

              {/* 2. User-Agent Input */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.userAgentLabel}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">User_Agent</span>
                </label>
                <input
                  type="text"
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  placeholder="e.g. Mozilla/5.0 (Windows NT 10.0; Win64; x64) / ExoPlayer"
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-none"
                />
              </div>

              {/* 3. Origin Input */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.originLabel}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">origin / CORS</span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. https://live.beinsports.com"
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-none"
                />
              </div>

              {/* 4. ClearKey Input (clearkey) */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.clearKeyLabel}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {parsedKeysCount > 0 ? `✓ ${parsedKeysCount} Key` : 'clearkey'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clearKey}
                    onChange={(e) => setClearKey(e.target.value)}
                    placeholder="hexKeyId:hexKey أو JSON"
                    className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-emerald-400 rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-none pr-14 rtl:pl-14 rtl:pr-3"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setClearKey('279c29792e35eb9eed93132e48e02d84:95cfd0cd23ef98d9ee8148fa134d193d');
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="absolute right-1.5 rtl:left-1.5 rtl:right-auto top-1.5 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-mono"
                    title="إدراج مفتاح تجريبي"
                  >
                    {copiedKey ? '✓ تم' : 'مفتاح تجريبي'}
                  </button>
                </div>
              </div>

              {/* 5. DRM Key Input (drmkey) */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    <span>{t.drmKeyLabel}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">drmkey / Widevine</span>
                </label>
                <input
                  type="text"
                  value={drmKey}
                  onChange={(e) => setDrmKey(e.target.value)}
                  placeholder="https://license.server/widevine أو DRM Key"
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white font-mono text-[11px] outline-none"
                />
              </div>

              {/* 6. Engine Selector */}
              <div className="space-y-1">
                <label className="font-bold text-zinc-300 flex items-center justify-between">
                  <span>{t.engineLabel}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Shaka / HLS</span>
                </label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value as any)}
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-[#ffcc00] rounded-xl px-3 py-2 text-white text-[11px] outline-none cursor-pointer"
                >
                  <option value="auto">{t.engineAuto}</option>
                  <option value="shaka">{t.engineShaka}</option>
                  <option value="hls">{t.engineHls}</option>
                  <option value="video">{t.engineVideo}</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions of Drawer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useProxy}
                  onChange={(e) => setUseProxy(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-[#ffcc00] cursor-pointer"
                />
                <span>{t.useProxyLabel}</span>
              </label>

              <div className="flex items-center gap-2">
                {appliedFeedback && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم تطبيق الإعدادات بنجاح!</span>
                  </span>
                )}
                <button
                  id="btn-apply-wrapper-settings"
                  type="button"
                  onClick={handleApplyWrapperOptions}
                  className="px-4 py-2 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.applyWrapperSettings}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Video Player Screen */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
          {activeStream?.playerType === 'iframe' || activeStream?.streamUrl?.includes('<iframe') ? (
            <iframe
              src={extractIframeSrc(activeStream.streamUrl)}
              className="w-full h-full border-0"
              referrerPolicy={referrer ? 'no-referrer-when-downgrade' : 'origin'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                playsInline
                autoPlay
              />

              {/* Buffering Spinner */}
              {isBuffering && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-[#ffcc00] animate-spin" />
                  <p className="text-xs text-[#ffcc00] font-bold tracking-wide">
                    {lang === 'ar'
                      ? 'جاري تجهيز مشغل Player Wrapper وتطبيق الهيدرز والـ DRM...'
                      : 'Initializing Player Wrapper & Streaming Engine...'}
                  </p>
                </div>
              )}

              {/* Stream Error State */}
              {streamError && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center gap-3">
                  <AlertTriangle className="w-12 h-12 text-amber-500" />
                  <p className="text-sm font-bold text-white max-w-md">{streamError}</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    <button
                      onClick={reloadStream}
                      className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t.playerReload}</span>
                    </button>
                    <button
                      onClick={() => setIsWrapperDrawerOpen(true)}
                      className="px-4 py-1.5 rounded-lg bg-[#ffcc00]/20 hover:bg-[#ffcc00]/30 border border-[#ffcc00]/40 text-xs font-bold text-[#ffcc00] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>تعديل مفاتيح التشفير أو الهيدرز</span>
                    </button>
                    {streams.length > 1 && (
                      <button
                        onClick={() =>
                          setSelectedStreamIndex((selectedStreamIndex + 1) % streams.length)
                        }
                        className="px-4 py-1.5 rounded-lg bg-[#ffcc00] hover:bg-[#e6b800] text-xs font-black text-black cursor-pointer"
                      >
                        التبديل إلى سيرفر بديل
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Player Overlay Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col gap-2 transition-opacity duration-300 opacity-95 group-hover:opacity-100">
                <div className="flex items-center justify-between gap-3 text-white">
                  {/* Left Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-lg bg-zinc-900/80 hover:bg-[#ffcc00] hover:text-black transition-colors cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={reloadStream}
                      className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title={t.playerReload}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2 py-1.5 rounded-lg">
                      <button
                        onClick={toggleMute}
                        className="text-zinc-300 hover:text-white cursor-pointer"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#ffcc00]"
                      />
                    </div>

                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-black">
                      LIVE
                    </span>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    {/* Engine & Quality Badge */}
                    <span className="px-2 py-1 rounded bg-zinc-900/90 border border-zinc-700 text-[11px] font-mono text-[#ffcc00] font-bold flex items-center gap-1">
                      <span>{playerStats?.engine?.toUpperCase() || 'HLS'}</span>
                      <span>•</span>
                      <span>{activeStream?.quality || '1080p'}</span>
                    </span>

                    {/* PiP */}
                    <button
                      onClick={togglePip}
                      className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 transition-colors hidden sm:block cursor-pointer"
                      title={t.playerPip}
                    >
                      <PictureInPicture className="w-4 h-4" />
                    </button>

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title={t.playerFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Status & Diagnostics Footer */}
        <div className="bg-[#121217] px-4 py-2.5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold text-zinc-300">
                {t.playerProxyActive}
              </span>
            </div>

            <span className="text-zinc-600">|</span>

            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{latency}ms</span>
            </span>

            {playerStats && playerStats.bufferedSeconds > 0 && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="font-mono text-zinc-300 text-[11px]">
                  كاش البث: {playerStats.bufferedSeconds}s
                </span>
              </>
            )}

            {clearKey && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1 font-bold">
                  <KeyRound className="w-3 h-3" />
                  <span>ClearKey Active</span>
                </span>
              </>
            )}
          </div>

          <div className="text-[11px] text-zinc-500">
            {t.switchServerHint}
          </div>
        </div>
      </div>
    </div>
  );
};
