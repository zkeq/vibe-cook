"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Clock, Flame, ChefHat, Sparkles } from "lucide-react";
import { staggerContainer, fadeUp, springSoft } from "@/lib/motion";
import { mockRecipeList } from "@/lib/mock";
import type { RecipeSummary } from "@/lib/types";

const DIFFICULTY = ["", "简单", "普通", "有点难", "挑战", "大师"];
const DIFF_COLOR = [
  "",
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-yellow-100 text-yellow-700",
  "bg-orange-100 text-orange-700",
  "bg-red-100 text-red-700",
];

function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const diff = recipe.difficulty ?? 1;
  return (
    <motion.div variants={fadeUp}>
      <Link href={`/recipe/${recipe.id}`} className="group block">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
          <div className="relative h-44 bg-gradient-to-br from-orange-50 to-amber-100">
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="h-14 w-14 text-orange-200 transition-transform group-hover:scale-110" />
            </div>
            <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
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
    <main className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center justify-center gap-5 py-16 text-center"
        style={{ minHeight: "35vh" }}
      >
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSoft}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-primary shadow-lg shadow-primary/30"
          >
            <ChefHat className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight">Vibe Cook</h1>
          <p className="max-w-xs text-base text-muted-foreground">
            看着馋，跟着做，一步一步就出锅了。
          </p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            全程引导 · 沉浸烹饪
          </span>
        </motion.div>
      </motion.section>

      {/* 食谱网格 */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 pb-12"
      >
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
    </main>
  );
}
