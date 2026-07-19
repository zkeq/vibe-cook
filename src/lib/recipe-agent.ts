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

function getAgentEndpoint(): string {
  const configuredEndpoint = process.env.NEXT_PUBLIC_RECIPE_AGENT_URL?.replace(/\/$/, "");
  if (configuredEndpoint) return configuredEndpoint;

  // Makers serves the Web app and agents/* from one public origin. Do not
  // address its internal Next.js, observability, or worker ports directly.
  return "/recipe-chef";
}

export async function askRecipeAgent(
  recipe: Recipe,
  messages: RecipeAgentChatMessage[],
  conversationId: string,
  currentStepIndex?: number,
  onDelta?: (text: string) => void
): Promise<RecipeAgentResponse> {
  const response = await fetch(getAgentEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Makers-Conversation-Id": conversationId,
    },
    body: JSON.stringify({
      recipe,
      messages,
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

  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    return response.json() as Promise<RecipeAgentResponse>;
  }

  if (!response.body) {
    throw new Error("Agent 没有返回可读取的流。");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let message = "";
  let suggestions: RecipeAgentSuggestion[] = [];
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
      suggestions?: RecipeAgentSuggestion[];
      error?: string;
    };
    if (eventName === "delta" && data.text) {
      message += data.text;
      onDelta?.(data.text);
    } else if (eventName === "complete") {
      suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    } else if (eventName === "error") {
      streamError = data.error || "Agent 流式回复中断。";
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

  return { message: message.trim(), suggestions };
}
