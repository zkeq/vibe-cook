"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Clock, Flame, Star, Users, ChevronLeft, ChevronRight, Search, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Recipe } from "@/lib/types";
import { mockRecipeList } from "@/lib/mock";
import { cn } from "@/lib/utils";

interface DetailClientProps {
  recipe: Recipe;
}

export function DetailClient({ recipe }: DetailClientProps) {
  const [servings, setServings] = useState(recipe.servings.base);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const scaledIngredients = recipe.ingredients.map((ing) => {
    if (!ing.per_serving) return ing;
    const match = ing.amount.match(/^([\d.]+)/);
    if (!match) return ing;
    const baseAmount = parseFloat(match[1]);
    const scaledAmount = (baseAmount * servings) / recipe.servings.base;
    const rest = ing.amount.replace(/^[\d.]+/, "");
    return { ...ing, amount: `${scaledAmount.toFixed(1).replace(/\.0$/, "")}${rest}` };
  });

  const filteredRecipes = mockRecipeList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="-mt-14 flex min-h-screen bg-[#fafafa] pt-14">
      {/* 左侧导航 */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/60 bg-white transition-all duration-300 lg:block",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          <div className={cn("flex h-14 shrink-0 items-center border-b border-border/60 bg-white", sidebarCollapsed ? "justify-center px-2" : "gap-2 px-4")}>
            {!sidebarCollapsed && (
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索"
                  className="h-8 w-full rounded-lg border border-border/60 bg-background pl-8 pr-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white"
                />
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filteredRecipes.map((item) => {
              const active = pathname.includes(item.id);

              if (sidebarCollapsed) {
                return (
                  <Link
                    key={item.id}
                    href={`/recipe/${item.id}`}
                    className={cn(
                      "mx-2 my-1 flex h-10 items-center justify-center rounded-lg transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted/60"
                    )}
                    title={item.title}
                  >
                    <ChefHat className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={`/recipe/${item.id}`}
                  className={cn(
                    "mx-2 my-0.5 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    active ? "bg-primary/10" : "hover:bg-muted/60"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                    active ? "from-primary/20 to-primary/10" : "from-muted to-muted/40"
                  )}>
                    <ChefHat className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-sm font-medium", active ? "text-primary" : "text-foreground")}>
                      {item.title}
                    </div>
                    {item.duration_min && (
                      <div className="text-xs text-muted-foreground">{item.duration_min}min</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-8 py-8">
          {/* 顶部标题栏 */}
          <div className="mb-8 flex items-start justify-between gap-6 border-b border-border/60 pb-6">
            <div className="flex-1">
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">{recipe.title}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">{recipe.summary}</p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-3.5 w-3.5", i < recipe.difficulty ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />
                ))}
              </div>
              <div className="h-4 w-px bg-border/60" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {recipe.duration_min}min
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Flame className="h-3.5 w-3.5" />
                {recipe.calories}
              </div>
              <Link
                href={`/recipe/${recipe.id}/cook`}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                开始烹饪
              </Link>
            </div>
          </div>

          {/* 主网格 */}
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* 左列：控制面板 */}
            <div className="space-y-4">
              {/* 成品图 */}
              <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
                <div className="flex h-full items-center justify-center">
                  <ChefHat className="h-16 w-16 text-primary/20" />
                </div>
              </div>

              {/* 份数 */}
              <div className="rounded-xl border border-border/60 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">份数</span>
                  <span className="text-xs text-muted-foreground">基准 {recipe.servings.base}份</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-muted"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <motion.span
                    key={servings}
                    initial={{ scale: 1.2, color: "#f5701f" }}
                    animate={{ scale: 1, color: "#1a1a1a" }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-12 text-center text-2xl font-bold tabular-nums"
                  >
                    {servings}
                  </motion.span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 工具 */}
              <div className="rounded-xl border border-border/60 bg-white p-4">
                <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">工具</div>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.tools.map((tool) => (
                    <span key={tool} className="rounded-md bg-muted px-2.5 py-1 text-xs">{tool}</span>
                  ))}
                </div>
              </div>

              {/* 原料 */}
              <div className="rounded-xl border border-border/60 bg-white p-4">
                <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">原料</div>
                <div className="space-y-1.5">
                  {scaledIngredients.map((ing, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={ing.per_serving ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 0.25 }}
                      className="flex items-center justify-between py-1.5 text-sm"
                    >
                      <span className={cn(ing.optional && "text-muted-foreground")}>{ing.name}</span>
                      <motion.span
                        key={`${i}-${servings}`}
                        initial={ing.per_serving ? { color: "#f5701f" } : {}}
                        animate={ing.per_serving ? { color: "#1a1a1a" } : {}}
                        transition={{ duration: 0.3 }}
                        className="font-medium tabular-nums"
                      >
                        {ing.amount}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右列：步骤 + 其他 */}
            <div className="space-y-6">
              {/* 步骤预览图 */}
              <div className="aspect-[16/9] overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex h-full items-center justify-center"
                  >
                    <div className="text-center">
                      <ChefHat className="mx-auto mb-2 h-16 w-16 text-primary/20" />
                      <div className="text-sm text-muted-foreground">步骤 {currentStep + 1}</div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                {recipe.steps.length > 1 && (
                  <div className="flex items-center justify-center gap-1 pb-4">
                    {recipe.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={cn("h-1 rounded-full transition-all", i === currentStep ? "w-6 bg-primary/80" : "w-1 bg-black/10 hover:bg-black/20")}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 步骤列表 */}
              <div className="space-y-2">
                {recipe.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-all",
                      i === currentStep
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/60 bg-white hover:border-primary/20 hover:bg-muted/20"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {step.index}
                      </span>
                      <span className="font-medium">{step.title}</span>
                      {step.duration_sec && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {Math.ceil(step.duration_sec / 60)}min
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.instruction}</p>
                    {step.produces && (
                      <div className="mt-2 inline-block rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        产出: {step.produces}
                      </div>
                    )}
                    {step.tips && step.tips.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {step.tips.map((tip, j) => (
                          <div key={j} className="text-xs text-primary">💡 {tip}</div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* 注意事项 & 全解图 */}
              <div className="grid gap-4 lg:grid-cols-2">
                {(recipe.variants?.length || recipe.tips?.length) && (
                  <div className="rounded-xl border border-border/60 bg-white p-4">
                    <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">注意</div>
                    {recipe.variants && recipe.variants.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {recipe.variants.map((v, i) => (
                          <div key={i}>
                            <div className="text-sm font-medium text-primary">{v.title}</div>
                            <div className="text-xs leading-relaxed text-muted-foreground">{v.desc}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {recipe.tips && recipe.tips.length > 0 && (
                      <div className="space-y-1">
                        {recipe.tips.map((tip, i) => (
                          <div key={i} className="text-xs leading-relaxed text-muted-foreground">• {tip}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-xl border border-border/60 bg-white p-4">
                  <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">全解图</div>
                  <div className="aspect-video rounded-lg bg-muted"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
