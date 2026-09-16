import React, { useState } from 'react';
import { translations } from '../translations';
import type { Language } from '../types';
import {
  Headphones,
  CheckCircle2,
  Send,
  Zap,
  ShieldCheck,
  Server,
  X,
  MessageSquare,
  Clock
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const t = translations[lang];
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ticketResult, setTicketResult] = useState<string | null>(null);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message, priority: 'high' }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketResult(data.ticketId);
        setMessage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0d0d12] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#14141c] px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffcc00]/10 border border-[#ffcc00]/30 flex items-center justify-center text-[#ffcc00]">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">{t.supportTitle}</h3>
              <p className="text-[11px] text-zinc-400">
                {lang === 'ar'
                  ? 'غرفة عمليات تقنية لمراقبة البث والخوادم الموزعة'
                  : 'Technical Operations Room monitoring stream nodes & proxies'}
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

        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold text-emerald-400 block">
                {t.supportStatusAllSystems}
              </span>
              <span className="text-zinc-400 text-[11px]">
                {lang === 'ar'
                  ? 'زمن الاستجابة الحالي: 38ms | نسبة التوافر: 99.98%'
                  : 'Current Latency: 38ms | Availability: 99.98%'}
              </span>
            </div>
          </div>

          {/* SLA Features */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ffcc00]" />
              <div>
                <span className="font-bold text-white block">مراقبة 24/7</span>
                <span className="text-[10px] text-zinc-400">استجابة خلال ثوانٍ</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-white block">تحويل فوري</span>
                <span className="text-[10px] text-zinc-400">تجاوز تلقائي للأعطال</span>
              </div>
            </div>
          </div>

          {/* Ticket Form */}
          {ticketResult ? (
            <div className="p-4 rounded-xl bg-zinc-900 border border-[#ffcc00]/30 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">
                {t.ticketSent} <span className="font-mono text-[#ffcc00]">{ticketResult}</span>
              </h4>
              <p className="text-xs text-zinc-400">{t.ticketFollowUp}</p>
              <button
                onClick={() => setTicketResult(null)}
                className="mt-2 px-4 py-1.5 rounded-lg bg-zinc-800 text-xs font-bold text-white hover:bg-zinc-700"
              >
                إرسال استفسار آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-3">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#ffcc00]" />
                <span>{t.supportContact}</span>
              </h4>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني للمتابعة (اختياري)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffcc00]"
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder={t.supportMessagePlaceholder}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ffcc00] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#ffcc00] hover:bg-[#e6b800] text-black font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'جاري الإرسال...' : t.sendTicket}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
