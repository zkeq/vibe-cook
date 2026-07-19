import type { Ingredient } from "@/lib/types";

const LEADING_QUANTITY = /^\s*(\d+(?:\.\d+)?)/;

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(2)).toString();
}

export function getIngredientBaseQuantity(ingredient: Ingredient): number | null {
  if (!ingredient.per_serving) return null;

  const match = ingredient.amount.match(LEADING_QUANTITY);
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function getIngredientPrimaryUnit(amount: string): string {
  const match = amount.match(
    /^\s*\d+(?:\.\d+)?(?:\s*[-–~至]\s*\d+(?:\.\d+)?)?\s*([^\d\s(（/]+)/
  );
  return match?.[1] ?? "";
}

export function scaleIngredientAmount(amount: string, scale: number): string {
  if (!Number.isFinite(scale) || scale <= 0 || scale === 1) return amount;

  return amount.replace(/\d+(?:\.\d+)?/g, (rawValue) =>
    formatQuantity(Number(rawValue) * scale)
  );
}

export function scaleIngredient(
  ingredient: Ingredient,
  servings: number,
  baseServings: number
): Ingredient {
  if (!ingredient.per_serving || baseServings <= 0) return ingredient;

  return {
    ...ingredient,
    amount: scaleIngredientAmount(ingredient.amount, servings / baseServings),
  };
}

