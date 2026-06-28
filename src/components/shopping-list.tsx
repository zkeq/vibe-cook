"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Check } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShoppingListProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
}

export function ShoppingList({ recipe, isOpen, onClose }: ShoppingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // 从 localStorage 加载勾选状态
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(`shopping-list-${recipe.id}`);
      if (saved) {
        setCheckedItems(new Set(JSON.parse(saved)));
      }
    }
  }, [isOpen, recipe.id]);

  // 保存勾选状态到 localStorage
  useEffect(() => {
    if (checkedItems.size > 0 || checkedItems.size === 0) {
      localStorage.setItem(
        `shopping-list-${recipe.id}`,
        JSON.stringify(Array.from(checkedItems))
      );
      // 触发自定义事件，通知其他组件更新
      window.dispatchEvent(new Event("shopping-list-updated"));
    }
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部栏 */}
            <header className="bg-white border-b-2 border-border shadow-sm shrink-0 z-10">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-foreground tracking-tight">采购清单</h1>
                    <p className="text-xs text-muted-foreground">{recipe.title}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-muted-foreground hover:bg-neutral-200 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 进度条 */}
              <div className="px-4 pb-4">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {recipe.ingredients.map((ingredient, index) => {
                // 构建唯一key（兼容string和object两种格式）
                const ingredientKey = typeof ingredient === 'string'
                  ? ingredient
                  : `${ingredient.name}-${ingredient.amount}`;
                const ingredientName = typeof ingredient === 'string'
                  ? ingredient
                  : ingredient.name;

                const isChecked = checkedItems.has(ingredientKey);
                return (
                  <motion.button
                    key={index}
                    onClick={() => toggleItem(ingredientKey)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                      isChecked
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-white hover:border-primary/50"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* 勾选框 */}
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        isChecked
                          ? "border-primary bg-primary"
                          : "border-border bg-white"
                      )}
                    >
                      {isChecked && <Check className="h-4 w-4 text-white stroke-[3]" />}
                    </div>

                    {/* 食材名称 */}
                    <span
                      className={cn(
                        "flex-1 font-bold tracking-tight transition-all",
                        isChecked
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      )}
                    >
                      {ingredientName}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
