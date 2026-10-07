"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Volume2, Mic2, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { speech, speechErrorMessage, type SpeechVoice } from "@/lib/speech";

export interface TtsSettings {
  rate: number;
  voiceURI: string;
}

const STORAGE_KEY = "cook-tts-settings";

export function loadTtsSettings(): TtsSettings {
  if (typeof window === "undefined") return { rate: 1.12, voiceURI: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const value = JSON.parse(raw);
      return {
        rate: typeof value?.rate === "number" && Number.isFinite(value.rate) ? Math.min(2, Math.max(0.5, value.rate)) : 1.12,
        voiceURI: typeof value?.voiceURI === "string" ? value.voiceURI : "",
      };
    }
  } catch {}
  return { rate: 1.12, voiceURI: "" };
}

export function saveTtsSettings(s: TtsSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

interface Props {
  open: boolean;
  onClose: () => void;
  settings: TtsSettings;
  onChange: (s: TtsSettings) => void;
}

const RATE_PRESETS = [
  { label: "慢", value: 0.8 },
  { label: "正常", value: 1.0 },
  { label: "1.1x", value: 1.1 },
  { label: "1.12x", value: 1.12 },
  { label: "1.2x", value: 1.2 },
  { label: "快", value: 1.5 },
];

export function TtsSettingsPanel({ open, onClose, settings, onChange }: Props) {
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const load = () => {
      setLoading(true);
      setError("");
      void speech.getVoices().then((voices) => {
        if (active) setVoices(voices.filter((voice) => /^zh(-|_)/i.test(voice.lang)));
      }).catch((error) => {
        if (active) { setVoices([]); setError(speechErrorMessage(error)); }
      }).finally(() => { if (active) setLoading(false); });
    };
    const unsubscribe = speech.subscribeVoicesChanged(load);
    load();
    return () => { active = false; unsubscribe(); void speech.stop(); };
  }, [open]);

  const handleRate = (rate: number) => {
    const next = { ...settings, rate };
    onChange(next);
    saveTtsSettings(next);
  };

  const handleVoice = (voiceURI: string) => {
    const next = { ...settings, voiceURI };
    onChange(next);
    saveTtsSettings(next);
    preview(next);
  };

  const preview = (options: TtsSettings) => {
    setError("");
    void speech.speak("锅中加油，烧热后放入食材翻炒", options).catch((error) => setError(speechErrorMessage(error)));
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* 面板 */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[61] bottom-0 left-0 right-0 lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[420px] bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[85vh] lg:max-h-[80vh]"
          >
            {/* 顶部标题栏 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Volume2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-black tracking-tight text-foreground">朗读设置</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-neutral-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              {/* 速度 */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">朗读速度</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {RATE_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => handleRate(p.value)}
                      className={cn(
                        "h-10 rounded-xl border text-xs font-bold transition-all active:scale-95",
                        Math.abs(settings.rate - p.value) < 0.001
                          ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                          : "bg-white text-foreground border-border hover:border-neutral-300 hover:bg-neutral-50"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* 自定义滑杆 */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground w-6 shrink-0">慢</span>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.05}
                    value={settings.rate}
                    onChange={e => handleRate(parseFloat(e.target.value))}
                    className="flex-1 accent-primary h-1.5 rounded-full"
                  />
                  <span className="text-[10px] text-muted-foreground w-6 shrink-0 text-right">快</span>
                  <span className="text-xs font-bold text-primary w-10 text-right font-mono shrink-0">{settings.rate.toFixed(2)}x</span>
                </div>
              </div>

              <button onClick={() => preview(settings)} className="w-full rounded-xl border border-border py-2.5 text-xs font-bold text-primary">试听朗读</button>
              {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

              {/* 音色 */}
              {voices.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Mic2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">朗读音色</span>
                    <span className="text-[10px] text-muted-foreground ml-1">（点击可试听）</span>
                  </div>
                  <div className="space-y-1.5">
                    {voices.map(v => (
                      <button
                        key={v.voiceURI}
                        onClick={() => handleVoice(v.voiceURI)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-xl border text-xs transition-all active:scale-[0.99]",
                          settings.voiceURI === v.voiceURI
                            ? "bg-primary/8 border-primary/30 text-primary font-bold"
                            : "bg-white border-border text-foreground hover:border-neutral-300 hover:bg-neutral-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{v.name}</span>
                          {settings.voiceURI === v.voiceURI && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-primary">当前</span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{v.lang}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!error && voices.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  {loading ? "正在加载系统音色…" : "当前设备无可用中文音色，请检查系统语音设置。"}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
