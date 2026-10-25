"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VOICE_COMMAND_LABELS,
  VOICE_PHRASES,
  downloadVoiceModel,
  isVoiceModelReady,
  startVoiceListener,
  type VoiceCommand,
} from "@/lib/voice-commands";

type Status = "idle" | "downloading" | "loading" | "listening";

interface Props {
  variant: "desktop" | "mobile";
  onCommand: (command: VoiceCommand) => void;
  getSpokenText: () => string;
}

function ProgressRing({ ratio, size }: { ratio: number; size: number }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={2.5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ratio)}
      />
    </svg>
  );
}

export function VoiceControlButton({ variant, onCommand, getSpokenText }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ id: number; text: string; error?: boolean } | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // 回调可能每次渲染都变，监听器里始终读最新的
  const handlers = useRef({ onCommand, getSpokenText });
  useEffect(() => {
    handlers.current = { onCommand, getSpokenText };
  });

  // 每次开启语音控制都弹一下词表，告诉用户可以怎么说
  const [hintsOpen, setHintsOpen] = useState(false);
  const hintsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeHints = () => {
    clearTimeout(hintsTimer.current);
    setHintsOpen(false);
  };

  const showToast = (text: string, error = false) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, error });
    toastTimer.current = setTimeout(() => setToast(null), error ? 3200 : 1400);
  };

  useEffect(
    () => () => {
      stopRef.current?.();
      clearTimeout(toastTimer.current);
      clearTimeout(hintsTimer.current);
    },
    []
  );

  const start = async () => {
    try {
      if (!(await isVoiceModelReady())) {
        setStatus("downloading");
        setProgress(0);
        await downloadVoiceModel(setProgress);
      }
      setStatus("loading");
      stopRef.current = await startVoiceListener({
        onCommand: (command, heard) => {
          closeHints();
          showToast(`「${heard}」→ ${VOICE_COMMAND_LABELS[command]}`);
          handlers.current.onCommand(command);
        },
        getSpokenText: () => handlers.current.getSpokenText(),
      });
      setStatus("listening");
      setHintsOpen(true);
      clearTimeout(hintsTimer.current);
      hintsTimer.current = setTimeout(() => setHintsOpen(false), 10000);
    } catch (error) {
      setStatus("idle");
      showToast(error instanceof Error ? error.message : "语音控制开启失败", true);
    }
  };

  const toggle = () => {
    if (status === "downloading" || status === "loading") return;
    if (status === "listening") {
      stopRef.current?.();
      stopRef.current = null;
      closeHints();
      setStatus("idle");
      showToast("语音控制已关闭");
      return;
    }
    void start();
  };

  const listening = status === "listening";
  const busy = status === "downloading" || status === "loading";
  const title =
    status === "downloading"
      ? `正在下载语音模型 ${Math.round(progress * 100)}%`
      : status === "loading"
        ? "正在加载语音模型"
        : listening
          ? "关闭语音控制"
          : "语音控制：说「下一步」「翻页」「上一步」「暂停」「继续」「再读一遍」等";

  const icon =
    status === "downloading" ? (
      <span className="relative grid place-items-center">
        <ProgressRing ratio={progress} size={variant === "desktop" ? 26 : 22} />
        <span className="absolute text-[8px] font-black tabular-nums">{Math.round(progress * 100)}</span>
      </span>
    ) : status === "loading" ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : listening ? (
      <Mic className="h-4 w-4" />
    ) : (
      <MicOff className="h-4 w-4" />
    );

  return (
    <>
      <button
        onClick={toggle}
        title={title}
        aria-label={title}
        aria-pressed={listening}
        className={cn(
          "relative flex items-center justify-center transition-all",
          variant === "desktop"
            ? "h-26 w-11 flex-col gap-1.5 rounded-lg border active:scale-[0.97]"
            : "h-8 w-8 rounded-full",
          listening
            ? variant === "desktop"
              ? "bg-primary text-white border-primary"
              : "bg-primary text-white"
            : busy
              ? variant === "desktop"
                ? "bg-white text-primary border-primary/40"
                : "bg-primary/10 text-primary"
              : variant === "desktop"
                ? "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                : "bg-neutral-100/80 text-muted-foreground active:bg-neutral-200"
        )}
      >
        {icon}
        {variant === "desktop" && (
          <span className="text-[10px] font-bold leading-none">{listening ? "听着" : busy ? "准备" : "语音"}</span>
        )}
        {listening && (
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
        )}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {hintsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[95] mx-auto max-w-2xl rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-float)] sm:p-5"
                role="dialog"
                aria-label="语音指令词表"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">语音控制 / Voice</span>
                    <p className="text-base font-black text-foreground">已开启，直接说出下面的词</p>
                  </div>
                  <button
                    onClick={closeHints}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                  >
                    知道了
                  </button>
                </div>
                <dl className="mt-3 grid max-h-[50vh] gap-x-6 gap-y-2 overflow-y-auto sm:grid-cols-2">
                  {(Object.keys(VOICE_PHRASES) as VoiceCommand[]).map((command) => (
                    <div key={command} className="flex gap-2 border-t border-dashed border-border pt-2 text-xs leading-relaxed">
                      <dt className="w-14 shrink-0 font-bold text-primary">{VOICE_COMMAND_LABELS[command]}</dt>
                      <dd className="text-foreground/80">{VOICE_PHRASES[command].join("、")}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "pointer-events-none fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[100] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-bold shadow-lg",
                  toast.error ? "bg-red-500 text-white" : "bg-neutral-900 text-white"
                )}
              >
                {toast.text}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
