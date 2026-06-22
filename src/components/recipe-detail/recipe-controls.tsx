"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeControlsProps {
  recipe: Recipe;
}

export function RecipeControls({ recipe }: RecipeControlsProps) {
  const [servings, setServings] = useState(recipe.servings.base);

  const scaledIngredients = recipe.ingredients.map((ing) => {
    if (!ing.per_serving) return ing;
    const match = ing.amount.match(/^([\d.]+)/);
    if (!match) return ing;
    const baseAmount = parseFloat(match[1]);
    const scaledAmount = (baseAmount * servings) / recipe.servings.base;
    const rest = ing.amount.replace(/^[\d.]+/, "");
    return { ...ing, amount: `${scaledAmount.toFixed(1).replace(/\.0$/, "")}${rest}` };
  });

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* 份数 */}
      <div className="rounded-xl border border-border/60 bg-white p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">份数</div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-border/60 transition-colors hover:bg-muted"
            >
              <Minus className="h-3 w-3" />
            </button>
            <motion.span
              key={servings}
              initial={{ scale: 1.2, color: "#f5701f" }}
              animate={{ scale: 1, color: "#1a1a1a" }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-8 text-center text-xl font-bold tabular-nums"
            >
              {servings}
            </motion.span>
            <button
              onClick={() => setServings(servings + 1)}
              className="flex h-6 w-6 items-center justify-center rounded border border-border/60 transition-colors hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">基准 {recipe.servings.base}份</span>
        </div>
      </div>

      {/* 工具 */}
      <div className="col-span-2 rounded-xl border border-border/60 bg-white p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">工具</div>
        <div className="flex flex-wrap gap-1">
          {recipe.tools.map((tool) => (
            <span key={tool} className="rounded bg-muted px-2 py-0.5 text-[11px]">{tool}</span>
          ))}
        </div>
      </div>

      {/* 原料 占满3列 */}
      <div className="col-span-3 rounded-xl border border-border/60 bg-white p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">原料</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {scaledIngredients.map((ing, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={ing.per_serving ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between text-xs"
            >
              <span className={cn("truncate", ing.optional && "text-muted-foreground")}>{ing.name}</span>
              <motion.span
                key={`${i}-${servings}`}
                initial={ing.per_serving ? { color: "#f5701f" } : {}}
                animate={ing.per_serving ? { color: "#1a1a1a" } : {}}
                transition={{ duration: 0.3 }}
                className="ml-2 font-medium tabular-nums"
              >
                {ing.amount}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
