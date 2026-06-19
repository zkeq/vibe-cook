import type { RecipeSummary } from "@/lib/types";
import Link from "next/link";
import { ChefHat, Timer, Flame } from "lucide-react";

const DIFF_LABEL = ["", "简单", "普通", "有点难", "挑战", "大师"];
const DIFF_DOT = ["", "bg-emerald-400", "bg-blue-400", "bg-yellow-400", "bg-orange-400", "bg-red-400"];
export const CATEGORY_GRAD: Record<string, string> = {
  "家常菜": "from-orange-100 to-amber-50",
  "川菜": "from-red-100 to-rose-50",
  "粤菜": "from-sky-100 to-blue-50",
};

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const diff = recipe.difficulty ?? 1;
  const grad = CATEGORY_GRAD[recipe.category] ?? "from-stone-100 to-gray-50";
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group flex w-52 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${grad}`}>
        <ChefHat
          className="h-10 w-10 transition-transform group-hover:scale-110"
          style={{ color: "rgba(180,120,60,0.35)" }}
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm">
          {recipe.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="line-clamp-1 text-sm font-bold leading-tight text-foreground">{recipe.title}</span>
        {recipe.summary && (
          <span className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{recipe.summary}</span>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <span className={`h-1.5 w-1.5 rounded-full ${DIFF_DOT[diff]}`} />
          <span className="text-[11px] text-muted-foreground">{DIFF_LABEL[diff]}</span>
          {recipe.duration_min && (
            <>
              <span className="text-border">·</span>
              <Timer className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{recipe.duration_min}分钟</span>
            </>
          )}
          {recipe.calories && (
            <>
              <span className="text-border">·</span>
              <Flame className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{recipe.calories}</span>
            </>
          )}
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
