import { appFetch } from "@/lib/http";
import type { Recipe, RecipeSummary } from '@/lib/types';

// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// 通用请求函数
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await appFetch(url, {
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
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = `/recipes${queryString ? `?${queryString}` : ''}`;

    const response = await fetchAPI<{ data: RecipeSummary[] }>(endpoint);
    return response.data;
  },

  /**
   * 根据 ID 获取菜谱详情
   */
  getRecipeById: async (id: string): Promise<Recipe> => {
    return fetchAPI<Recipe>(`/recipes/${id}`);
  },

  /**
   * 搜索菜谱
   */
  searchRecipes: async (query: string): Promise<RecipeSummary[]> => {
    const response = await fetchAPI<{ data: RecipeSummary[] }>(`/recipes/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  /**
   * 根据分类获取菜谱
   */
  getRecipesByCategory: async (category: string): Promise<RecipeSummary[]> => {
    const response = await fetchAPI<{ data: RecipeSummary[] }>(`/recipes/category/${category}`);
    return response.data;
  },

  /**
   * 随机获取菜谱
   */
  getRandomRecipes: async (limit: number = 24): Promise<RecipeSummary[]> => {
    const response = await fetchAPI<{ data: RecipeSummary[] }>(`/recipes/random?limit=${limit}`);
    return response.data;
  },

  /**
   * 获取所有分类
   */
  getCategories: async (): Promise<string[]> => {
    const response = await fetchAPI<{ data: string[] }>('/recipes/categories');
    return response.data;
  },
};

export default recipeAPI;
