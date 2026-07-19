import type { Recipe, RecipeSummary } from "../../src/lib/types";

interface AgentContext {
  request: Request & { body?: unknown };
  env: Record<string, string | undefined>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentRequestBody {
  messages?: ChatMessage[];
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ModelMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

interface ModelResponse {
  choices?: Array<{
    message?: ModelMessage;
  }>;
  error?: { message?: string };
}

interface ModelStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
  }>;
}

interface RecipeSearchArgs {
  query?: string;
  ingredients?: string[];
  category?: string;
  maxDifficulty?: number;
  maxMinutes?: number;
  limit?: number;
}

interface RecipeToolResult extends RecipeSummary {
  ingredients: string[];
  matchedIngredients: string[];
  tools: string[];
}

interface RecommendationSpec {
  recipeId: string;
  reason: string;
  matchedIngredients?: string[];
}

export interface FinderRecommendation extends RecipeSummary {
  reason: string;
  matchedIngredients: string[];
}

const RECOMMENDATIONS_MARKER = "@@VIBE_COOK_RECOMMENDATIONS@@";

const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "search_recipes",
    description:
      "查询 Vibe Cook 的真实菜谱数据库。可按现有食材、关键词、分类、难度和耗时筛选。推荐任何菜之前必须调用此工具。",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "菜名、口味、场景或关键词，例如下饭、清淡、面食",
        },
        ingredients: {
          type: "array",
          items: { type: "string" },
          description: "用户手头已有的主要食材名称",
        },
        category: {
          type: "string",
          description: "可选菜谱分类，例如荤菜、素菜、主食、早餐、水产",
        },
        maxDifficulty: {
          type: "integer",
          minimum: 1,
          maximum: 5,
          description: "最高难度。明确是新手时使用 2，普通家常水平使用 3",
        },
        maxMinutes: {
          type: "integer",
          minimum: 5,
          maximum: 300,
          description: "用户可接受的最长制作时间（分钟）",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 8,
          description: "返回候选数量，通常取 6",
        },
      },
      additionalProperties: false,
    },
  },
};

function responseHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Makers-Conversation-Id",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders("application/json; charset=utf-8"),
  });
}

function streamEvent(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function readRequestBody(request: AgentContext["request"]): Promise<AgentRequestBody> {
  if (request.body !== undefined && request.body !== null) {
    return typeof request.body === "string"
      ? (JSON.parse(request.body) as AgentRequestBody)
      : (request.body as AgentRequestBody);
  }
  return (await request.json()) as AgentRequestBody;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`菜谱 API 请求失败（${response.status}）`);
  }
  return response.json() as Promise<T>;
}

function toSummary(recipe: Recipe): RecipeSummary {
  return {
    id: recipe.id,
    title: recipe.title,
    summary: recipe.summary,
    category: recipe.category,
    cover_image: recipe.cover_image,
    difficulty: recipe.difficulty,
    calories: recipe.calories,
    duration_min: recipe.duration_min,
    tags: recipe.tags,
    steps_count: recipe.steps.length,
  };
}

function parseToolArguments(value: string): RecipeSearchArgs {
  try {
    const parsed = JSON.parse(value) as RecipeSearchArgs;
    return {
      query: typeof parsed.query === "string" ? parsed.query.trim() : undefined,
      ingredients: Array.isArray(parsed.ingredients)
        ? parsed.ingredients
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 10)
        : [],
      category: typeof parsed.category === "string" ? parsed.category.trim() : undefined,
      maxDifficulty:
        typeof parsed.maxDifficulty === "number"
          ? Math.min(5, Math.max(1, Math.round(parsed.maxDifficulty)))
          : undefined,
      maxMinutes:
        typeof parsed.maxMinutes === "number"
          ? Math.min(300, Math.max(5, Math.round(parsed.maxMinutes)))
          : undefined,
      limit:
        typeof parsed.limit === "number"
          ? Math.min(8, Math.max(1, Math.round(parsed.limit)))
          : 6,
    };
  } catch {
    return { ingredients: [], limit: 6 };
  }
}

