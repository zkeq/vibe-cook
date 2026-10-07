import { appFetch } from "@/lib/http";
import { create } from 'zustand';
import type { Recipe, RecipeSummary } from '@/lib/types';
import { recipeAPI } from '@/services/recipe-api';
import { shuffleArray } from '@/lib/array-utils';

const LIMIT_PER_PAGE = 24;

interface RecipeState {
  recipeList: RecipeSummary[];
  currentRecipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalRecipes: number;

  setRecipeList: (list: RecipeSummary[]) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;

  fetchRecipeById: (id: string) => Promise<void>;
  fetchRecipeList: (page?: number, category?: string) => Promise<void>;
  searchRecipes: (query: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipeList: [],
  currentRecipe: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalRecipes: 0,

  setRecipeList: (list) => set({ recipeList: list }),
  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCurrentPage: (page) => {
    set({ currentPage: page });
    get().fetchRecipeList(page);
  },

  fetchRecipeById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const recipe = await recipeAPI.getRecipeById(id);
      set({ currentRecipe: recipe, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取菜谱详情失败',
        isLoading: false
      });
    }
  },

  fetchRecipeList: async (page = 1, category?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recipes?page=${page}&limit=${LIMIT_PER_PAGE}${
        category ? `&category=${category}` : ''
      }`;
      const response = await appFetch(url);
      const data = await response.json();

      // 随机打乱菜谱列表
      const shuffledRecipes = shuffleArray<RecipeSummary>(data.data || []);

      set({
        recipeList: shuffledRecipes,
        currentPage: data.page || page,
        totalRecipes: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / LIMIT_PER_PAGE),
        isLoading: false
      });
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
}));
