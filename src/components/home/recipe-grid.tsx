import type { RecipeSummary } from "@/lib/types";
import Link from "next/link";
import { ChefHat, Clock } from "lucide-react";
import { CATEGORY_GRAD } from "./recipe-card";
import { cn } from "@/lib/utils";

const DIFF_LABEL = ["", "简单", "普通", "有点难", "挑战", "大师"];
const DIFF_DOT   = ["", "bg-emerald-400", "bg-blue-400", "bg-yellow-400", "bg-orange-400", "bg-red-400"];

interface RecipeGridProps {
  items: RecipeSummary[];
  isLoading?: boolean;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  totalCount?: number;
}

export function RecipeGrid({
  items,
  isLoading,
  categories = [],
  selectedCategory = "全部",
  onCategoryChange,
  totalCount
}: RecipeGridProps) {
  if (isLoading) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-5">
          <h2 className="text-base font-bold text-foreground mb-3">所有食谱</h2>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  disabled
                  className="rounded-lg px-3 py-1.5 text-xs font-medium bg-white text-muted-foreground border border-border"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="h-36 bg-neutral-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">所有食谱</h2>
          <span className="text-xs text-muted-foreground">{totalCount || items.length} 道</span>
        </div>

        {/* 分类筛选 */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange?.(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((r) => {
          const diff = r.difficulty ?? 1;
          const grad = CATEGORY_GRAD[r.category] ?? "from-stone-100 to-gray-50";
          return (
            <Link key={r.id} href={`/recipe/${r.id}`} className="group block">
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${grad}`}>
                  <ChefHat
                    className="h-12 w-12 transition-transform group-hover:scale-110"
                    style={{ color: "rgba(180,120,60,0.3)" }}
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                    {r.category}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">{r.title}</p>
                  {r.summary && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.summary}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${DIFF_DOT[diff]}`} />
                    <span className="text-[11px] text-muted-foreground">{DIFF_LABEL[diff]}</span>
                    {r.duration_min && (
                      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />{r.duration_min}分钟
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
