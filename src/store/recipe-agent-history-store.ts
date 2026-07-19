import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  RecipeAgentChatMessage,
  RecipeAgentSuggestion,
} from "@/lib/recipe-agent";

export interface StoredRecipeAgentMessage extends RecipeAgentChatMessage {
  id: string;
  suggestions?: RecipeAgentSuggestion[];
}

export interface RecipeAgentConversation {
  id: string;
  recipeId: string;
  recipeTitle: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredRecipeAgentMessage[];
}

interface RecipeAgentHistoryState {
  conversations: RecipeAgentConversation[];
  activeConversationByRecipe: Record<string, string>;
  upsertConversation: (conversation: RecipeAgentConversation) => void;
  removeConversation: (recipeId: string, conversationId: string) => void;
  setActiveConversation: (recipeId: string, conversationId: string) => void;
}

export const useRecipeAgentHistoryStore = create<RecipeAgentHistoryState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationByRecipe: {},

      upsertConversation: (conversation) =>
        set((state) => {
          const exists = state.conversations.some((item) => item.id === conversation.id);
          return {
            conversations: exists
              ? state.conversations.map((item) =>
                  item.id === conversation.id ? conversation : item
                )
              : [conversation, ...state.conversations],
            activeConversationByRecipe: {
              ...state.activeConversationByRecipe,
              [conversation.recipeId]: conversation.id,
            },
          };
        }),

      removeConversation: (recipeId, conversationId) =>
        set((state) => {
          const conversations = state.conversations.filter(
            (conversation) => conversation.id !== conversationId
          );
          const activeConversationByRecipe = { ...state.activeConversationByRecipe };

          if (activeConversationByRecipe[recipeId] === conversationId) {
            const nextConversation = conversations
              .filter((conversation) => conversation.recipeId === recipeId)
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

            if (nextConversation) {
              activeConversationByRecipe[recipeId] = nextConversation.id;
            } else {
              delete activeConversationByRecipe[recipeId];
            }
          }

          return { conversations, activeConversationByRecipe };
        }),

      setActiveConversation: (recipeId, conversationId) =>
        set((state) => ({
          activeConversationByRecipe: {
            ...state.activeConversationByRecipe,
            [recipeId]: conversationId,
          },
        })),
    }),
    {
      name: "vibe-cook-recipe-agent-history",
    }
  )
);
