"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import type { Recipe } from "@/lib/types";
import {
  formatQuantity,
  getIngredientBaseQuantity,
  getIngredientPrimaryUnit,
} from "@/lib/ingredient-scaling";
import { useUserSettingsStore } from "@/store/user-settings-store";
import { cn } from "@/lib/utils";

interface IngredientScaleCalculatorProps {
  recipe: Recipe;
  compact?: boolean;
}

interface QuantityInputProps {
  ingredientName: string;
  initialValue: string;
  unit: string;
  onCommit: (value: string) => void;
}

function QuantityInput({
  ingredientName,
  initialValue,
  unit,
  onCommit,
}: QuantityInputProps) {
  const [value, setValue] = useState(initialValue);

  const commit = () => onCommit(value);

  return (
    <label className="relative min-w-0">
      <span className="sr-only">输入现有食材数量</span>
      <input
        type="number"
        inputMode="decimal"
        min="0.01"
        step="any"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="h-9 w-full rounded-lg border border-border bg-white pl-3 pr-10 text-sm font-bold tabular-nums text-primary outline-none transition-colors focus:border-primary"
        aria-label={`${ingredientName}的数量`}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      )}
    </label>
  );
}

export function IngredientScaleCalculator({
  recipe,
  compact = false,
}: IngredientScaleCalculatorProps) {
  const { servings: globalServings, setServings } = useUserSettingsStore();
  const servings = globalServings[recipe.id] || recipe.servings.base;

  const scalableIngredients = useMemo(
    () =>
      recipe.ingredients.filter(
        (ingredient) => getIngredientBaseQuantity(ingredient) !== null
      ),
    [recipe.ingredients]
  );
  const [selectedName, setSelectedName] = useState(
    scalableIngredients[0]?.name ?? ""
  );
  const selectedIngredient =
    scalableIngredients.find((ingredient) => ingredient.name === selectedName) ??
    scalableIngredients[0];
  const baseQuantity = selectedIngredient
    ? getIngredientBaseQuantity(selectedIngredient)
    : null;
  const currentQuantity =
    baseQuantity === null
      ? ""
      : formatQuantity(
          baseQuantity * (servings / Math.max(recipe.servings.base, 1))
        );
  if (!selectedIngredient || baseQuantity === null) return null;

  const unit = getIngredientPrimaryUnit(selectedIngredient.amount);

  const updateQuantity = (rawValue: string) => {
    const quantity = Number(rawValue);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    const nextServings = (recipe.servings.base * quantity) / baseQuantity;
    setServings(recipe.id, Number(nextServings.toFixed(4)));
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5",
        compact ? "p-3" : "p-3 sm:p-4"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Calculator className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-bold text-foreground">按食材换算</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          等效 {formatQuantity(servings)} 份
        </span>
      </div>
      <div className={cn("grid gap-2", compact ? "grid-cols-[1fr_1fr]" : "sm:grid-cols-[1fr_1fr]")}>
        <label className="min-w-0">
          <span className="sr-only">选择作为换算基准的食材</span>
          <select
            value={selectedIngredient.name}
            onChange={(event) => setSelectedName(event.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
          >
            {scalableIngredients.map((ingredient) => (
              <option key={ingredient.name} value={ingredient.name}>
                {ingredient.name}
              </option>
            ))}
          </select>
        </label>
        <QuantityInput
          key={`${selectedIngredient.name}-${currentQuantity}`}
          ingredientName={selectedIngredient.name}
          initialValue={currentQuantity}
          unit={unit}
          onCommit={updateQuantity}
        />
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        输入你现有的{selectedIngredient.name}数量，其余食材会自动同比换算。
      </p>
    </div>
  );
}
