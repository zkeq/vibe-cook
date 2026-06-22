"use client";

import { useState, useEffect, useRef } from "react";
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
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  // 7秒自动切换步骤
  useEffect(() => {
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / 70, 100)); // 7秒 = 7000ms，每100ms更新一次
    }, 100);

    const stepTimer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % recipe.steps.length);
    }, 7000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [currentStep, recipe.steps.length]);

  // 当步骤切换时，自动滚动到对应位置（仅在步骤列表容器内滚动）
  useEffect(() => {
    if (stepsContainerRef.current) {
      const stepElement = stepsContainerRef.current.children[currentStep] as HTMLElement;
      if (stepElement) {
        // 计算步骤元素在容器内的位置
        const container = stepsContainerRef.current;
        const stepTop = stepElement.offsetTop;
        const stepHeight = stepElement.offsetHeight;
        const containerHeight = container.clientHeight;
        const containerScrollTop = container.scrollTop;

        // 如果步骤不在可视区域内，则滚动到居中位置
        if (stepTop < containerScrollTop || stepTop + stepHeight > containerScrollTop + containerHeight) {
          container.scrollTo({
            top: stepTop - containerHeight / 2 + stepHeight / 2,
            behavior: "smooth",
          });
        }
      }
    }
  }, [currentStep]);

  // 手动切换步骤
  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setProgress(0);
  };

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
      <aside
        className={cn(
          "relative z-10 hidden shrink-0 border-r border-border/60 bg-white transition-all duration-300 lg:block",
          sidebarCollapsed ? "w-16" : "w-72"
        )}
      >
        <div className="flex h-full flex-col">
          <div className={cn("flex h-14 shrink-0 items-center border-b border-border/60 bg-white", sidebarCollapsed ? "justify-center px-2" : "gap-3 px-4")}>
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
      <main className="relative z-10 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-[1200px] rounded-xl border border-border/60 bg-[#fdfdfd] p-8 shadow-sm">
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
          <div className="space-y-8">
            {/* 成品图 + 份数/工具/原料 */}
            <div className="grid gap-6 lg:grid-cols-[3fr_7fr]">
              {/* 左：成品图 高度自适应右侧 */}
              <div className="h-full overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
                <div className="flex h-full items-center justify-center">
                  <ChefHat className="h-16 w-16 text-primary/20" />
                </div>
              </div>

              {/* 右：份数/工具/原料 */}
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
            </div>

            {/* 步骤图轮播 + 步骤列表 */}
            <div>
              <h2 className="mb-4 text-xl font-bold">制作步骤</h2>
              <div className="grid gap-4 overflow-hidden rounded-xl border border-border/60 bg-white p-4 lg:grid-cols-[1fr_1.4fr]" style={{ height: '60vh' }}>
                {/* 左：步骤图轮播 上下居中 */}
                <div className="flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <ChefHat className="mx-auto mb-2 h-20 w-20 text-primary/20" />
                      <div className="text-sm text-muted-foreground">步骤 {currentStep + 1}</div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 右：步骤列表 固定高度可滚动 */}
                <div ref={stepsContainerRef} className="-mr-4 space-y-2 overflow-y-auto pr-4" style={{ height: 'calc(60vh - 2rem)' }}>
                  {recipe.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => handleStepClick(i)}
                      className={cn(
                        "relative cursor-pointer overflow-hidden rounded-xl border p-4 transition-all",
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

                      {/* 进度条 - 仅在当前步骤显示 */}
                      {i === currentStep && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1, ease: "linear" }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
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
      </main>
      </div>
    </>
  );
}
