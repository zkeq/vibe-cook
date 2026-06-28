"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat } from "lucide-react";
import { useIntro } from "@/lib/intro-context";
import { useRecipeStore } from "@/store/recipe-store";
import type { RecipeSummary } from "@/lib/types";
import { CATEGORY_GRAD } from "./recipe-card";
import { HeroLeft } from "./hero-left";
import { HeroRight } from "./hero-right";
import { FeatureBar } from "./feature-bar";

const HERO_DURATION = 4200;
const WATERFALL_DURATION = 5000;

/* 每行速度（秒），从慢到快 */
const ROW_SPEEDS = [42, 30, 21, 16, 11];

const CSS = `
@keyframes mq-fwd {
  0%   { transform: translateX(0) }
  100% { transform: translateX(-50%) }
}
@keyframes mq-bwd {
  0%   { transform: translateX(-50%) }
  100% { transform: translateX(0) }
}
`;

/* ── 单行 marquee，白底卡片 ── */
function MarqueeRow({
  items,
  speed,
  reverse = false,
}: {
  items: RecipeSummary[];
  speed: number;
  reverse?: boolean;
}) {
  const track = [...items, ...items, ...items, ...items];
  return (
    <div>
      <div
        className="flex w-max gap-4"
        style={{
          animation: `${reverse ? "mq-bwd" : "mq-fwd"} ${speed}s linear infinite`,
        }}
      >
        {track.map((r, i) => {
          const grad = CATEGORY_GRAD[r.category] ?? "from-stone-100 to-gray-50";
          return (
            <div
              key={`${r.id}-${i}`}
              className="w-52 flex-shrink-0 overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm"
            >
              <div className={`flex h-32 items-center justify-center bg-gradient-to-br ${grad}`}>
                <ChefHat className="h-10 w-10" style={{ color: "rgba(180,120,60,0.35)" }} />
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold" style={{ color: "#1a1a1a" }}>{r.title}</p>
                {r.summary && (
                  <p className="mt-0.5 line-clamp-1 text-[11px]" style={{ color: "#737373" }}>{r.summary}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 第二屏：深色背景 + 多行不同速度的 marquee ── */
function WaterfallPhase({ items }: { items: RecipeSummary[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="relative flex h-screen w-full flex-col justify-center gap-4"
    >
      {ROW_SPEEDS.map((speed, i) => (
        <MarqueeRow
          key={i}
          items={i % 2 === 0 ? items : [...items].reverse()}
          speed={speed}
          reverse={i % 2 === 1}
        />
      ))}

      {/* 遮罩：颜色和背景完全一致 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28" style={{ background: "linear-gradient(to right, #ffffff, transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28" style={{ background: "linear-gradient(to left, #ffffff, transparent)" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16" style={{ background: "linear-gradient(to bottom, #ffffff, transparent)" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(to top, #ffffff, transparent)" }} />

      {/* 中心数字 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <div
          className="rounded-2xl px-8 py-5 text-center"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)", border: "1px solid #e5e5e5" }}
        >
          <span className="block text-5xl font-black" style={{ color: "#1a1a1a" }}>{items.length}+</span>
          <span className="mt-1 block text-sm font-semibold tracking-widest" style={{ color: "#737373" }}>
            道精选食谱
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── 主 Overlay ── */
export function IntroOverlay() {
  const { phase, advance, skip } = useIntro();
  const { recipeList, fetchRecipeList } = useRecipeStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载菜谱列表
  useEffect(() => {
    if (recipeList.length === 0) {
      fetchRecipeList();
    }
  }, [recipeList.length, fetchRecipeList]);

  useEffect(() => {
    if (phase === "hero") {
      timerRef.current = setTimeout(() => advance(), HERO_DURATION);
    } else if (phase === "waterfall") {
      timerRef.current = setTimeout(() => advance(), WATERFALL_DURATION);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, advance]);

  const visible = phase === "hero" || phase === "waterfall";

  // 动画期间锁住 body 滚动
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  // 键盘任意键跳过
  useEffect(() => {
    if (!visible) return;
    const handler = () => skip();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, skip]);

  return (
    <>
      <style>{CSS}</style>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="intro-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] overflow-hidden"
            style={{ background: "#ffffff" }}
          >
            {/* 点状背景 */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                backgroundImage: "radial-gradient(circle, #e2e2e2 1.32px, transparent 1.32px)",
                backgroundSize: "24.2px 24.2px",
              }}
            />
            {/* 右上角跳过按钮 */}
            <button
              onClick={skip}
              className="absolute right-6 top-6 z-20 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/20 active:scale-95"
            >
              跳过
              <span className="rounded-md border border-primary/30 px-1.5 py-0.5 text-[11px] font-normal tracking-wide text-primary/60">
                按任意键
              </span>
            </button>
            <div className="relative z-10 h-full w-full">
            <AnimatePresence mode="wait">
              {/* ── Screen 1: 白底 Hero + FeatureBar ── */}
              {phase === "hero" && (
                <motion.div
                  key="hero"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="flex h-full w-full flex-col items-center justify-center"
                >
                  <section className="mx-auto w-full max-w-3xl px-6 pb-4 pt-8">
                    <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
                      <HeroLeft />
                      <div className="hidden h-auto w-px self-stretch bg-[#e5e5e5] lg:block" />
                      <HeroRight interval={1400} />
                    </div>
                  </section>
                  <div className="w-full">
                    <FeatureBar />
                  </div>
                </motion.div>
              )}

              {/* ── Screen 2: 深色 + 多速 marquee ── */}
              {phase === "waterfall" && (
                <motion.div
                  key="waterfall"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <WaterfallPhase items={recipeList} />
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
