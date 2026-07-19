import type { Recipe } from "../../src/lib/types";

interface AgentContext {
  request: Request;
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

interface ModelResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

interface SuggestedChange {
  stepIndex: number;
  reason: string;
  tips: string[];
}

interface StructuredAnswer {
  message: string;
  suggestions: SuggestedChange[];
}

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

function extractStructuredAnswer(content: string, stepCount: number): StructuredAnswer {
  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    return { message: content, suggestions: [] };
  }

  try {
    const parsed = JSON.parse(objectMatch[0]) as Partial<StructuredAnswer>;
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter(
            (item): item is SuggestedChange =>
              Number.isInteger(item?.stepIndex) &&
              item.stepIndex >= 0 &&
              item.stepIndex < stepCount &&
              Array.isArray(item.tips)
          )
          .map((item) => ({
            stepIndex: item.stepIndex,
            reason: typeof item.reason === "string" ? item.reason : "",
            tips: item.tips
              .filter((tip): tip is string => typeof tip === "string" && tip.trim().length > 0)
              .map((tip) => tip.trim())
              .slice(0, 3),
          }))
          .filter((item) => item.tips.length > 0)
      : [];

    return {
      message:
        typeof parsed.message === "string" && parsed.message.trim()
          ? parsed.message.trim()
          : "我已经结合当前菜谱整理了可应用的调整建议。",
      suggestions,
    };
  } catch {
    return { message: content, suggestions: [] };
  }
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
    return jsonResponse({ error: "Agent 缺少 AI_GATEWAY_API_KEY 环境变量。" }, 503);
  }

  let body: AgentRequestBody;
  try {
    body = (await context.request.json()) as AgentRequestBody;
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

  const systemPrompt = `你是 Vibe Cook 的中式烹饪主厨 Agent。你必须只基于用户当前菜谱给出实用、具体、食品安全的建议。

你的任务有两部分：
1. 用简洁中文回答问题，说明调整会带来什么效果及关键风险。
2. 如果建议适合写入菜谱，把它拆成可执行 tips，并准确关联到已有步骤。不要新造不存在的步骤，不要改写原指令。

输出必须是单个 JSON 对象，不能使用 Markdown 代码块，格式严格如下：
{"message":"给用户的回答","suggestions":[{"stepIndex":0,"reason":"为什么关联这一步","tips":["可直接加入页面的具体提示"]}]}

约束：stepIndex 从 0 开始；每条 tip 单独可执行，包含必要的用量、时机或火候；每步最多 3 条；无须修改步骤时 suggestions 返回空数组；不要声称已经替用户修改页面。

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
        temperature: 0.25,
        max_tokens: 1200,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
      }),
      signal: context.request.signal,
    });
    const result = (await modelResponse.json()) as ModelResponse;
    if (!modelResponse.ok) {
      return jsonResponse(
        { error: result.error?.message || `模型请求失败（${modelResponse.status}）` },
        502
      );
    }

    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return jsonResponse({ error: "模型没有返回有效内容。" }, 502);
    }

    return jsonResponse(extractStructuredAnswer(content, recipe.steps.length));
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
