import type { Recipe } from "@/lib/types";

interface RecipeNotesProps {
  recipe: Recipe;
}

export function RecipeNotes({ recipe }: RecipeNotesProps) {
  const hasNotes = recipe.variants?.length || recipe.tips?.length;
  
  if (!hasNotes) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">注意事项</div>
      {recipe.variants && recipe.variants.length > 0 && (
        <div className="mb-4 space-y-3">
          {recipe.variants.map((v, i) => (
            <div key={i} className="border-l-2 border-primary/40 pl-3">
              <div className="text-sm font-semibold text-primary">{v.title}</div>
              <div className="text-xs leading-relaxed text-muted-foreground mt-1">{v.desc}</div>
            </div>
          ))}
        </div>
      )}
      {recipe.tips && recipe.tips.length > 0 && (
        <div className="space-y-1.5 border-t border-border/40 pt-3 mt-3">
          {recipe.tips.map((tip, i) => (
            <div key={i} className="text-xs leading-relaxed text-muted-foreground">• {tip}</div>
          ))}
        </div>
      )}
    </div>
  );
}
