import type { RecipeSummary } from "@/lib/types";

export interface RecipeFinderChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RecipeFinderRecommendation extends RecipeSummary {
  reason: string;
  matchedIngredients: string[];
}

export interface RecipeFinderAgentResponse {
  message: string;
  recommendations: RecipeFinderRecommendation[];
}

function getAgentEndpoint(): string {
  const configuredEndpoint = process.env.NEXT_PUBLIC_RECIPE_FINDER_AGENT_URL?.replace(/\/$/, "");
  return configuredEndpoint || "/recipe-finder";
}

export async function askRecipeFinderAgent(
  messages: RecipeFinderChatMessage[],
  conversationId: string,
  onDelta?: (text: string) => void
): Promise<RecipeFinderAgentResponse> {
  const response = await fetch(getAgentEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Makers-Conversation-Id": conversationId,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      error?.error ||
        (response.status === 404
          ? "选菜 Agent 尚未启动，请使用 EdgeOne Makers 运行项目。"
          : `选菜 Agent 暂时不可用（${response.status}）`)
    );
  }
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    return response.json() as Promise<RecipeFinderAgentResponse>;
  }
  if (!response.body) throw new Error("选菜 Agent 没有返回可读取的流。");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let message = "";
  let recommendations: RecipeFinderRecommendation[] = [];
  let streamError = "";

  const processEvent = (eventBlock: string) => {
    const eventName = eventBlock
      .split(/\r?\n/)
      .find((line) => line.startsWith("event:"))
      ?.slice(6)
      .trim();
    const dataText = eventBlock
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!eventName || !dataText) return;

    const data = JSON.parse(dataText) as {
      text?: string;
      recommendations?: RecipeFinderRecommendation[];
      error?: string;
    };
    if (eventName === "delta" && data.text) {
      message += data.text;
      onDelta?.(data.text);
    } else if (eventName === "complete") {
      recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
    } else if (eventName === "error") {
      streamError = data.error || "选菜 Agent 流式回复中断。";
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const eventBlocks = buffer.split(/\r?\n\r?\n/);
    buffer = eventBlocks.pop() || "";
    eventBlocks.forEach(processEvent);
    if (done) break;
  }
  if (buffer.trim()) processEvent(buffer);
  if (streamError) throw new Error(streamError);

  return { message: message.trim(), recommendations };
}
