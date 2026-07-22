import type { RecipeSummary } from "@/lib/types";

export interface RecipeFinderChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RecipeFinderRecommendation extends RecipeSummary {
  reason: string;
  matchedIngredients: string[];
}

export type RecipeFinderTraceStatus = "running" | "complete" | "error";
export type RecipeFinderTraceKind = "agent" | "tool" | "rule";

export interface RecipeFinderTraceStep {
  id: string;
  kind: RecipeFinderTraceKind;
  title: string;
  detail: string;
  status: RecipeFinderTraceStatus;
}

export interface RecipeFinderAgentResponse {
  message: string;
  recommendations: RecipeFinderRecommendation[];
  trace: RecipeFinderTraceStep[];
}

function getAgentEndpoint(): string {
  const configuredEndpoint = process.env.NEXT_PUBLIC_RECIPE_FINDER_AGENT_URL?.replace(/\/$/, "");
  return configuredEndpoint || "/recipe-finder";
}

export async function askRecipeFinderAgent(
  messages: RecipeFinderChatMessage[],
  conversationId: string,
  onDelta?: (text: string) => void,
  onTrace?: (step: RecipeFinderTraceStep) => void
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
    const result = (await response.json()) as Omit<RecipeFinderAgentResponse, "trace"> & {
      trace?: RecipeFinderTraceStep[];
    };
    return { ...result, trace: result.trace || [] };
  }
  if (!response.body) throw new Error("选菜 Agent 没有返回可读取的流。");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let message = "";
  let recommendations: RecipeFinderRecommendation[] = [];
  const trace: RecipeFinderTraceStep[] = [];
  let streamError = "";

  const mergeTraceStep = (step: RecipeFinderTraceStep) => {
    const index = trace.findIndex((item) => item.id === step.id);
    if (index >= 0) trace[index] = step;
    else trace.push(step);
    onTrace?.(step);
  };

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
      id?: string;
      kind?: RecipeFinderTraceKind;
      title?: string;
      detail?: string;
      status?: RecipeFinderTraceStatus;
      error?: string;
    };
    if (eventName === "delta" && data.text) {
      message += data.text;
      onDelta?.(data.text);
    } else if (eventName === "complete") {
      recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
    } else if (
      eventName === "trace" &&
      data.id &&
      data.kind &&
      data.title &&
      data.detail &&
      data.status
    ) {
      mergeTraceStep({
        id: data.id,
        kind: data.kind,
        title: data.title,
        detail: data.detail,
        status: data.status,
      });
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

  return { message: message.trim(), recommendations, trace };
}