async function searchRecipes(
  args: RecipeSearchArgs,
  apiBase: string,
  signal: AbortSignal
): Promise<RecipeToolResult[]> {
  const ingredients = args.ingredients || [];
  const terms = ingredients.length > 0 ? ingredients : args.query ? [args.query] : [];
  let summaries: RecipeSummary[] = [];

  if (terms.length > 0) {
    const results = await Promise.all(
      terms.map((term) =>
        fetchJson<{ data: RecipeSummary[] }>(
          `${apiBase}/recipes/search?q=${encodeURIComponent(term)}`,
          signal
        )
      )
    );
    const byId = new Map<string, RecipeSummary>();
    results.flatMap((result) => result.data || []).forEach((recipe) => byId.set(recipe.id, recipe));
    summaries = [...byId.values()];
  } else {
    const query = new URLSearchParams({ page: "1", limit: "100" });
    if (args.category) query.set("category", args.category);
    const result = await fetchJson<{ data: RecipeSummary[] }>(
      `${apiBase}/recipes?${query.toString()}`,
      signal
    );
    summaries = result.data || [];
  }

  summaries = summaries
    .filter((recipe) => !args.category || recipe.category === args.category)
    .filter(
      (recipe) =>
        !args.maxDifficulty ||
        !recipe.difficulty ||
        recipe.difficulty <= args.maxDifficulty
    )
    .filter(
      (recipe) =>
        !args.maxMinutes || !recipe.duration_min || recipe.duration_min <= args.maxMinutes
    )
    .slice(0, 40);

  const details = await Promise.all(
    summaries.map(async (summary) => {
      try {
        return await fetchJson<Recipe>(`${apiBase}/recipes/${encodeURIComponent(summary.id)}`, signal);
      } catch {
        return null;
      }
    })
  );

  const normalizedIngredients = ingredients.map((ingredient) => ingredient.toLowerCase());
  const ranked = summaries.map((summary, index) => {
    const detail = details[index];
    const ingredientNames = (detail?.ingredients || []).map((ingredient) => ingredient.name);
    const searchableIngredients = ingredientNames.map((ingredient) => ingredient.toLowerCase());
    const matchedIngredients = ingredients.filter((_, ingredientIndex) =>
      searchableIngredients.some((name) => name.includes(normalizedIngredients[ingredientIndex]))
    );
    const matchScore = ingredients.length > 0 ? matchedIngredients.length / ingredients.length : 0;
    const difficultyScore = 6 - (summary.difficulty || 3);
    const durationScore = Math.max(0, 90 - (summary.duration_min || 60)) / 30;

    return {
      ...(detail ? toSummary(detail) : summary),
      ingredients: ingredientNames,
      matchedIngredients,
      tools: detail?.tools || [],
      score: matchScore * 10 + difficultyScore + durationScore,
    };
  });

  return ranked
    .filter((recipe) => ingredients.length === 0 || recipe.matchedIngredients.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, args.limit || 6)
    .map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      summary: recipe.summary,
      category: recipe.category,
      cover_image: recipe.cover_image,
      difficulty: recipe.difficulty,
      calories: recipe.calories,
      duration_min: recipe.duration_min,
      tags: recipe.tags,
      steps_count: recipe.steps_count,
      ingredients: recipe.ingredients,
      matchedIngredients: recipe.matchedIngredients,
      tools: recipe.tools,
    }));
}

function extractRecommendations(
  value: string,
  catalog: Map<string, RecipeToolResult>
): FinderRecommendation[] {
  const arrayMatch = value.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];

  try {
    const parsed = JSON.parse(arrayMatch[0]) as RecommendationSpec[];
    if (!Array.isArray(parsed)) return [];

    const recommendations: FinderRecommendation[] = [];
    parsed.forEach((item) => {
      const recipe = catalog.get(item.recipeId);
      if (recipe) {
        recommendations.push({
          id: recipe.id,
          title: recipe.title,
          summary: recipe.summary,
          category: recipe.category,
          cover_image: recipe.cover_image,
          difficulty: recipe.difficulty,
          calories: recipe.calories,
          duration_min: recipe.duration_min,
          tags: recipe.tags,
          steps_count: recipe.steps_count,
          reason: typeof item.reason === "string" ? item.reason.trim() : "符合你的条件",
          matchedIngredients: Array.isArray(item.matchedIngredients)
            ? item.matchedIngredients.filter(
                (ingredient): ingredient is string => typeof ingredient === "string"
              )
            : recipe.matchedIngredients,
        });
      }
    });
    return recommendations.slice(0, 4);
  } catch {
    return [];
  }
}

