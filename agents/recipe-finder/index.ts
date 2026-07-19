import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
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

interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string | null;
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

interface RecipeSearchPlan extends RecipeSearchArgs {
  action: "search" | "clarify";
  question?: string;
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
const DSML_TOOL_CALLS_START = "<｜｜DSML｜｜tool_calls>";
const DSML_TOOL_CALLS_END = "</｜｜DSML｜｜tool_calls>";

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
  return new Promise<T>((resolve, reject) => {
    const requestTransport = new URL(url).protocol === "http:" ? httpRequest : httpsRequest;
    const request = requestTransport(
      url,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          const status = response.statusCode || 500;
          if (status < 200 || status >= 300) {
            reject(new Error(`菜谱 API 请求失败（${status}）`));
            return;
          }
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as T);
          } catch {
            reject(new Error("菜谱 API 返回了无效 JSON"));
          }
        });
      }
    );

    request.setTimeout(30_000, () => {
      request.destroy(new Error("菜谱 API 连接超时（30 秒）"));
    });
    request.on("error", (error) => reject(error));
    request.end();
  });
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

function parseSearchPlan(content: string | null | undefined): RecipeSearchPlan | null {
  if (!content) return null;
  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (!objectMatch) return null;

  try {
    const parsed = JSON.parse(objectMatch[0]) as Record<string, unknown>;
    const args = parseToolArguments(JSON.stringify(parsed));
    return {
      ...args,
      action: parsed.action === "clarify" ? "clarify" : "search",
      question: typeof parsed.question === "string" ? parsed.question.trim() : undefined,
    };
  } catch {
    return null;
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
    context.env.RECIPE_API_BASE_URL || "http://cook-api.corerevive.cn/api/v1"
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

  const plannerPrompt = `你是 Vibe Cook 的菜谱检索规划器。你只负责把完整对话转换成一次检索计划，不回答用户，不调用任何工具，不输出 DSML 或 XML。

只输出一个合法 JSON 对象，不使用 Markdown：
{"action":"search","query":"","ingredients":[],"category":"","maxDifficulty":3,"maxMinutes":60,"limit":6,"question":""}

规则：
- 用户明确要求推荐时应使用 search，不要因为缺少食材而反复追问。例如“我是新手，推荐几道菜”已经足够检索。
- 用户说自己是新手时 maxDifficulty 设为 2；普通家常菜最多设为 3。
- ingredients 只放用户明确拥有或想用的主要食材，每项一个名称。
- query 只放明确的菜名、口味或场景关键词；不要把“新手”“家常”“好做”放进 query，这些由难度筛选处理。
- maxMinutes 仅在用户明确提出时间限制时填写，否则省略。
- 只有用户既没有要求推荐、也没有提供任何可执行方向时才用 clarify，并在 question 中只追问一个问题。`;

  const finalPrompt = `你是 Vibe Cook 首页的选菜主厨。服务端已经替你完成了菜谱检索，你不能调用工具，也绝对不能输出 DSML、tool_calls、invoke 标签或内部参数。

工作规则：
- 如果收到“菜谱数据库候选”，从中推荐 2–4 道最合适的菜，只能使用候选中的 recipeId。
- 优先选择用户已有食材覆盖率高、难度低、耗时短的菜，并说明各自区别。
- 如果收到“需要继续追问”，自然地只问一个最关键的问题。
- 不要声称数据库连接失败；真正的查询错误会由服务端直接处理。

最终回复协议：
1. 先输出自然、清楚的 Markdown 回复。
2. 末尾单独输出一行 ${RECOMMENDATIONS_MARKER}
3. 随后输出 JSON 数组，不使用代码块：
[{"recipeId":"候选中的 ID","reason":"推荐原因","matchedIngredients":["已匹配食材"]}]
4. 追问时数组输出 []。`;

  const recipeCatalog = new Map<string, RecipeToolResult>();

  try {
    const planningResponse = await fetch(`${modelBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        stream: false,
        messages: [
          { role: "system", content: plannerPrompt },
          ...messages.map((message) => ({ role: message.role, content: message.content })),
        ],
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

    const conversationText = messages.map((message) => message.content).join("\n");
    const plan = parseSearchPlan(planningResult?.choices?.[0]?.message?.content) || {
      action: "search" as const,
      ingredients: [],
      maxDifficulty: /新手|不会做|零基础/.test(conversationText) ? 2 : 3,
      limit: 6,
    };
    const finalMessages: ModelMessage[] = [
      { role: "system", content: finalPrompt },
      ...messages.map((message) => ({ role: message.role, content: message.content })),
    ];

    if (plan.action === "clarify") {
      finalMessages.push({
        role: "system",
        content: `需要继续追问：${plan.question || "请询问用户手头的主要食材或想吃的口味。"}`,
      });
    } else {
      let recipes: RecipeToolResult[];
      try {
        recipes = await searchRecipes(plan, recipeApiBase, context.request.signal);
        if (recipes.length === 0 && plan.maxDifficulty === 2) {
          recipes = await searchRecipes(
            { ...plan, maxDifficulty: 3 },
            recipeApiBase,
            context.request.signal
          );
        }
      } catch (error) {
        return jsonResponse(
          {
            error:
              error instanceof Error
                ? `菜谱查询失败：${error.message}`
                : "菜谱查询失败，请稍后重试。",
          },
          502
        );
      }

      recipes.forEach((recipe) => recipeCatalog.set(recipe.id, recipe));
      finalMessages.push({
        role: "system",
        content: `菜谱数据库候选（共 ${recipes.length} 条）：${JSON.stringify(
          recipes.map((recipe) => ({ ...recipe, cover_image: undefined }))
        )}`,
      });
    }

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
        messages: finalMessages,
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
        let filteringDsml = false;

        const emitAnswer = (text: string) => {
          if (text) controller.enqueue(streamEvent("delta", { text }));
        };
        const processProtocolText = (text: string, flush = false) => {
          if (markerFound) {
            recommendationsBuffer += text;
            return;
          }
          protocolBuffer += text;

          while (protocolBuffer) {
            if (filteringDsml) {
              const dsmlEndIndex = protocolBuffer.indexOf(DSML_TOOL_CALLS_END);
              if (dsmlEndIndex < 0) {
                protocolBuffer = flush
                  ? ""
                  : protocolBuffer.slice(
                      Math.max(0, protocolBuffer.length - DSML_TOOL_CALLS_END.length + 1)
                    );
                return;
              }
              protocolBuffer = protocolBuffer.slice(
                dsmlEndIndex + DSML_TOOL_CALLS_END.length
              );
              filteringDsml = false;
              continue;
            }

            const markerIndex = protocolBuffer.indexOf(RECOMMENDATIONS_MARKER);
            const dsmlStartIndex = protocolBuffer.indexOf(DSML_TOOL_CALLS_START);
            if (dsmlStartIndex >= 0 && (markerIndex < 0 || dsmlStartIndex < markerIndex)) {
              emitAnswer(protocolBuffer.slice(0, dsmlStartIndex).trimEnd());
              protocolBuffer = protocolBuffer.slice(
                dsmlStartIndex + DSML_TOOL_CALLS_START.length
              );
              filteringDsml = true;
              continue;
            }
            if (markerIndex >= 0) {
              emitAnswer(protocolBuffer.slice(0, markerIndex).trimEnd());
              recommendationsBuffer += protocolBuffer.slice(
                markerIndex + RECOMMENDATIONS_MARKER.length
              );
              protocolBuffer = "";
              markerFound = true;
              return;
            }

            const protectedLength = Math.max(
              RECOMMENDATIONS_MARKER.length,
              DSML_TOOL_CALLS_START.length
            );
            const safeLength = flush
              ? protocolBuffer.length
              : Math.max(0, protocolBuffer.length - protectedLength + 1);
            if (safeLength <= 0) return;
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
