import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  RecipeFinderChatMessage,
  RecipeFinderRecommendation,
} from "@/lib/recipe-finder-agent";

export interface StoredRecipeFinderMessage extends RecipeFinderChatMessage {
  id: string;
  recommendations?: RecipeFinderRecommendation[];
}

interface RecipeFinderAgentState {
  conversations: RecipeFinderConversation[];
  activeConversationId: string;
  upsertConversation: (conversation: RecipeFinderConversation) => void;
  removeConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string) => void;
}

export interface RecipeFinderConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredRecipeFinderMessage[];
}

export const useRecipeFinderAgentStore = create<RecipeFinderAgentState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationId: "",
      upsertConversation: (conversation) =>
        set((state) => ({
          conversations: state.conversations.some((item) => item.id === conversation.id)
            ? state.conversations.map((item) =>
                item.id === conversation.id ? conversation : item
              )
            : [conversation, ...state.conversations],
          activeConversationId: conversation.id,
        })),
      removeConversation: (conversationId) =>
        set((state) => {
          const conversations = state.conversations.filter((item) => item.id !== conversationId);
          return {
            conversations,
            activeConversationId:
              state.activeConversationId === conversationId
                ? [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.id || ""
                : state.activeConversationId,
          };
        }),
      setActiveConversation: (activeConversationId) => set({ activeConversationId }),
    }),
    {
      name: "vibe-cook-recipe-finder-agent",
    }
  )
);
