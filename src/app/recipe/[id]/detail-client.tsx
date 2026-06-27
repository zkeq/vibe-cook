"use client";

import type { Recipe } from "@/lib/types";
import {
  RecipeHeader,
  RecipeSteps,
  RecipeNotes,
} from "@/components/recipe-detail";

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
