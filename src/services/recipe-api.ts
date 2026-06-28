import type { Recipe, RecipeSummary } from '@/lib/types';

// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 通用请求函数
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}

// 菜谱相关 API
export const recipeAPI = {
  /**
   * 获取菜谱列表
   * @param params 查询参数（分类、搜索等）
   */
  getRecipes: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<RecipeSummary[]> => {
    // TODO: 对接后端 API
    // const query = new URLSearchParams(params as any).toString();
    // return fetchAPI<RecipeSummary[]>(`/api/recipes?${query}`);

    // 暂时返回 mock 数据
    const { mockRecipeList } = await import('@/lib/mock');
    return mockRecipeList;
  },

  /**
   * 根据 ID 获取菜谱详情
   */
  getRecipeById: async (id: string): Promise<Recipe> => {
    // TODO: 对接后端 API
    // return fetchAPI<Recipe>(`/api/recipes/${id}`);

    // 暂时返回 mock 数据
    const { mockRecipe } = await import('@/lib/mock');
    return mockRecipe;
  },

  /**
   * 搜索菜谱
   */
  searchRecipes: async (query: string): Promise<RecipeSummary[]> => {
    // TODO: 对接后端 API
    // return fetchAPI<RecipeSummary[]>(`/api/recipes/search?q=${encodeURIComponent(query)}`);

    const { mockRecipeList } = await import('@/lib/mock');
    return mockRecipeList.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query.toLowerCase()) ||
        recipe.summary?.toLowerCase().includes(query.toLowerCase())
    );
  },

  /**
   * 根据分类获取菜谱
   */
  getRecipesByCategory: async (category: string): Promise<RecipeSummary[]> => {
    // TODO: 对接后端 API
    // return fetchAPI<RecipeSummary[]>(`/api/recipes/category/${category}`);

    const { mockRecipeList } = await import('@/lib/mock');
    return mockRecipeList.filter((recipe) => recipe.category === category);
  },
};

export default recipeAPI;
