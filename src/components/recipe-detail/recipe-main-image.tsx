import { ChefHat } from "lucide-react";

export function RecipeMainImage() {
  return (
    <div className="h-full overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="flex h-full items-center justify-center">
        <ChefHat className="h-16 w-16 text-primary/20" />
      </div>
    </div>
  );
}
