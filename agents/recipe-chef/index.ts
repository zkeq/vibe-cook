import type { Recipe } from "../../src/lib/types";

interface AgentContext {
  request: Request & { body?: unknown };
  env: Record<string, string | undefined>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentRequestBody {
  recipe?: Recipe;
  messages?: ChatMessage[];
  currentStepIndex?: number;
}

interface ModelErrorResponse {
  error?: { message?: string };
}

interface ModelStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
  }>;
}

interface SuggestedChange {
  stepIndex: number;
  reason: string;
  instruction?: string;
  tips: string[];
}

const SUGGESTIONS_MARKER = "@@VIBE_COOK_SUGGESTIONS@@";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Makers-Conversation-Id",
    },
  });
}

async function readRequestBody(request: AgentContext["request"]): Promise<AgentRequestBody> {
  if (request.body !== undefined && request.body !== null) {
    if (typeof request.body === "string") {
      return JSON.parse(request.body) as AgentRequestBody;
    }
    return request.body as AgentRequestBody;
  }

  return (await request.json()) as AgentRequestBody;
}

function extractSuggestions(content: string, stepCount: number): SuggestedChange[] {
  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];
  try {
    const parsed = JSON.parse(arrayMatch[0]) as unknown;
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (item): item is SuggestedChange =>
              Number.isInteger(item?.stepIndex) &&
              item.stepIndex >= 0 &&
              item.stepIndex < stepCount &&
              (Array.isArray(item.tips) || typeof item.instruction === "string")
          )
          .map((item) => ({
            stepIndex: item.stepIndex,
            reason: typeof item.reason === "string" ? item.reason : "",
            instruction:
              typeof item.instruction === "string" && item.instruction.trim()
                ? item.instruction.trim()
                : undefined,
            tips: (Array.isArray(item.tips) ? item.tips : [])
              .filter((tip): tip is string => typeof tip === "string" && tip.trim().length > 0)
              .map((tip) => tip.trim())
              .slice(0, 3),
          }))
          .filter((item) => item.instruction || item.tips.length > 0)
      : [];
  } catch {
    return [];
  }
}