export async function onRequest(context: AgentContext): Promise<Response> {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...responseHeaders("text/plain"),
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  if (context.request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = context.env.AI_GATEWAY_API_KEY;
  const modelBase = (context.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.edgeone.link/v1").replace(
    /\/$/,
    ""
  );
  const model = context.env.AI_GATEWAY_MODEL || "@makers/deepseek-v4-flash";
  const recipeApiBase = (
    context.env.RECIPE_API_BASE_URL || "https://cook-api.corerevive.cn/api/v1"
  ).replace(/\/$/, "");

  if (!apiKey) {
    return jsonResponse({ error: "首页选菜 Agent 缺少 AI_GATEWAY_API_KEY 环境变量。" }, 503);
  }

  let body: AgentRequestBody;
  try {
    body = await readRequestBody(context.request);
  } catch {
    return jsonResponse({ error: "请求内容不是有效 JSON。" }, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return jsonResponse({ error: "缺少对话内容。" }, 422);
  }

  const systemPrompt = `你是 Vibe Cook 首页的选菜主厨 Agent。你的目标不是泛泛推荐，而是通过多轮对话理解用户的厨艺、现有食材、人数、口味和可用时间，再从真实菜谱数据库中选出最适合现在做的菜。

工作规则：
- 用户条件足够时，必须调用 search_recipes 查询数据库；禁止推荐工具未返回的菜。
- 用户说自己是新手时，将 maxDifficulty 设为 2；如果结果太少，可以说明原因后放宽到 3。
- 用户给出现有食材时，把主要食材逐项传给 ingredients；优先选择食材覆盖率高、额外采购少的菜。
- 如果信息过于模糊，先只追问一个最能缩小范围的问题，不要一次盘问很多项。
- 已经能给出合理候选时不要继续追问。通常推荐 2–4 道，并清楚说明为什么适合。
- 不展示内部工具、参数、JSON 或思考过程。

最终回复协议：
1. 先输出自然、简洁的 Markdown 回复。追问时通常 1–3 句；推荐时说明判断依据和选择差异。
2. 末尾单独输出一行 ${RECOMMENDATIONS_MARKER}
3. 随后输出 JSON 数组，不使用代码块：
[{"recipeId":"数据库返回的 ID","reason":"推荐原因","matchedIngredients":["已匹配食材"]}]
4. 如果当前只需追问，数组输出 []。`;

  const planningMessages: ModelMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ];
  const recipeCatalog = new Map<string, RecipeToolResult>();

  try {
    for (let iteration = 0; iteration < 3; iteration += 1) {
      const planningResponse = await fetch(`${modelBase}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          stream: false,
          messages: planningMessages,
          tools: [SEARCH_TOOL],
          tool_choice: "auto",
        }),
        signal: context.request.signal,
      });

      const planningResult = (await planningResponse.json().catch(() => null)) as ModelResponse | null;
      if (!planningResponse.ok) {
        return jsonResponse(
          { error: planningResult?.error?.message || `模型规划失败（${planningResponse.status}）` },
          502
        );
      }

      const assistantMessage = planningResult?.choices?.[0]?.message;
      const toolCalls = assistantMessage?.tool_calls || [];
      if (toolCalls.length === 0) break;

      planningMessages.push({
        role: "assistant",
        content: assistantMessage?.content || null,
        tool_calls: toolCalls,
      });

      for (const toolCall of toolCalls) {
        if (toolCall.function.name !== "search_recipes") continue;
        try {
          const args = parseToolArguments(toolCall.function.arguments);
          const recipes = await searchRecipes(args, recipeApiBase, context.request.signal);
          recipes.forEach((recipe) => recipeCatalog.set(recipe.id, recipe));
          planningMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              count: recipes.length,
              recipes: recipes.map((recipe) => ({
                ...recipe,
                cover_image: undefined,
              })),
            }),
          });
        } catch (error) {
          planningMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: error instanceof Error ? error.message : "菜谱查询失败",
              recipes: [],
            }),
          });
        }
      }
    }

    planningMessages.push({
      role: "system",
      content:
        "现在直接面向用户给出最终回复，并严格遵守 Markdown + 推荐标记 + JSON 数组的输出协议。只能使用工具结果中的 recipeId。",
    });

    const modelResponse = await fetch(`${modelBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        stream: true,
        messages: planningMessages,
      }),
      signal: context.request.signal,
    });

    if (!modelResponse.ok) {
      const result = (await modelResponse.json().catch(() => null)) as ModelResponse | null;
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
        let recommendationsBuffer = "";
        let markerFound = false;

        const emitAnswer = (text: string) => {
          if (text) controller.enqueue(streamEvent("delta", { text }));
        };
        const processProtocolText = (text: string, flush = false) => {
          if (markerFound) {
            recommendationsBuffer += text;
            return;
          }
          protocolBuffer += text;
          const markerIndex = protocolBuffer.indexOf(RECOMMENDATIONS_MARKER);
          if (markerIndex >= 0) {
            emitAnswer(protocolBuffer.slice(0, markerIndex).trimEnd());
            recommendationsBuffer += protocolBuffer.slice(
              markerIndex + RECOMMENDATIONS_MARKER.length
            );
            protocolBuffer = "";
            markerFound = true;
            return;
          }
          const safeLength = flush
            ? protocolBuffer.length
            : Math.max(0, protocolBuffer.length - RECOMMENDATIONS_MARKER.length + 1);
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
              recommendations: markerFound
                ? extractRecommendations(recommendationsBuffer, recipeCatalog)
                : [],
            })
          );
        } catch (error) {
          controller.enqueue(
            streamEvent("error", {
              error: error instanceof Error ? error.message : "选菜 Agent 流式回复中断。",
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
        ...responseHeaders("text/event-stream; charset=utf-8"),
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    if (context.request.signal.aborted) {
      return jsonResponse({ error: "本次选菜对话已取消。" }, 499);
    }
    return jsonResponse(
      { error: error instanceof Error ? error.message : "选菜 Agent 暂时不可用。" },
      500
    );
  }
}
