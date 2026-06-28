import { create } from 'zustand';
import type { Recipe, RecipeSummary } from '@/lib/types';
import { recipeAPI } from '@/services/recipe-api';

interface RecipeState {
  // 菜谱列表
  recipeList: RecipeSummary[];
  setRecipeList: (list: RecipeSummary[]) => void;

  // 当前查看的菜谱详情
  currentRecipe: Recipe | null;
  setCurrentRecipe: (recipe: Recipe | null) => void;

  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 错误信息
  error: string | null;
  setError: (error: string | null) => void;

  // 根据 ID 获取菜谱
  fetchRecipeById: (id: string) => Promise<void>;

  // 获取菜谱列表
  fetchRecipeList: () => Promise<void>;

  // 搜索菜谱
  searchRecipes: (query: string) => Promise<void>;

  // 根据分类获取菜谱
  fetchRecipesByCategory: (category: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipeList: [],
  currentRecipe: null,
  isLoading: false,
  error: null,

  setRecipeList: (list) => set({ recipeList: list }),
  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchRecipeById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const recipe = await recipeAPI.getRecipeById(id);
      set({ currentRecipe: recipe, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取菜谱失败',
        isLoading: false
      });
    }
  },

  fetchRecipeList: async () => {
    set({ isLoading: true, error: null });
    try {
      const list = await recipeAPI.getRecipes();
      set({ recipeList: list, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取菜谱列表失败',
        isLoading: false
      });
    }
  },

  searchRecipes: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const list = await recipeAPI.searchRecipes(query);
      set({ recipeList: list, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '搜索失败',
        isLoading: false
      });
    }
  },

  fetchRecipesByCategory: async (category: string) => {
    set({ isLoading: true, error: null });
    try {
      const list = await recipeAPI.getRecipesByCategory(category);
      set({ recipeList: list, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取分类菜谱失败',
        isLoading: false
      });
    }
  },
}));
