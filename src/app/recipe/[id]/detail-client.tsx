"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Clock, Flame, Star, Users, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
    <div className="-mt-14 flex min-h-screen bg-background pt-14">
      {/* 左侧导航 */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-white transition-all duration-300 lg:block",
          sidebarCollapsed ? "w-16" : "w-72"
        )}
      >
        <div className="flex h-full flex-col">
          <div className={cn("flex h-14 items-center border-b border-border", sidebarCollapsed ? "justify-center px-2" : "gap-3 px-4")}>
            {!sidebarCollapsed && (
              <div className="group relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索菜谱..."
                  className="h-9 w-full rounded-full border border-border bg-background pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:shadow-sm"
                />
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={sidebarCollapsed ? "展开" : "收起"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {filteredRecipes.map((item) => {
                const active = pathname.includes(item.id);

                if (sidebarCollapsed) {
                  return (
                    <Link
                      key={item.id}
                      href={`/recipe/${item.id}`}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                        active ? "bg-primary/10 shadow-sm" : "hover:bg-muted/60"
                      )}
                      title={item.title}
                    >
                      <ChefHat className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={`/recipe/${item.id}`}
                    className={cn(
                      "group block overflow-hidden rounded-2xl border transition-all",
                      active
                        ? "border-primary/20 bg-primary/5 shadow-sm"
                        : "border-border bg-white hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-105",
                        active ? "from-primary/20 to-primary/10" : "from-orange-50 to-amber-50"
                      )}>
                        <ChefHat className={cn("h-5 w-5", active ? "text-primary" : "text-primary/30")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn("truncate text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                          {item.title}
                        </div>
                        {item.summary && (
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.summary}</div>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: Math.min(item.difficulty || 0, 5) }).map((_, i) => (
                              <Star key={i} className={cn("h-2.5 w-2.5", active ? "fill-primary text-primary" : "fill-amber-400 text-amber-400")} />
                            ))}
                          </div>
                          {item.duration_min && (
                            <span className="text-xs text-muted-foreground">· {item.duration_min}min</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-10">
          {/* 顶部信息 */}
          <div className="mb-10">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="mb-3 text-4xl font-black tracking-tight text-foreground">{recipe.title}</h1>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn("h-4 w-4", i < recipe.difficulty ? "fill-primary text-primary" : "fill-gray-200 text-gray-200")}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">难度 {recipe.difficulty}/5</span>
                </div>
              </div>
              <Link
                href={`/recipe/${recipe.id}/cook`}
                className="shrink-0 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95"
              >
                开始烹饪
              </Link>
            </div>

            <p className="mb-6 leading-relaxed text-muted-foreground">{recipe.summary}</p>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{recipe.duration_min} 分钟</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm">
                <Flame className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">{recipe.calories} kcal</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm">
                <ChefHat className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">{recipe.category}</span>
              </div>
              {recipe.tags?.map((tag) => (
                <span key={tag} className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 成品图 + 基础信息 */}
          <div className="mb-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 shadow-md">
              <div className="flex aspect-[4/3] items-center justify-center">
                <div className="text-center">
                  <ChefHat className="mx-auto mb-3 h-24 w-24 text-primary/20" />
                  <p className="text-sm text-muted-foreground">成品图</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-semibold">份数</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-all hover:bg-primary hover:text-white active:scale-90"
                    >
                      −
                    </button>
                    <motion.span
                      key={servings}
                      initial={{ scale: 1.3, color: "#f5701f" }}
                      animate={{ scale: 1, color: "#1a1a1a" }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="w-12 text-center text-2xl font-bold"
                    >
                      {servings}
                    </motion.span>
                    <button
                      onClick={() => setServings(servings + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-all hover:bg-primary hover:text-white active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">基准: {recipe.servings.base} 人份</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold">所需工具</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tools.map((tool) => (
                    <span key={tool} className="rounded-lg bg-muted px-3 py-1.5 text-sm">{tool}</span>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold">原料清单</h3>
                <div className="space-y-2">
                  {scaledIngredients.map((ing, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={ing.per_serving ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm"
                    >
                      <span className={cn("font-medium", ing.optional && "text-muted-foreground")}>
                        {ing.name}
                        {ing.optional && " (可选)"}
                      </span>
                      <motion.span
                        key={`${i}-${servings}`}
                        initial={ing.per_serving ? { color: "#f5701f" } : {}}
                        animate={ing.per_serving ? { color: "#1a1a1a" } : {}}
                        transition={{ duration: 0.4 }}
                        className="font-semibold"
                      >
                        {ing.amount}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 步骤区 */}
          <div className="mb-10">
            <h2 className="mb-6 text-2xl font-bold">制作步骤</h2>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 shadow-md">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex aspect-square items-center justify-center"
                  >
                    <div className="text-center">
                      <ChefHat className="mx-auto mb-3 h-20 w-20 text-primary/20" />
                      <p className="text-sm font-medium text-muted-foreground">步骤 {currentStep + 1}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {recipe.steps.length > 1 && (
                  <div className="pb-4 flex items-center justify-center gap-1.5">
                    {recipe.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStep(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === currentStep ? "w-6 bg-primary/80" : "w-1.5 bg-white/60 hover:bg-white/80"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all",
                      i === currentStep
                        ? "border-primary/30 bg-primary/5 shadow-md"
                        : "border-border bg-white hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {step.index}
                      </span>
                      <h4 className="font-semibold">{step.title}</h4>
                      {step.duration_sec && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {Math.ceil(step.duration_sec / 60)}min
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.instruction}</p>
                    {step.produces && (
                      <div className="mt-3 inline-block rounded-lg bg-success/10 px-3 py-1 text-xs font-medium text-success">
                        产出: {step.produces}
                      </div>
                    )}
                    {step.tips && step.tips.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {step.tips.map((tip, j) => (
                          <p key={j} className="text-xs text-primary">💡 {tip}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* 注意事项 */}
          {(recipe.variants?.length || recipe.tips?.length) && (
            <div className="mb-10">
              <h2 className="mb-6 text-2xl font-bold">注意事项</h2>
              <div className="overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm">
                {recipe.variants && recipe.variants.length > 0 && (
                  <div className={cn(recipe.tips && recipe.tips.length > 0 && "mb-6")}>
                    <h3 className="mb-4 text-base font-semibold">变体做法</h3>
                    <div className="space-y-3">
                      {recipe.variants.map((variant, i) => (
                        <div key={i} className="rounded-xl bg-muted/50 p-4">
                          <h4 className="mb-1.5 font-medium text-primary">{variant.title}</h4>
                          <p className="text-sm leading-relaxed text-muted-foreground">{variant.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {recipe.tips && recipe.tips.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-base font-semibold">小贴士</h3>
                    <ul className="space-y-2">
                      {recipe.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                          <span className="mt-1 text-primary">•</span>
                          <span className="flex-1 text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 全解图 */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">全解图</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">全解图占位</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">000-origin/微信图片_20260619142527_46_124.jpg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
