/**
 * FastAPI 后端客户端
 * base URL 走环境变量 NEXT_PUBLIC_API_BASE，默认本地 8000。
 * 后端响应统一形如 { success: boolean, ... }。
 */
import type { Recipe, RecipeSummary } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

/** 食谱列表(公开) */
export async function fetchRecipes(): Promise<RecipeSummary[]> {
  const data = await request<{ success: boolean; recipes: RecipeSummary[] }>(
    "/recipes",
  );
  return data.recipes;
}

/** 食谱详情(公开) */
export async function fetchRecipe(id: string): Promise<Recipe> {
  const data = await request<{ success: boolean; recipe: Recipe }>(
    `/recipes/${id}`,
  );
  return data.recipe;
}
