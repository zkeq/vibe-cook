"use client";

import { Star, Clock, Flame, ChefHat } from "lucide-react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecipeHeaderProps {
  recipe: Recipe;
}

export function RecipeHeader({ recipe }: RecipeHeaderProps) {
  return (
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
  );
}
