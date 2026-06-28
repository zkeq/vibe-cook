"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingCart, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShoppingClientProps {
  recipe: Recipe;
}

export function ShoppingClient({ recipe }: ShoppingClientProps) {
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [servings, setServings] = useState(recipe.servings.base);

  // 从 localStorage 加载份数
  useEffect(() => {
    const savedServings = localStorage.getItem(`recipe-servings-${recipe.id}`);
    if (savedServings) {
      setServings(parseInt(savedServings, 10));
    }
  }, [recipe.id]);

  // 从 localStorage 加载勾选状态
  useEffect(() => {
    const saved = localStorage.getItem(`shopping-list-${recipe.id}`);
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved)));
    }
  }, [recipe.id]);

  // 保存勾选状态到 localStorage
  useEffect(() => {
    localStorage.setItem(
      `shopping-list-${recipe.id}`,
      JSON.stringify(Array.from(checkedItems))
    );
    // 触发自定义事件，通知其他组件更新
    window.dispatchEvent(new Event("shopping-list-updated"));
  }, [checkedItems, recipe.id]);

  const toggleItem = (ingredientKey: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientKey)) {
        next.delete(ingredientKey);
      } else {
        next.add(ingredientKey);
      }
      return next;
    });
  };

  const clearAll = () => {
    setCheckedItems(new Set());
    localStorage.removeItem(`shopping-list-${recipe.id}`);
  };

  const totalItems = recipe.ingredients.length;
  const checkedCount = checkedItems.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  // 计算缩放后的食材量
  const scaledIngredients = recipe.ingredients.map((ing) => {
    if (typeof ing === 'string') return { name: ing, amount: '', scaledAmount: '' };
    if (!ing.per_serving) return { ...ing, scaledAmount: ing.amount };

    const match = ing.amount.match(/^([\d.]+)/);
    if (!match) return { ...ing, scaledAmount: ing.amount };

    const baseAmount = parseFloat(match[1]);
    const scaledValue = (baseAmount * servings) / recipe.servings.base;
    const rest = ing.amount.replace(/^[\d.]+/, "");
    const scaledAmount = scaledValue.toFixed(1).replace(/\.0$/, "") + rest;

    return { ...ing, scaledAmount };
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 顶部栏 */}
      <header className="bg-white border-b-2 border-border shadow-sm shrink-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 lg:px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground hover:bg-neutral-200 active:scale-95 transition-all"
            title="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight">采购清单</h1>
              <p className="text-xs text-muted-foreground">{recipe.title} · {servings}人份</p>
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-white text-muted-foreground hover:bg-neutral-50 active:scale-95 transition-all"
            title="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 进度条 */}
        <div className="max-w-6xl mx-auto px-4 lg:px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">
              已购买 {checkedCount}/{totalItems}
            </span>
            {checkedCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-bold text-primary hover:underline"
              >
                清空
              </button>
            )}
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      {/* 食材列表 */}
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3 max-w-6xl mx-auto">
          {scaledIngredients.map((ingredient, index) => {
          // 构建唯一key
          const ingredientKey = typeof ingredient === 'string'
            ? ingredient
            : `${ingredient.name}-${ingredient.amount}`;
          const ingredientName = typeof ingredient === 'string'
            ? ingredient
            : ingredient.name;
          const ingredientAmount = typeof ingredient === 'string'
            ? ''
            : (ingredient.scaledAmount || ingredient.amount);
          const isOptional = typeof ingredient === 'string'
            ? false
            : ingredient.optional || false;
          const perServing = typeof ingredient === 'string'
            ? false
            : ingredient.per_serving || false;
          const buyingTip = typeof ingredient === 'string'
            ? ''
            : ingredient.buying_tip || '';

          const isChecked = checkedItems.has(ingredientKey);

          return (
            <motion.button
              key={index}
              onClick={() => toggleItem(ingredientKey)}
              className={cn(
                "w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                isChecked
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-white hover:border-primary/50"
              )}
              whileTap={{ scale: 0.98 }}
            >
              {/* 勾选框 */}
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all mt-0.5",
                  isChecked
                    ? "border-primary bg-primary"
                    : "border-border bg-white"
                )}
              >
                {isChecked && <Check className="h-4 w-4 text-white stroke-[3]" />}
              </div>

              {/* 食材信息 */}
              <div className="flex-1 min-w-0">
                {/* 食材名称 */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span
                    className={cn(
                      "text-base font-bold tracking-tight transition-all",
                      isChecked
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {ingredientName}
                  </span>
                  {isOptional && (
                    <span className="text-xs font-medium text-muted-foreground px-1.5 py-0.5 bg-neutral-100 rounded">
                      可选
                    </span>
                  )}
                </div>

                {/* 采购量 */}
                {ingredientAmount && (
                  <div className={cn(
                    "flex items-center gap-1.5 text-sm font-medium transition-all mb-1",
                    isChecked
                      ? "text-muted-foreground"
                      : "text-primary"
                  )}>
                    <span className="text-xs text-muted-foreground">需购买：</span>
                    <span className="font-bold">{ingredientAmount}</span>
                    {perServing && servings !== recipe.servings.base && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (已按{servings}人份调整)
                      </span>
                    )}
                  </div>
                )}

                {/* 购买注意事项 */}
                {buyingTip && (
                  <div className={cn(
                    "text-xs leading-relaxed transition-all",
                    isChecked
                      ? "text-muted-foreground/70"
                      : "text-muted-foreground"
                  )}>
                    💡 {buyingTip}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
        </div>
      </div>

      {/* 底部完成按钮 */}
      <footer className="bg-white border-t-2 border-border shrink-0 shadow-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-6xl mx-auto p-4 lg:px-6">
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-primary/90 active:scale-98"
          >
            <Check className="h-5 w-5" />
            完成采购，返回菜谱
          </button>
        </div>
      </footer>
    </div>
  );
}
