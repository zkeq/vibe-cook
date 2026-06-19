"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Clock, Flame, ChefHat, Zap, BookOpen, Award } from "lucide-react";
import { staggerContainer, fadeUp, springSoft } from "@/lib/motion";
import { mockRecipeList } from "@/lib/mock";
import type { RecipeSummary } from "@/lib/types";

function DotGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
        opacity: 0.5,
      }}
    />
  );
}

const features = [
  { icon: Zap,      title: "全程分步引导", desc: "每一步都有清晰说明，不跳步，不迷路。" },
  { icon: BookOpen, title: "海量家常食谱", desc: "从西红柿炒蛋到红烧肉，从快手菜到硬菜。" },
  { icon: Award,    title: "完成正反馈",   desc: "每完成一步都有庆祝动效，像打通关一样爽。" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-white">
      <DotGrid />
      <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-20">
        {/* 左 */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-6">
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springSoft}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-primary shadow-lg shadow-primary/30"
            >
              <ChefHat className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-xl font-black tracking-tight">Vibe Cook</span>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            <h1 className="text-4xl font-black leading-tight tracking-tight lg:text-5xl">
              看着馋，<br />
              <span className="text-primary">跟着做就会。</span>
            </h1>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
              把「看完就忘」变成「一步一步做出来」。全屏沉浸式烹饪引导，完成每步都有正反馈，像闯关一样把一道菜做完。
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Link
              href="#recipes"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-opacity hover:opacity-90 active:scale-95"
            >
              <ChefHat className="h-4 w-4" />
              开始做饭
            </Link>
          </motion.div>
        </motion.div>

        {/* 右 */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="flex items-start gap-4 rounded-2xl border border-border bg-white/70 p-4 backdrop-blur-sm"
            >
              <span className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const DIFFICULTY = ["", "简单", "普通", "有点难", "挑战", "大师"];
const DIFF_COLOR = ["", "bg-green-100 text-green-700", "bg-blue-100 text-blue-700", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];

function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const diff = recipe.difficulty ?? 1;
  return (
    <motion.div variants={fadeUp}>
      <Link href={`/recipe/${recipe.id}`} className="group block">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="relative h-44 bg-gradient-to-br from-orange-50 to-amber-100">
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-14 w-14 text-orange-200 transition-transform group-hover:scale-110" />
            </div>
            <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              {recipe.category}
            </span>
          </div>
          <div className="p-4">
            <h2 className="mb-1 text-base font-semibold leading-tight">{recipe.title}</h2>
            {recipe.summary && (
              <p className="mb-3 text-sm text-muted-foreground line-clamp-1">{recipe.summary}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {diff > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFF_COLOR[diff]}`}>
                  {DIFFICULTY[diff]}
                </span>
              )}
              {recipe.duration_min && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{recipe.duration_min}分钟
                </span>
              )}
              {recipe.calories && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="h-3 w-3" />{recipe.calories}kcal
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <section id="recipes" className="mx-auto max-w-5xl px-6 py-10">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-5">
          <motion.div variants={fadeUp}>
            <h2 className="text-lg font-bold tracking-tight">今天做什么？</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{mockRecipeList.length} 道食谱</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {mockRecipeList.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
