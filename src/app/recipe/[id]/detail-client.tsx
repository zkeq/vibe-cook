"use client";

import { useState } from "react";
import type { Recipe } from "@/lib/types";
import { mockRecipeList } from "@/lib/mock";
import {
  RecipeSidebar,
  RecipeHeader,
  RecipeSteps,
  RecipeNotes,
} from "@/components/recipe-detail";

interface DetailClientProps {
  recipe: Recipe;
}

export function DetailClient({ recipe }: DetailClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      {/* 点状背景 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "radial-gradient(circle, #e2e2e2 1.32px, transparent 1.32px)",
          backgroundSize: "24.2px 24.2px",
        }}
      />

      <div className="-mt-14 flex min-h-screen pt-14">
        {/* 左侧导航 */}
        <RecipeSidebar
          recipes={mockRecipeList}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* 主内容区 */}
        <main className={`relative z-10 flex-1 overflow-y-auto ${sidebarCollapsed ? '' : 'pl-6'}`}>
          <div className="h-full border-l border-t border-b border-border/60 bg-[#fdfdfd] p-4 shadow-sm">
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
      </div>
    </>
  );
}
