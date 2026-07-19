import type { Recipe } from "@/lib/types";

export interface RecipeAgentChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RecipeAgentSuggestion {
  stepIndex: number;
  reason: string;
  tips: string[];
}

export interface RecipeAgentResponse {
  message: string;
  suggestions: RecipeAgentSuggestion[];
}

function getConversationId(recipeId: string): string {
  const storageKey = `recipe-agent-conversation-${recipeId}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 31);
  const conversationId = `cook_${randomPart}`;
  sessionStorage.setItem(storageKey, conversationId);
  return conversationId;
}

export async function askRecipeAgent(
  recipe: Recipe,
  messages: RecipeAgentChatMessage[],
  currentStepIndex?: number
): Promise<RecipeAgentResponse> {
  const endpoint =
    process.env.NEXT_PUBLIC_RECIPE_AGENT_URL?.replace(/\/$/, "") ||
    "/recipe-chef";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Makers-Conversation-Id": getConversationId(recipe.id),
    },
    body: JSON.stringify({
      recipe,
      messages: messages.slice(-10),
      currentStepIndex,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(
      error?.error ||
        (response.status === 404
          ? "菜谱 Agent 尚未启动，请使用 EdgeOne Makers 运行或配置 Agent 地址。"
          : `Agent 暂时不可用（${response.status}）`)
    );
  }

  return response.json() as Promise<RecipeAgentResponse>;
}

