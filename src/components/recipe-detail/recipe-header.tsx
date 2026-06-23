"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Clock, Flame, Tag, Minus, Plus, Play, ChefHat } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeHeaderProps {
  recipe: Recipe;
}

export function RecipeHeader({ recipe }: RecipeHeaderProps) {
  const [servings, setServings] = useState(recipe.servings.base);

  // 计算缩放后的食材
  const scaledIngredients = recipe.ingredients.map((ing) => {
    if (!ing.per_serving) return { ...ing, scaledValue: ing.amount, unit: "" };
    const match = ing.amount.match(/^([\d.]+)/);
    if (!match) return { ...ing, scaledValue: ing.amount, unit: "" };
    const baseAmount = parseFloat(match[1]);
    const scaledAmount = (baseAmount * servings) / recipe.servings.base;
    const rest = ing.amount.replace(/^[\d.]+/, "");
    return {
      ...ing,
      scaledValue: scaledAmount.toFixed(1).replace(/\.0$/, ""),
      unit: rest
    };
  });

  return (
    <div className="mb-6 grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* 左侧：主图 */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="flex h-full items-center justify-center">
          <ChefHat className="h-16 w-16 text-primary/20" />
        </div>
      </div>

      {/* 右侧：信息区 */}
      <div className="flex flex-col">
        {/* 标题和简介 */}
        <div className="mb-3">
          <h1 className="mb-1 text-xl font-bold">{recipe.title}</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">{recipe.summary}</p>
        </div>

        {/* 基本信息 - 一行显示 */}
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>难度</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-2.5 w-2.5", i < recipe.difficulty ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />
              ))}
            </div>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="font-semibold text-primary">{recipe.duration_min}</span>
            <span>min</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            <span className="font-semibold text-primary">{recipe.calories}</span>
            <span>kcal</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span>{recipe.category}</span>
          </div>
        </div>

        {/* 分割线 */}
        <div className="mb-3 h-px bg-border" />

        {/* 食材列表 - 紧凑布局 */}
        <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
          {scaledIngredients.map((ing, i) => (
            <div key={i} className="flex items-baseline justify-between text-xs">
              <span className={cn("font-medium", ing.optional && "text-muted-foreground")}>{ing.name}</span>
              <div className="flex items-baseline gap-1 tabular-nums">
                {ing.per_serving ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${i}-${servings}`}
                        initial={{ y: -8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 8, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-bold text-primary"
                      >
                        {ing.scaledValue}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-muted-foreground">{ing.unit}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{ing.amount}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 底部：工具 + 份数 + 按钮 */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          {/* 工具 */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {recipe.tools.map((tool, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1">·</span>}
                {tool}
              </span>
            ))}
          </div>

          {/* 份数选择器 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">份数</span>
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-border transition-colors hover:bg-muted"
            >
              <Minus className="h-3 w-3" />
            </button>
            <div className="relative h-8 w-10 overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={servings}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums text-primary"
                >
                  {servings}
                </motion.div>
              </AnimatePresence>
            </div>
            <button
              onClick={() => setServings(servings + 1)}
              className="flex h-6 w-6 items-center justify-center rounded border border-border transition-colors hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* 开始烹饪按钮 */}
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
            <Play className="h-3.5 w-3.5" />
            开始烹饪
          </button>
        </div>
      </div>
    </div>
  );
}
