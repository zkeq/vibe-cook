import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserSettingsState {
  // 每个菜谱的份数选择（recipeId -> servings）
  servings: Record<string, number>;
  setServings: (recipeId: string, servings: number) => void;

  // 每个菜谱的采购清单勾选状态（recipeId -> Set<ingredientKey>）
  shoppingLists: Record<string, string[]>;
  toggleShoppingItem: (recipeId: string, ingredientKey: string) => void;
  clearShoppingList: (recipeId: string) => void;
  getShoppingList: (recipeId: string) => Set<string>;

  // Agent 为每个菜谱步骤添加的个性化提示（recipeId -> stepIndex -> tips）
  recipeTipAdditions: Record<string, Record<number, string[]>>;
  addRecipeTips: (recipeId: string, stepIndex: number, tips: string[]) => void;

  // 用户偏好设置
  preferences: {
    theme?: 'light' | 'dark';
    language?: string;
  };
  setPreference: <K extends keyof UserSettingsState['preferences']>(
    key: K,
    value: UserSettingsState['preferences'][K]
  ) => void;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      servings: {},
      shoppingLists: {},
      recipeTipAdditions: {},
      preferences: {},

      setServings: (recipeId, servings) =>
        set((state) => ({
          servings: { ...state.servings, [recipeId]: servings },
        })),

      toggleShoppingItem: (recipeId, ingredientKey) =>
        set((state) => {
          const currentList = state.shoppingLists[recipeId] || [];
          const newList = currentList.includes(ingredientKey)
            ? currentList.filter((key) => key !== ingredientKey)
            : [...currentList, ingredientKey];

          return {
            shoppingLists: { ...state.shoppingLists, [recipeId]: newList },
          };
        }),

      clearShoppingList: (recipeId) =>
        set((state) => ({
          shoppingLists: { ...state.shoppingLists, [recipeId]: [] },
        })),

      getShoppingList: (recipeId) => {
        const list = get().shoppingLists[recipeId] || [];
        return new Set(list);
      },

      addRecipeTips: (recipeId, stepIndex, tips) =>
        set((state) => {
          const recipeTips = state.recipeTipAdditions[recipeId] || {};
          const stepTips = recipeTips[stepIndex] || [];
          const uniqueTips = [...new Set([...stepTips, ...tips.map((tip) => tip.trim()).filter(Boolean)])];

          return {
            recipeTipAdditions: {
              ...state.recipeTipAdditions,
              [recipeId]: { ...recipeTips, [stepIndex]: uniqueTips },
            },
          };
        }),

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
    }),
    {
      name: 'vibe-cook-user-settings', // localStorage key
    }
  )
);
