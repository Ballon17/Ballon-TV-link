import React, { useState } from 'react';
import type { Match, StreamLink, Language } from '../types';
import { Radio, Play, Plus, Zap, Clipboard, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

interface QuickStreamBoxProps {
  lang: Language;
  matches: Match[];
  onPlayDirectStream: (streamUrl: string, title?: string) => void;
  onAssignToMatch: (matchId: string, streamUrl: string, serverName?: string) => Promise<boolean>;
  onOpenAdmin: () => void;
}

export const QuickStreamBox: React.FC<QuickStreamBoxProps> = ({
  lang,
  matches,
  onPlayDirectStream,
  onAssignToMatch,
  onOpenAdmin,
}) => {
  const isAr = lang === 'ar';
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [targetMatchId, setTargetMatchId] = useState<string>('direct');
  const [serverName, setServerName] = useState<string>('سيرفر 1 - HLS فائق الدقة');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sampleUrl = 'https://rtve01p.origin.c21livecloud.com/live-origin/clan-hls/bitrate_1.m3u8';

  const handlePasteSample = () => {
    setStreamUrl(sampleUrl);
    setServerName('RTVE Clan Live HLS');
    setFeedback({
      type: 'success',
      text: isAr ? 'تم وضع رابط RTVE HLS بنجاح!' : 'Sample RTVE HLS link loaded!'
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setStreamUrl(text.trim());
          setFeedback({
            type: 'success',
            text: isAr ? 'تم لصق الرابط من الحافظة!' : 'Link pasted from clipboard!'
          });
          setTimeout(() => setFeedback(null), 3000);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleDirectPlay = () => {
    if (!streamUrl.trim()) {
      setFeedback({
        type: 'error',
        text: isAr ? 'يرجى وضع رابط البث أولاً في الخانة المحددة' : 'Please paste a stream URL first'
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    onPlayDirectStream(streamUrl.trim(), serverName || 'بث مباشر فوري');
  };

  const handleSaveToMatch = async () => {
    if (!streamUrl.trim()) {
      setFeedback({
        type: 'error',
        text: isAr ? 'يرجى وضع رابط البث أولاً في الخانة المحددة' : 'Please paste a stream URL first'
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    if (targetMatchId === 'direct') {
      handleDirectPlay();
      return;
    }

    setIsSaving(true);
    try {
      const ok = await onAssignToMatch(targetMatchId, streamUrl.trim(), serverName);
      if (ok) {
        const matchObj = matches.find((m) => m.id === targetMatchId);
        setFeedback({
          type: 'success',
          text: isAr
            ? `تم ربط ونشر البث بنجاح لمباراة (${matchObj?.home || ''} ضد ${matchObj?.away || ''})!`
            : 'Stream link assigned and deployed to match successfully!'
        });
        setStreamUrl('');
      } else {
        setFeedback({
          type: 'error',
          text: isAr ? 'فشل حفظ البث، يرجى المحاولة من لوحة التحكم' : 'Failed to save stream'
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: isAr ? 'حدث خطأ أثناء الحفظ' : 'An error occurred'
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-2 w-full">
      <div className="relative rounded-2xl bg-[#0d0d14] border-2 border-[#ffcc00] p-4 sm:p-5 shadow-[0_0_25px_rgba(255,204,0,0.18)] overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffcc00]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ffcc00] text-black flex items-center justify-center font-black shadow-md flex-shrink-0 animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isAr ? '📍 مكان وضع رابط البث المباشر (Stream URL Box)' : 'Live Stream URL Deploy Box'}
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#ffcc00]/20 text-[#ffcc00] border border-[#ffcc00]/40">
                  {isAr ? 'جاهز للاستخدام الفوري' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {isAr
                  ? 'ضع رابط البث هنا (.m3u8 أو MP4 أو كود التضمين) لتشغيله فوراً أو ربطه بمباراة معينة على الموقع'
                  : 'Paste your stream link (.m3u8, MP4 or Embed) to watch instantly or assign to any match'}
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-zinc-400 text-xs font-semibold">
              {isAr ? 'تجربة رابط سريع:' : 'Quick Sample:'}
            </span>
            <button
              type="button"
              onClick={handlePasteSample}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ffcc00] border border-[#ffcc00]/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>RTVE Live .m3u8</span>
            </button>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isAr ? 'لوحة المشرف المتقدمة' : 'Admin Panel'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mb-3 p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Main Input Form */}
        <div className="space-y-3">
          <div className="relative">
            <div className="flex items-center justify-between mb-1 text-xs">
              <label className="font-bold text-zinc-300 flex items-center gap-1">
                <span>{isAr ? 'رابط البث المباشر (M3U8 / MP4 / Embed):' : 'Stream URL (M3U8 / MP4 / Embed):'}</span>
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[#ffcc00] hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Clipboard className="w-3 h-3" />
                <span>{isAr ? 'لصق من الحافظة' : 'Paste'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://rtve01p.origin.c21livecloud.com/live-origin/clan-hls/bitrate_1.m3u8"
                className="flex-1 bg-black/60 border-2 border-zinc-700 focus:border-[#ffcc00] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none placeholder:text-zinc-600 shadow-inner"
              />

              <button
                type="button"
                onClick={handleDirectPlay}
                disabled={!streamUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(255,204,0,0.35)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>{isAr ? 'تشغيل فوري الآن ▶️' : 'Play Stream Now'}</span>
              </button>
            </div>
          </div>

          {/* Target Match Assignment row */}
          <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-bold text-zinc-400 whitespace-nowrap">
                {isAr ? 'ربط البث بمباراة اليوم:' : 'Assign to Match:'}
              </span>
              <select
                value={targetMatchId}
                onChange={(e) => setTargetMatchId(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold outline-none"
              >
                <option value="direct">
                  {isAr ? '📺 تشغيل مباشر فقط (بدون ربط بمباراة)' : 'Direct Play Only'}
                </option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    ⚽ {m.home} vs {m.away} ({m.time}) — {m.league}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveToMatch}
                disabled={!streamUrl.trim() || targetMatchId === 'direct' || isSaving}
                className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#ffcc00] hover:text-black text-zinc-200 border border-zinc-700 hover:border-[#ffcc00] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتفعيل للمباراة' : 'Save to Match')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
