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
  const [currentStepImage, setCurrentStepImage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const scaledIngredients = recipe.ingredients.map((ing) => {
    if (!ing.per_serving) return ing;
    const match = ing.amount.match(/^([\d.]+)/);
    if (!match) return ing;
    const baseAmount = parseFloat(match[1]);
    const scaledAmount = (baseAmount * servings) / recipe.servings.base;
    const rest = ing.amount.replace(/^[\d.]+/, "");
    return {
      ...ing,
      amount: `${scaledAmount.toFixed(1).replace(/\.0$/, "")}${rest}`,
    };
  });

  const handleServingsChange = (newServings: number) => {
    if (newServings < 1) return;
    setServings(newServings);
  };

  // 过滤菜谱列表
  const filteredRecipes = mockRecipeList.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="-mt-14 flex min-h-screen bg-background pt-14">
      {/* 左侧菜谱列表导航 */}
      <aside
        className={cn(
          "hidden border-r border-border bg-white transition-all duration-300 lg:block",
          sidebarCollapsed ? "w-16" : "w-72"
        )}
      >
        <div className="flex h-full flex-col">
          {/* 顶部搜索+收起按钮 */}
          <div className={cn(
            "flex h-14 items-center border-b border-border",
            sidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"
          )}>
            {!sidebarCollapsed && (
              <div className="group relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-border bg-background py-1.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-white"
                />
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={sidebarCollapsed ? "展开" : "收起"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* 菜谱列表 */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className={cn("space-y-1.5", sidebarCollapsed && "flex flex-col items-center")}>
              {filteredRecipes.map((item) => {
                const isActive = pathname.includes(item.id);

                // 收起状态：只显示图标
                if (sidebarCollapsed) {
                  return (
                    <Link
                      key={item.id}
                      href={`/recipe/${item.id}`}
                      className={cn(
                        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all",
                        isActive
                          ? "bg-primary/10 shadow-sm"
                          : "hover:bg-muted/60"
                      )}
                      title={item.title}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br",
                          isActive
                            ? "from-primary/20 to-primary/10"
                            : "from-orange-50 to-amber-50"
                        )}
                      >
                        <ChefHat className={cn("h-5 w-5", isActive ? "text-primary" : "text-primary/30")} />
                      </div>
                    </Link>
                  );
                }

                // 展开状态：完整信息
                return (
                  <Link
                    key={item.id}
                    href={`/recipe/${item.id}`}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl p-3 transition-all",
                      isActive
                        ? "bg-primary/10 shadow-sm"
                        : "hover:bg-muted/60"
                    )}
                  >
                    {/* 菜品图标 */}
                    <div
                      className={cn(
                        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-all",
                        isActive
                          ? "from-primary/20 to-primary/10"
                          : "from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100"
                      )}
                    >
                      <ChefHat className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-primary/30 group-hover:text-primary/50")} />
                    </div>

                    {/* 菜品信息 */}
                    <div className="flex-1 overflow-hidden">
                      <h4 className={cn("truncate text-sm font-semibold transition-colors", isActive ? "text-primary" : "text-foreground")}>{item.title}</h4>
                      {item.summary && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.summary}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: Math.min(item.difficulty || 0, 5) }).map((_, i) => (
                            <Star key={i} className={cn("h-2.5 w-2.5", isActive ? "fill-primary text-primary" : "fill-amber-400 text-amber-400")} />
                          ))}
                        </div>
                        {item.duration_min && (
                          <span className="text-xs text-muted-foreground">· {item.duration_min}min</span>
                        )}
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
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
          {/* 1. 菜品简介信息展示层 */}
          <section className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-black tracking-tight">{recipe.title}</h1>

                {/* 星级 */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < recipe.difficulty ? "fill-primary text-primary" : "fill-gray-200 text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">难度 {recipe.difficulty}/5</span>
                </div>

                {/* 简介 */}
                <p className="mb-4 leading-relaxed text-muted-foreground">{recipe.summary}</p>

                {/* 信息标签 */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm">{recipe.duration_min}min</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                    <Flame className="h-4 w-4 text-accent" />
                    <span className="text-sm">{recipe.calories} kcal</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                    <ChefHat className="h-4 w-4 text-success" />
                    <span className="text-sm">{recipe.category}</span>
                  </div>
                  {recipe.tags?.map((tag) => (
                    <span key={tag} className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={`/recipe/${recipe.id}/cook`}
                className="flex-shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95"
              >
                开始烹饪
              </Link>
            </div>
          </section>

          {/* 2. 成品图 + 份数/工具/原料 */}
          <section className="mb-10">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              {/* 左：成品图 */}
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
                <div className="flex aspect-[4/3] items-center justify-center">
                  <div className="text-center">
                    <ChefHat className="mx-auto mb-2 h-20 w-20 text-primary/20" />
                    <p className="text-sm text-muted-foreground">成品图占位</p>
                  </div>
                </div>
              </div>

              {/* 右：份数/工具/原料 */}
              <div className="space-y-4">
                {/* 份数调整 */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-semibold">份数</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleServingsChange(servings - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground transition-all hover:bg-primary hover:text-white active:scale-90"
                      >
                        -
                      </button>
                      <motion.span
                        key={servings}
                        initial={{ scale: 1.3, color: "#f5701f" }}
                        animate={{ scale: 1, color: "#1a1a1a" }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="min-w-[3ch] text-center text-2xl font-bold"
                      >
                        {servings}
                      </motion.span>
                      <button
                        onClick={() => handleServingsChange(servings + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground transition-all hover:bg-primary hover:text-white active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">基准: {recipe.servings.base} 人份</p>
                </div>

                {/* 工具 */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold">所需工具</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tools.map((tool) => (
                      <span key={tool} className="rounded-lg bg-muted px-3 py-1.5 text-sm">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 原料 */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold">原料清单</h3>
                  <div className="space-y-2">
                    {scaledIngredients.map((ing, i) => (
                      <motion.div
                        key={i}
                        initial={false}
                        animate={
                          ing.per_serving
                            ? { scale: [1, 1.05, 1] }
                            : {}
                        }
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
          </section>

          {/* 3. 步骤图轮播 + 步骤列表 */}
          <section className="mb-10">
            <h2 className="mb-6 text-2xl font-bold">制作步骤</h2>
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
              {/* 左：步骤图轮播 */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStepImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex aspect-square items-center justify-center"
                  >
                    <div className="text-center">
                      <ChefHat className="mx-auto mb-3 h-24 w-24 text-primary/20" />
                      <p className="text-sm font-medium text-muted-foreground">步骤 {currentStepImage + 1}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* 轮播指示器（精简） */}
                {recipe.steps.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
                    {recipe.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStepImage(i)}
                        className={cn(
                          "h-1 rounded-full transition-all",
                          i === currentStepImage
                            ? "w-6 bg-primary/80"
                            : "w-1 bg-white/50 hover:bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 右：步骤列表 */}
              <div className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setCurrentStepImage(i)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-all",
                      i === currentStepImage
                        ? "border-primary/50 bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
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
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.instruction}
                    </p>
                    {step.produces && (
                      <div className="mt-2 inline-block rounded-lg bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        产出: {step.produces}
                      </div>
                    )}
                    {step.tips && step.tips.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {step.tips.map((tip, j) => (
                          <p key={j} className="text-xs text-primary">
                            💡 {tip}
                          </p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. 注意事项 */}
          <section className="mb-10">
            <h2 className="mb-6 text-2xl font-bold">注意事项</h2>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
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
          </section>

          {/* 5. 全解图 */}
          <section className="mb-10">
            <h2 className="mb-6 text-2xl font-bold">全解图</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">全解图占位</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    000-origin/微信图片_20260619142527_46_124.jpg
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
