import type { Recipe } from "@/lib/types";

interface RecipeNotesProps {
  recipe: Recipe;
}

export function RecipeNotes({ recipe }: RecipeNotesProps) {
  return (
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
  );
}
