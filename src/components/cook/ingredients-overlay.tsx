"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { Ingredient } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  servings: number;
  ingredients: Ingredient[];
}

// 做到一半想看「盐放多少」：全屏、大字、尽量一屏放下不用滑
export function IngredientsOverlay({ open, onClose, title, servings, ingredients }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const count = ingredients.length;
  // 配料越多字越小、列越多，保证一屏放下
  const size = count <= 6 ? "text-3xl sm:text-4xl" : count <= 10 ? "text-2xl sm:text-3xl" : count <= 16 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl";
  const columns = count <= 6 ? "sm:grid-cols-1" : count <= 12 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex flex-col bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
          role="dialog"
          aria-label="配料表"
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-3 sm:px-8 sm:py-4">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">配料表 / Ingredients</span>
              <p className="truncate text-base font-black text-foreground sm:text-lg">
                {title} · {servings}人份
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-neutral-50 hover:text-foreground"
            >
              <X className="h-4 w-4" />
              说「关闭」
            </button>
          </header>

          <ul className={cn("grid flex-1 content-center gap-x-10 overflow-y-auto px-5 py-4 sm:px-10", columns)}>
            {ingredients.map((ingredient) => (
              <li
                key={ingredient.name}
                className="flex items-baseline justify-between gap-4 border-b border-dashed border-border py-2.5 sm:py-3"
              >
                <span className={cn("min-w-0 font-bold text-foreground", size)}>
                  {ingredient.name}
                  {ingredient.optional && <span className="ml-2 align-middle text-xs font-medium text-muted-foreground">可选</span>}
                </span>
                <span className={cn("shrink-0 font-black tabular-nums text-primary", size)}>{ingredient.amount}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
