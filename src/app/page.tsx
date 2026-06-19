"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useAnimationFrame } from "motion/react";
import { Clock, Flame, ChefHat, Timer, Star } from "lucide-react";
import { mockRecipeList } from "@/lib/mock";
import type { RecipeSummary } from "@/lib/types";

/* ─── 点阵背景 ─── */
function DotBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: "radial-gradient(circle, #e2e2e2 1.2px, transparent 1.2px)",
        backgroundSize: "22px 22px",
      }}
    />
  );
}

/* ─── Hero 左侧：Logo + 名字 ─── */
function HeroLeft() {
  return (
    <div className="flex flex-shrink-0 flex-col items-center justify-center gap-4 lg:items-start">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="grid h-20 w-20 place-items-center rounded-[22px] bg-primary shadow-2xl shadow-primary/30"
      >
        <ChefHat className="h-10 w-10 text-white" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="flex flex-col items-center gap-0.5 lg:items-start"
      >
        <span className="text-2xl font-black tracking-tight text-foreground">Vibe Cook</span>
        <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">跟着做就会</span>
      </motion.div>
    </div>
  );
}

/* ─── Hero 右侧：富文本信息堆叠 ─── */
function HeroRight() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className="flex w-full max-w-sm flex-col gap-0"
    >
      {/* 主标语 */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="pb-4"
      >
        <p className="text-[13px] font-medium uppercase tracking-widest text-primary">Step-by-step cooking</p>
        <h2 className="mt-1 text-2xl font-black leading-snug tracking-tight text-foreground">
          把「看完就忘」<br />变成「一步做出来」
        </h2>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mb-4 h-px bg-border" />

      {/* 数据行 */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        className="flex items-center gap-5 pb-4"
      >
        <div>
          <span className="text-3xl font-black text-foreground">50</span>
          <span className="ml-0.5 text-lg font-black text-primary">+</span>
          <p className="text-[11px] text-muted-foreground">精选食谱</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-3xl font-black text-foreground">5</span>
          <p className="text-[11px] text-muted-foreground">平均步数</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <span className="text-3xl font-black text-foreground">0</span>
          <p className="text-[11px] text-muted-foreground">基础要求</p>
        </div>
      </motion.div>

    </motion.div>
  );
}

/* ─── 无限滚动行 ─── */
function MarqueeTrack({ items, reverse = false }: { items: RecipeSummary[]; reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);

  useAnimationFrame((_, delta) => {
    if (!trackRef.current) return;
    const speed = 0.045;
    xRef.current += reverse ? delta * speed : -delta * speed;
    const half = trackRef.current.scrollWidth / 2;
    if (xRef.current <= -half) xRef.current += half;
    if (xRef.current >= half) xRef.current -= half;
    trackRef.current.style.transform = `translateX(${xRef.current}px)`;
  });

  const doubled = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden">
      <div ref={trackRef} className="flex gap-3 will-change-transform">
        {doubled.map((r, i) => (
          <RecipeScrollCard key={`${r.id}-${i}`} recipe={r} />
        ))}
      </div>
    </div>
  );
}

const DIFF_LABEL = ["", "简单", "普通", "有点难", "挑战", "大师"];
const DIFF_DOT = ["", "bg-emerald-400", "bg-blue-400", "bg-yellow-400", "bg-orange-400", "bg-red-400"];
const CATEGORY_GRAD: Record<string, string> = {
  "家常菜": "from-orange-100 to-amber-50",
  "川菜":  "from-red-100 to-rose-50",
  "粤菜":  "from-sky-100 to-blue-50",
};

function RecipeScrollCard({ recipe }: { recipe: RecipeSummary }) {
  const diff = recipe.difficulty ?? 1;
  const grad = CATEGORY_GRAD[recipe.category] ?? "from-stone-100 to-gray-50";
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group flex w-52 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      {/* 图片占位 */}
      <div className={`relative h-32 bg-gradient-to-br ${grad} flex items-center justify-center`}>
        <ChefHat className="h-10 w-10 text-white/60 transition-transform group-hover:scale-110" style={{ color: "rgba(180,120,60,0.35)" }} />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
          {recipe.category}
        </span>
      </div>
      {/* 信息 */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-sm font-bold leading-tight text-foreground line-clamp-1">{recipe.title}</span>
        {recipe.summary && (
          <span className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{recipe.summary}</span>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className={`h-1.5 w-1.5 rounded-full ${DIFF_DOT[diff]}`} />
          <span className="text-[11px] text-muted-foreground">{DIFF_LABEL[diff]}</span>
          {recipe.duration_min && (
            <>
              <span className="text-border">·</span>
              <Timer className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{recipe.duration_min}分钟</span>
            </>
          )}
          {recipe.calories && (
            <>
              <span className="text-border">·</span>
              <Flame className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{recipe.calories}</span>
            </>
          )}
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── 页面 ─── */
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <DotBg />

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-4">
        {/* 左右布局 */}
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
          <HeroLeft />
          <div className="hidden h-auto w-px self-stretch bg-border lg:block" />
          <HeroRight />
        </div>
      </section>

      {/* 五条特性横排 */}
      <div className="mx-auto grid max-w-4xl grid-cols-5 px-6 pb-10 pt-2">
          {[
            { dot: "bg-emerald-400", num: "01", title: "全程分步引导", sub: "操作说明 · 计时器 · 产出物提示，每步独立不跳不乱" },
            { dot: "bg-blue-400",   num: "02", title: "iPad 沉浸模式", sub: "全屏专注，屏幕常亮不休眠，灶台边轻松跟做" },
            { dot: "bg-amber-400",  num: "03", title: "完成正反馈",    sub: "每步庆祝动效，做完整道菜有成就感爆发" },
            { dot: "bg-violet-400", num: "04", title: "结构化食谱库",  sub: "原料 · 工具 · 份量 · 步骤 · 变体，信息密度极高" },
            { dot: "bg-rose-400",   num: "05", title: "份量自由缩放",  sub: "一人食 → 宴客，原料用量自动按比例换算" },
          ].map(({ dot, num, title, sub }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 260, damping: 24 }}
              className="flex flex-col gap-1 pr-4"
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{num}</span>
              </div>
              <p className="text-xs font-bold text-foreground">{title}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{sub}</p>
            </motion.div>
          ))}
        </div>

      {/* 双行无限滚动 */}
      <section className="border-y border-border bg-white/60 py-8 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2 px-6">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">食谱一览</span>
          <span className="text-xs text-muted-foreground">— {mockRecipeList.length} 道精选，持续更新</span>
        </div>
        <div className="flex flex-col gap-3">
          <MarqueeTrack items={mockRecipeList} />
          <MarqueeTrack items={[...mockRecipeList].reverse()} reverse />
        </div>
      </section>

      {/* 食谱网格 */}
      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-foreground">所有食谱</h2>
          <span className="text-xs text-muted-foreground">{mockRecipeList.length} 道</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {mockRecipeList.map((r) => {
            const diff = r.difficulty ?? 1;
            const grad = CATEGORY_GRAD[r.category] ?? "from-stone-100 to-gray-50";
            return (
              <Link key={r.id} href={`/recipe/${r.id}`} className="group block">
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${grad}`}>
                    <ChefHat className="h-12 w-12 transition-transform group-hover:scale-110" style={{ color: "rgba(180,120,60,0.3)" }} />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                      {r.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold">{r.title}</p>
                    {r.summary && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{r.summary}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${DIFF_DOT[diff]}`} />
                      <span className="text-[11px] text-muted-foreground">{DIFF_LABEL[diff]}</span>
                      {r.duration_min && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />{r.duration_min}分钟
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