function streamEvent(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function onRequest(context: AgentContext): Promise<Response> {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Makers-Conversation-Id",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (context.request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = context.env.AI_GATEWAY_API_KEY;
  const baseUrl = (context.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.edgeone.link/v1").replace(/\/$/, "");
  const model = context.env.AI_GATEWAY_MODEL || "@makers/deepseek-v4-flash";
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          "Makers Agent 尚未获得内置模型凭据。请使用新版 EdgeOne CLI 关联 Agents 项目并同步 AI Gateway 环境；无需在 Functions 页面手动填写 AI_GATEWAY_API_KEY。",
      },
      503
    );
  }

  let body: AgentRequestBody;
  try {
    body = await readRequestBody(context.request);
  } catch {
    return jsonResponse({ error: "请求内容不是有效 JSON。" }, 400);
  }

  const recipe = body.recipe;
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!recipe || !recipe.title || !Array.isArray(recipe.steps) || messages.length === 0) {
    return jsonResponse({ error: "缺少菜谱或对话内容。" }, 422);
  }

  const recipeContext = {
    title: recipe.title,
    summary: recipe.summary,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    tools: recipe.tools,
    steps: recipe.steps.map((step, stepIndex) => ({
      stepIndex,
      title: step.title,
      instruction: step.instruction,
      duration_sec: step.duration_sec,
      tips: step.tips || [],
    })),
    currentStepIndex: body.currentStepIndex,
  };

  const systemPrompt = `你是 Vibe Cook 的中式烹饪主厨 Agent，擅长用容易理解的中文讲清火候、时机、用量与风味变化。你必须结合用户当前菜谱给出实用、具体、食品安全的建议。

你的回答有两层：
1. 先给用户一份完整的 Markdown 主厨解答，不能只为了修改菜谱而简略回答。
2. 再把要写入菜谱的改动准确关联到已有步骤。不要新造不存在的步骤。凡是用量、火候、时长或做法有变化的步骤，必须给出改写后的完整指令 instruction，它会直接替换原指令并在烹饪模式朗读给用户听；只是补充注意事项、原指令不变时才只给 tips。

正文要求：
- 通常写 400–700 个中文字，根据问题复杂度调整，但不要只回答一两句。
- 使用 3–4 个有信息量的 Markdown 小节，可使用标题、粗体、列表和必要的用量。
- 先明确给出结论，再解释原理、操作顺序、口感变化和失败风险。避免空话和重复菜谱。

输出协议必须严格按以下顺序：
1. 直接输出 Markdown 正文，不要用代码块包裹。
2. 正文结束后单独输出一行 ${SUGGESTIONS_MARKER}
3. 紧接着输出 JSON 数组，不要用代码块：
[{"stepIndex":0,"reason":"为什么改这一步","instruction":"改写后的完整步骤指令","tips":["补充提示"]}]

约束：stepIndex 从 0 开始；instruction 是改动后这一步完整、可直接照做的一到两句话，写明新的用量、火候和时长（如「放入 200g 肉末，大火翻炒 1 分钟至变色」），不要写「改为」「原来是」这类对比说法，也不要用括号、表情和 Markdown，因为会被朗读；指令不变时省略 instruction；tips 可为空数组，每条单独可执行，每步最多 3 条，不要重复 instruction 已经写明的内容；无需修改步骤时输出 []；不要声称已经替用户修改页面。

当前菜谱：${JSON.stringify(recipeContext)}`;

  try {
    const modelResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
      signal: context.request.signal,
    });
    if (!modelResponse.ok) {
      const result = (await modelResponse.json().catch(() => null)) as ModelErrorResponse | null;
      return jsonResponse(
        { error: result?.error?.message || `模型请求失败（${modelResponse.status}）` },
        502
      );
    }
    if (!modelResponse.body) {
      return jsonResponse({ error: "模型没有返回有效内容。" }, 502);
    }

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = modelResponse.body!.getReader();
        const decoder = new TextDecoder();
        let upstreamBuffer = "";
        let protocolBuffer = "";
        let suggestionsBuffer = "";
        let markerFound = false;

        const emitAnswer = (text: string) => {
          if (text) controller.enqueue(streamEvent("delta", { text }));
        };

        const processProtocolText = (text: string, flush = false) => {
          if (markerFound) {
            suggestionsBuffer += text;
            return;
          }

          protocolBuffer += text;
          const markerIndex = protocolBuffer.indexOf(SUGGESTIONS_MARKER);
          if (markerIndex >= 0) {
            emitAnswer(protocolBuffer.slice(0, markerIndex).trimEnd());
            suggestionsBuffer += protocolBuffer.slice(markerIndex + SUGGESTIONS_MARKER.length);
            protocolBuffer = "";
            markerFound = true;
            return;
          }

          const safeLength = flush
            ? protocolBuffer.length
            : Math.max(0, protocolBuffer.length - SUGGESTIONS_MARKER.length + 1);
          if (safeLength > 0) {
            emitAnswer(protocolBuffer.slice(0, safeLength));
            protocolBuffer = protocolBuffer.slice(safeLength);
          }
        };

        const processUpstreamEvent = (eventBlock: string) => {
          const data = eventBlock
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart())
            .join("\n");
          if (!data || data === "[DONE]") return;

          try {
            const chunk = JSON.parse(data) as ModelStreamChunk;
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) processProtocolText(text);
          } catch {
            // Ignore malformed upstream heartbeat frames.
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            upstreamBuffer += decoder.decode(value, { stream: !done });
            const eventBlocks = upstreamBuffer.split(/\r?\n\r?\n/);
            upstreamBuffer = eventBlocks.pop() || "";
            eventBlocks.forEach(processUpstreamEvent);
            if (done) break;
          }
          if (upstreamBuffer.trim()) processUpstreamEvent(upstreamBuffer);
          processProtocolText("", true);

          controller.enqueue(
            streamEvent("complete", {
              suggestions: markerFound
                ? extractSuggestions(suggestionsBuffer, recipe.steps.length)
                : [],
            })
          );
        } catch (error) {
          controller.enqueue(
            streamEvent("error", {
              error: error instanceof Error ? error.message : "Agent 流式回复中断。",
            })
          );
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Makers-Conversation-Id",
      },
    });
  } catch (error) {
    if (context.request.signal.aborted) {
      return jsonResponse({ error: "本次对话已取消。" }, 499);
    }
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Agent 执行失败。" },
      500
    );
  }
}
