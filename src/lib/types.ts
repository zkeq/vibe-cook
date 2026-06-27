/**
 * Vibe Cook 数据契约
 *
 * 这是 LLM 结构化输出、后端存储(recipes.data)、前端渲染三方共用的 schema。
 * 与后端 sql/init.sql 的 recipes 表、business/recipe.py 保持一致。
 */

/** 原料 */
export interface Ingredient {
  name: string;
  amount: string; // 如 "1个(约180g)"
  per_serving?: boolean; // 是否随份数缩放
  optional?: boolean;
}

/** 份量计算 */
export interface Servings {
  base: number; // 基准份数
  formula: { name: string; expr: string }[]; // 如 { name:"西红柿", expr:"1个 × 份数" }
}

/** 单个烹饪步骤 */
export interface RecipeStep {
  index: number;
  title: string;
  instruction: string;
  image?: string;
  duration_sec?: number; // 有则显示计时器
  produces?: string; // 产出物，可在后续步骤高亮引用
  tips?: string[];
}

/** 做法变体 */
export interface RecipeVariant {
  title: string;
  desc: string;
}

/** 完整食谱(详情页 / 烹饪模式) */
export interface Recipe {
  id: string;
  title: string;
  summary: string;
  difficulty: number; // 1-5 星
  calories: number; // 大卡
  duration_min: number;
  category: string;
  cover_image: string;
  tags: string[];
  ingredients: Ingredient[];
  tools: string[];
  servings: Servings;
  steps: RecipeStep[];
  variants?: RecipeVariant[];
  tips?: string[];
  overview_image?: string;
}

/** 列表页轻量字段(后端 list_recipes 返回) */
export interface RecipeSummary {
  id: string;
  title: string;
  category: string;
  cover_image: string;
  summary?: string;
  difficulty?: number;
  calories?: number;
  duration_min?: number;
  tags?: string[];
}
