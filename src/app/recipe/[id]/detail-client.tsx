"use client";

import type { Recipe } from "@/lib/types";
import {
  RecipeHeader,
  RecipeSteps,
  RecipeNotes,
} from "@/components/recipe-detail";
import { RecipeAgent } from "@/components/recipe-agent";

interface DetailClientProps {
  recipe: Recipe;
}

export function DetailClient({ recipe }: DetailClientProps) {
  return (
    <main className="relative z-10 flex-1 overflow-y-auto">
      <div
        className="h-full border-l border-t border-b border-border/60 p-6 shadow-sm"
        style={{
          backgroundColor: "#fdfdfd",
          backgroundImage: "radial-gradient(circle, #e8e8e8 1.2px, transparent 1.2px)",
          backgroundSize: "20px 20px",
        }}
      >
        {/* 顶部标题栏 */}
        <RecipeHeader recipe={recipe} />

        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white px-4 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="text-base">✦</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-foreground">想调整口味或做法？</p>
                <span className="hidden rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-primary sm:inline">AI 主厨</span>
              </div>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                结合当前菜谱回答，建议可一键加入对应步骤
              </p>
            </div>
          </div>
          <RecipeAgent recipe={recipe} triggerVariant="detail" />
        </div>

        {/* 主网格 */}
        <div className="space-y-6">
          {/* 步骤区域 */}
          <RecipeSteps recipe={recipe} />

          {/* 注意事项 & 全解图 */}
          <RecipeNotes recipe={recipe} />
        </div>
      </div>
    </main>
  );
}
