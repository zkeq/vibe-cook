"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, Clock, ChefHat, Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { requestWakeLock, releaseWakeLock, reacquireOnVisible } from "@/lib/wake-lock";
import { Fancybox as NativeFancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { TtsSettingsPanel, loadTtsSettings, type TtsSettings } from "@/components/cook/tts-settings-panel";

const renderHighlightedTitle = (title: string) => {
  const verbs = ["洗净", "合炒", "调味出锅", "切块", "打鸡蛋", "煎鸡蛋", "盛出", "炒", "切", "打", "煎", "煮", "蒸", "炖", "拌", "去皮", "腌制", "滑炒", "爆香", "勾芡", "备菜"];
  const matchedVerb = verbs.find(v => title.includes(v));
  if (!matchedVerb) {
    return <span>{title}</span>;
  }

  const index = title.indexOf(matchedVerb);
  const before = title.substring(0, index);
  const after = title.substring(index + matchedVerb.length);

  return (
    <span>
      {before}
      <span className="text-primary font-black">{matchedVerb}</span>
      {after}
    </span>
  );
};

const renderHighlightedInstruction = (instruction: string) => {
  const verbs = [
    "洗净", "合炒", "调味出锅", "切块", "打入", "加入", "搅匀", "盛出",
    "炒", "切", "打", "煎", "煮", "蒸", "炖", "拌", "去皮", "腌制",
    "滑炒", "爆香", "勾芡", "备菜", "放入", "倒入", "翻炒", "淋入",
    "撒入", "搅拌", "焖", "煨", "炸", "烤", "烧", "煲", "熬", "焯",
    "过", "滤", "挤", "压", "捏", "揉", "擀", "卷", "包", "裹"
  ];

  // 按长度降序排序，优先匹配长的词
  const sortedVerbs = [...verbs].sort((a, b) => b.length - a.length);

  let result: React.ReactNode[] = [];
  let remaining = instruction;
  let key = 0;

  while (remaining) {
    let matched = false;

    for (const verb of sortedVerbs) {
      const index = remaining.indexOf(verb);
      if (index !== -1) {
        // 添加动词前的文本
        if (index > 0) {
          result.push(<span key={key++}>{remaining.substring(0, index)}</span>);
        }
        // 添加高亮的动词
        result.push(<span key={key++} className="text-primary font-black">{verb}</span>);
        // 更新剩余文本
        remaining = remaining.substring(index + verb.length);
        matched = true;
        break;
      }
    }

    // 如果没有匹配到任何动词，添加剩余文本
    if (!matched) {
      result.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return <>{result}</>;
};

interface CookClientProps {
  recipe: Recipe;
}

export function CookClient({ recipe }: CookClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // 步骤正计时状态
  const [stepTimeElapsed, setStepTimeElapsed] = useState(0);
  const [isStepTimerRunning, setIsStepTimerRunning] = useState(false);

  // 侧边栏拖动相关
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [tempWidth, setTempWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsSettings, setTtsSettings] = useState<TtsSettings>({ rate: 1.12, voiceURI: "" });
  const [ttsSettingsOpen, setTtsSettingsOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepImageContainerRef = useRef<HTMLDivElement>(null);

  // Fancybox 步骤图放大
  useEffect(() => {
    const container = stepImageContainerRef.current;
    if (!container) return;
    NativeFancybox.bind(container, "[data-fancybox]", {
      Toolbar: {
        display: { left: [], middle: [], right: ["zoom", "fullscreen", "close"] },
      },
    } as any);
    return () => {
      NativeFancybox.unbind(container);
      NativeFancybox.close();
    };
  }, []);

  // 移动端步骤条自动居中滚动
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.children[currentStep] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentStep]);

  // 屏幕常亮
  useEffect(() => {
    void requestWakeLock();
    const cleanup = reacquireOnVisible();
    return () => {
      cleanup();
      void releaseWakeLock();
    };
  }, []);

  // 从 localStorage 读取侧边栏宽度 & TTS 设置
  useEffect(() => {
    setMounted(true);
    const savedWidth = localStorage.getItem("cook-sidebar-width");
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth)) {
        setSidebarWidth(parsedWidth);
        setTempWidth(parsedWidth);
      }
    }
    setTtsSettings(loadTtsSettings());
  }, []);

  // 拖动处理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = Math.max(240, Math.min(480, e.clientX));
      setTempWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setSidebarWidth(tempWidth);
        localStorage.setItem("cook-sidebar-width", tempWidth.toString());
      }
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, tempWidth]);

  // 计时器（总用时）
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // 当步骤切换时，重置步骤计时
  useEffect(() => {
    setIsStepTimerRunning(false);
    setStepTimeElapsed(0);
  }, [currentStep]);

  // TTS 朗读当前步骤
  useEffect(() => {
    if (!ttsEnabled) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const step = recipe.steps[currentStep];
    if (!step) return;
    window.speechSynthesis.cancel();
    const text = `第${step.index}步，${step.title}。${step.instruction}`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-CN";
    utter.rate = ttsSettings.rate;
    if (ttsSettings.voiceURI) {
      const v = window.speechSynthesis.getVoices().find(x => x.voiceURI === ttsSettings.voiceURI);
      if (v) utter.voice = v;
    }
    window.speechSynthesis.speak(utter);
    return () => { window.speechSynthesis.cancel(); };
  }, [currentStep, ttsEnabled, ttsSettings, recipe.steps]);

  // 步骤正计时逻辑
  useEffect(() => {
    if (!isStepTimerRunning) return;
    const interval = setInterval(() => {
      setStepTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStepTimerRunning]);

  const handleNext = () => {
    if (currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = recipe.steps[currentStep];
  const totalDuration = recipe.steps.reduce((sum, step) => sum + (step.duration_sec || 0), 0);
  const remainingTime = totalDuration - elapsedTime;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-neutral-50 text-foreground overflow-hidden">

      {/* 左侧栏 - 仪表盘式垂直目录 - 桌面端显示，移动端隐藏 */}
      <aside
        ref={sidebarRef}
        className="hidden lg:flex flex-col border-r border-border bg-white z-20 shrink-0 relative"
        style={{ width: isDragging ? `${tempWidth}px` : `${sidebarWidth}px` }}
      >
        {/* 菜名和简介 */}
        <div className="p-5 border-b border-border bg-white flex gap-3">
          {/* 成品图 */}
          {recipe.cover_image && (
            <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-100 border border-border">
              <img
                src={recipe.cover_image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 文字信息 */}
          <div className="flex-1 min-w-0">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wide">
              {recipe.category}
            </span>
            <h1 className="text-base font-black text-foreground tracking-tight mt-1.5 leading-tight truncate">{recipe.title}</h1>
            <p className="text-[11px] leading-relaxed text-muted-foreground mt-1 line-clamp-2">{recipe.summary}</p>
          </div>
        </div>

        {/* 步骤列表 */}
        <div className="flex-1 overflow-y-auto py-1">
          {recipe.steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "w-full text-left px-5 py-3.5 border-b border-border/40 transition-colors flex items-start gap-3 group relative cursor-pointer",
                i === currentStep
                  ? "bg-primary/10 text-primary font-bold"
                  : "hover:bg-neutral-50/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {/* 活动状态左侧线条 */}
              {i === currentStep && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}

              {/* 步骤数字圆圈 */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold border transition-colors",
                  i === currentStep
                    ? "bg-primary text-white border-primary shadow-sm"
                    : i < currentStep
                    ? "bg-neutral-800 text-white border-neutral-800"
                    : "bg-white text-muted-foreground border-border group-hover:border-neutral-300"
                )}
              >
                {i + 1}
              </div>

              {/* 步骤名 */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-xs font-bold leading-normal tracking-tight truncate",
                  i === currentStep ? "text-primary font-extrabold" : "text-foreground/80"
                )}>
                  {step.title}
                </div>
                {step.duration_sec && (
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground/80 font-medium">
                    <Clock className="h-3 w-3" />
                    <span>预计耗时：{Math.ceil(step.duration_sec / 60)}分钟</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 拖动手柄 */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/30 transition-colors group z-30"
          onMouseDown={() => setIsDragging(true)}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-border group-hover:bg-primary/50 transition-colors rounded-full" />
        </div>

        {/* 拖动时的覆盖层 */}
        {isDragging && mounted && createPortal(
          <div className="fixed inset-0 z-50 cursor-ew-resize" />,
          document.body
        )}
      </aside>

      {/* 右侧主区域 */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-neutral-50/40 relative overflow-hidden">
        
        {/* ========================================================================= */}
        {/* ============================== 桌面端视图 ============================== */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none z-0"
            style={{
              backgroundImage: "radial-gradient(circle, #e0e0e0 1.2px, transparent 1.2px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* 桌面端：顶部指令横幅 */}
          <div className="flex min-h-24 border-b-2 border-border bg-gradient-to-br from-white via-neutral-50/80 to-white items-center justify-between px-8 py-4 z-10 shrink-0 shadow-md">
            {/* 左侧：状态指示器 + 行动指令 */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
              {/* 进度状态 */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">步骤进度</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-4xl font-black text-primary tabular-nums leading-none">{String(currentStep + 1).padStart(2, '0')}</span>
                    <span className="text-base font-bold text-muted-foreground">/</span>
                    <span className="text-2xl font-black text-muted-foreground tabular-nums leading-none">{String(recipe.steps.length).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>

              {/* 垂直分隔 */}
              <div className="h-12 w-px bg-border shrink-0" />

              {/* 行动指令区 */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">ACTION REQUIRED</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight leading-tight">
                  {renderHighlightedInstruction(currentStepData.instruction)}
                </h2>
              </div>
            </div>

            {/* 右侧：控制按钮组 */}
            <div className="flex items-start gap-3 shrink-0 ml-6">
              {/* 导航控制 */}
              <div className="flex flex-col gap-2">
                {/* 上一步 */}
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={cn(
                    "flex items-center justify-center h-12 px-5 rounded-lg transition-all text-sm font-semibold border",
                    currentStep === 0
                      ? "bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed"
                      : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-300 active:scale-[0.97]"
                  )}
                >
                  <ChevronUp className="h-4 w-4 mr-1.5" />
                  上一步
                </button>

                {/* 下一步 */}
                <button
                  onClick={handleNext}
                  disabled={currentStep === recipe.steps.length - 1}
                  className={cn(
                    "flex items-center justify-center h-12 px-5 rounded-lg transition-all text-sm font-semibold",
                    currentStep === recipe.steps.length - 1
                      ? "bg-neutral-50 text-neutral-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/95 active:scale-[0.97]"
                  )}
                >
                  下一步
                  <ChevronDown className="h-4 w-4 ml-1.5" />
                </button>
              </div>

              {/* TTS 朗读开关 + 设置 */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={cn(
                    "flex items-center justify-center h-[50px] w-11 rounded-lg border transition-all active:scale-[0.97]",
                    ttsEnabled
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                  )}
                  title={ttsEnabled ? "关闭朗读" : "开启朗读"}
                >
                  {ttsEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                </button>
                <button
                  onClick={() => setTtsSettingsOpen(true)}
                  className="flex items-center justify-center h-[50px] w-11 rounded-lg border border-neutral-300 bg-white text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition-all active:scale-[0.97]"
                  title="朗读设置"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {/* 退出按钮 */}
              <Link
                href={`/recipe/${recipe.id}`}
                className="flex items-center justify-center h-26 w-11 bg-white text-neutral-500 transition-all hover:bg-neutral-50 hover:text-red-500 rounded-lg border border-neutral-300 active:scale-[0.97]"
                title="退出烹饪模式"
              >
                <X className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-hidden z-10">
            {/* 桌面端：左右分栏布局 */}
            <div className="grid grid-cols-10 gap-6 p-6 h-full">
              {/* 左侧 70% */}
              <div className="col-span-7 flex flex-col gap-6 h-full overflow-hidden">
                {/* 步骤图区域 */}
                <div ref={stepImageContainerRef} className="flex-[8] rounded-2xl border border-border bg-white flex flex-col items-center justify-center overflow-hidden relative shadow-sm">
                  <div className="absolute inset-0 opacity-25 pointer-events-none"
                    style={{
                      backgroundImage: "radial-gradient(circle, #e0e0e0 1.2px, transparent 1.2px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center justify-center h-full w-full p-4 lg:p-6 z-10"
                    >
                      {currentStepData.image ? (
                        <a
                          data-fancybox="cook-steps"
                          href={currentStepData.image}
                          data-caption={`步骤 ${currentStep + 1}：${currentStepData.title}`}
                          className="block h-full w-full"
                        >
                          <img
                            src={currentStepData.image}
                            alt={currentStepData.title}
                            className="h-full w-full object-contain rounded-xl cursor-zoom-in"
                          />
                        </a>
                      ) : (
                        // 无图时的 ChefHat 图标及大字标题
                        <div className="text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-white shadow-sm mx-auto mb-4">
                            <ChefHat className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-lg font-black text-foreground tracking-tight">{recipe.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 tracking-wider uppercase font-bold">步骤 {currentStep + 1} / 共 {recipe.steps.length} 步</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 下面：耗时数据盘 */}
                <div className="grid grid-cols-3 gap-2 lg:gap-4 lg:flex-[2] shrink-0">
                  <div className="rounded-xl lg:rounded-2xl border border-border bg-white p-2 lg:p-4 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-3xl lg:text-2xl font-black text-foreground tracking-tight font-mono tabular-nums leading-none">{formatTime(elapsedTime)}</span>
                    <span className="mt-1 lg:mt-2 text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center">已用耗时</span>
                  </div>
                  <div className="rounded-xl lg:rounded-2xl border border-border bg-white p-2 lg:p-4 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-lg lg:text-2xl font-black text-foreground tracking-tight font-mono tabular-nums leading-none">
                      {currentStepData.duration_sec ? formatTime(currentStepData.duration_sec) : "--:--"}
                    </span>
                    <span className="mt-1 lg:mt-2 text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center">本步推荐</span>
                  </div>
                  <div className="rounded-xl lg:rounded-2xl border border-border bg-white p-2 lg:p-4 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-lg lg:text-2xl font-black text-primary tracking-tight font-mono tabular-nums leading-none">
                      {remainingTime > 0 ? formatTime(remainingTime) : "00:00"}
                    </span>
                    <span className="mt-1 lg:mt-2 text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center">还剩预计</span>
                  </div>
                </div>
              </div>

              {/* 右侧 30% - 注意事项面板 */}
              <div className="col-span-3 rounded-2xl border border-border bg-white p-5 flex flex-col shadow-sm h-full overflow-hidden">
                <div className="mb-4 flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    📋 注意事项 / Cautions
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* 可滚动注意事项区域 */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* 步骤核心指令 */}
                      <div className="p-4 rounded-xl bg-neutral-50 border border-border/60">
                        <p className="text-xs font-semibold leading-relaxed text-foreground/90">
                          {currentStepData.instruction}
                        </p>
                      </div>

                      {/* 小贴士清单 */}
                      {currentStepData.tips && currentStepData.tips.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                            💡 步骤提示 / Tips
                          </span>
                          {currentStepData.tips.map((tip, i) => (
                            <div key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground font-medium">
                              <span className="text-primary shrink-0 font-bold">•</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 产出物 */}
                      {currentStepData.produces && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                            ✓ 本步产出 / Produces
                          </span>
                          <div className="inline-flex items-center rounded-lg bg-green-50 border border-green-200/50 px-2.5 py-1 text-xs font-bold text-green-700">
                            {currentStepData.produces}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 底部固定大屏倒计时控制区 */}
                {currentStepData.duration_sec && (
                  <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        ⏱ 步骤计时 / Step Clock
                      </span>
                      <Clock className={cn("h-4 w-4", isStepTimerRunning ? "text-primary animate-pulse" : "text-muted-foreground")} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {/* 大字号时间显示 */}
                      <span className="text-4xl font-black text-foreground font-mono tabular-nums leading-none tracking-tight">
                        {formatTime(stepTimeElapsed)}
                      </span>
                      
                      {/* 大控制按钮 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsStepTimerRunning(!isStepTimerRunning)}
                          className={cn(
                            "flex h-11 px-5 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-md shadow-primary/10",
                            isStepTimerRunning
                              ? "bg-neutral-800 hover:bg-neutral-900"
                              : "bg-primary hover:bg-primary/95"
                          )}
                        >
                          {isStepTimerRunning ? <Pause className="h-4 w-4 fill-white text-white" /> : <Play className="h-4 w-4 fill-white text-white" />}
                          <span>{isStepTimerRunning ? "暂停" : "开始"}</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsStepTimerRunning(false);
                            setStepTimeElapsed(0);
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-neutral-50 active:scale-95 cursor-pointer shadow-sm"
                          title="重置"
                        >
                          <RotateCcw className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ============================== 移动端视图 ============================== */}
        {/* ========================================================================= */}
        <div className="flex lg:hidden flex-col h-full w-full overflow-hidden bg-neutral-50 relative z-10">
          
          {/* 1. 移动端顶栏 (Header) */}
          <header className="bg-white border-b border-border z-20 shrink-0 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              {/* 返回/退出按钮 */}
              <Link
                href={`/recipe/${recipe.id}`}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-neutral-100/80 active:bg-neutral-200 text-muted-foreground transition-all"
                title="退出烹饪模式"
              >
                <X className="h-4.5 w-4.5" />
              </Link>
              
              {/* 菜名 */}
              <h1 className="text-sm font-black text-foreground tracking-tight line-clamp-1 max-w-[60%]">
                {recipe.title}
              </h1>
              
              {/* 进度数值 + TTS 开关 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full transition-all",
                    ttsEnabled
                      ? "bg-primary text-white"
                      : "bg-neutral-100/80 text-muted-foreground active:bg-neutral-200"
                  )}
                  title={ttsEnabled ? "关闭朗读" : "开启朗读"}
                >
                  {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setTtsSettingsOpen(true)}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-neutral-100/80 text-muted-foreground active:bg-neutral-200 transition-all"
                  title="朗读设置"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
                <div className="text-xs font-bold text-muted-foreground font-mono">
                  <span className="text-primary font-black">{String(currentStep + 1).padStart(2, '0')}</span>
                  <span className="mx-0.5 opacity-60">/</span>
                  <span>{String(recipe.steps.length).padStart(2, '0')}</span>
                </div>
              </div>
            </div>

            {/* 水平滚动步骤导航栏 */}
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide select-none scroll-smooth"
            >
              {recipe.steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shrink-0 select-none cursor-pointer",
                    i === currentStep
                      ? "border-primary bg-primary text-white shadow-sm"
                      : i < currentStep
                      ? "border-neutral-700 bg-neutral-800 text-white"
                      : "border-border bg-white text-foreground active:border-neutral-300"
                  )}
                  title={step.title}
                >
                  {/* 步骤序号 */}
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                    i === currentStep
                      ? "bg-white text-primary"
                      : i < currentStep
                      ? "bg-white text-neutral-900"
                      : "bg-primary/10 text-primary"
                  )}>
                    {i + 1}
                  </span>

                  {/* 步骤名 + 时长 */}
                  <div className="flex flex-col gap-0.5">
                    <span className={cn(
                      "text-[11px] font-bold tracking-tight truncate max-w-[64px] leading-tight",
                      i === currentStep
                        ? "text-white"
                        : i < currentStep
                        ? "text-white"
                        : "text-foreground"
                    )}>
                      {step.title}
                    </span>
                    {step.duration_sec && (
                      <span className={cn(
                        "text-[9px] font-medium flex items-center gap-0.5",
                        i === currentStep
                          ? "text-white/70"
                          : i < currentStep
                          ? "text-white/50"
                          : "text-muted-foreground"
                      )}>
                        <Clock className="h-2 w-2" />
                        {Math.ceil(step.duration_sec / 60)}'
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </header>

          {/* 2. 移动端主体滚动区 (Scrollable Content Body) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6 min-h-0">
            
            {/* 2.1 步骤展示图 (Image or illustration) */}
            <div className="w-full aspect-video md:aspect-[2/1] rounded-2xl border border-border bg-white flex items-center justify-center overflow-hidden relative shadow-sm shrink-0">
              <div className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, #e0e0e0 1.2px, transparent 1.2px)",
                  backgroundSize: "16px 16px",
                }}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center h-full w-full p-2 z-10"
                >
                  {currentStepData.image ? (
                    <a
                      data-fancybox="cook-steps"
                      href={currentStepData.image}
                      data-caption={`步骤 ${currentStep + 1}：${currentStepData.title}`}
                      className="block h-full w-full"
                    >
                      <img
                        src={currentStepData.image}
                        alt={currentStepData.title}
                        className="h-full w-full object-contain rounded-xl cursor-zoom-in"
                      />
                    </a>
                  ) : (
                    <div className="text-center py-6">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50/50 border border-orange-100 shadow-sm mb-2.5">
                        <ChefHat className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
                        步骤 {currentStep + 1} / 共 {recipe.steps.length} 步
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 2.2 行动指令卡片 */}
            <div className="bg-white rounded-2xl border border-border/80 p-5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-md shadow-primary/30" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">ACTION REQUIRED</span>
              </div>
              <h2 className="text-xl font-black tracking-tight leading-snug text-foreground">
                {renderHighlightedInstruction(currentStepData.instruction)}
              </h2>
            </div>

            {/* 2.3 注意事项与 Tips 卡片 */}
            <AnimatePresence mode="wait">
              {((currentStepData.tips && currentStepData.tips.length > 0) || currentStepData.produces) && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-amber-50/40 border border-amber-100/70 rounded-2xl p-5 shadow-sm space-y-3.5"
                >
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      💡 注意事项 & 小贴士
                    </span>
                  </div>

                  {currentStepData.tips && currentStepData.tips.length > 0 && (
                    <div className="space-y-2">
                      {currentStepData.tips.map((tip, i) => (
                        <div key={i} className="flex gap-2 text-xs leading-relaxed text-amber-900/80 font-medium">
                          <span className="text-primary shrink-0 font-bold">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentStepData.produces && (
                    <div className="pt-2.5 border-t border-amber-200/40 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-800/70 uppercase tracking-wider">
                        ✓ 本步产出:
                      </span>
                      <div className="inline-flex items-center rounded-lg bg-green-50 border border-green-200/50 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                        {currentStepData.produces}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* 3. 移动端底栏主厨控制台 (Footer Dashboard) */}
          <footer className="bg-white border-t border-border shadow-2xl shrink-0 z-20">
            {/* Step timer progress bar indicator */}
            {currentStepData.duration_sec ? (
              <div className="w-full h-1 bg-neutral-100 overflow-hidden relative">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{
                    width: `${Math.min(100, (stepTimeElapsed / currentStepData.duration_sec) * 100)}%`
                  }}
                />
              </div>
            ) : null}

            <div className="p-4 space-y-4">
              {/* Time display row */}
              <div className="flex items-center justify-between bg-neutral-50 px-3.5 py-2.5 rounded-xl border border-neutral-100">
                {/* Step Clock */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsStepTimerRunning(!isStepTimerRunning)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer",
                      isStepTimerRunning
                        ? "bg-neutral-800 text-white"
                        : "bg-primary text-white shadow-sm"
                    )}
                    title={isStepTimerRunning ? "暂停本步计时" : "开始本步计时"}
                  >
                    {isStepTimerRunning ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current ml-0.5" />}
                  </button>
                  
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">本步耗时</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground font-mono tabular-nums leading-none">
                        {formatTime(stepTimeElapsed)}
                      </span>
                      {currentStepData.duration_sec && (
                        <span className="text-[10px] font-bold text-muted-foreground/60 font-mono">
                          / {formatTime(currentStepData.duration_sec)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reset button */}
                  {stepTimeElapsed > 0 && (
                    <button
                      onClick={() => {
                        setIsStepTimerRunning(false);
                        setStepTimeElapsed(0);
                      }}
                      className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
                      title="重置本步计时"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Overall time stats */}
                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">累计用时</span>
                    <span className="text-lg font-bold text-foreground font-mono tabular-nums leading-none">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                  {remainingTime > 0 && (
                    <div className="flex flex-col border-l border-neutral-200 pl-3">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">预计还剩</span>
                      <span className="text-lg font-bold text-primary font-mono tabular-nums leading-none">
                        {formatTime(remainingTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Action Buttons Row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={cn(
                    "h-12 w-16 flex items-center justify-center rounded-xl border border-border transition-all active:scale-95 cursor-pointer shadow-sm",
                    currentStep === 0
                      ? "bg-neutral-50 text-neutral-300 border-neutral-200 cursor-not-allowed active:scale-100"
                      : "bg-white text-foreground hover:bg-neutral-50"
                  )}
                  title="上一步"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {currentStep === recipe.steps.length - 1 ? (
                  <Link
                    href={`/recipe/${recipe.id}`}
                    className="h-12 flex-1 bg-success text-success-foreground font-extrabold rounded-xl shadow-lg shadow-success/10 flex items-center justify-center gap-1.5 transition-all active:scale-95 text-sm"
                  >
                    <span>完成烹饪</span>
                    <ChefHat className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    onClick={handleNext}
                    className="h-12 flex-1 bg-primary text-white font-extrabold rounded-xl shadow-lg shadow-primary/15 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer text-sm"
                  >
                    <span>下一步</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>
          </footer>

        </div>
      </main>

      {/* TTS 设置面板 */}
      <TtsSettingsPanel
        open={ttsSettingsOpen}
        onClose={() => setTtsSettingsOpen(false)}
        settings={ttsSettings}
        onChange={setTtsSettings}
      />
    </div>
  );
}
