const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Makers-Conversation-Id",
  "Access-Control-Max-Age": "86400",
};

export const maxDuration = 300;

export function OPTIONS() {
  // This page route runs outside Makers' agent gateway, which requires a
  // conversation header even on preflight requests sent by the browser.
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request, { params }: { params: Promise<{ agent: string }> }) {
  const { agent } = await params;
  if (agent !== "recipe-chef" && agent !== "recipe-finder") {
    return Response.json({ error: "Unknown agent" }, { status: 404, headers: corsHeaders });
  }
  const conversationId = request.headers.get("Makers-Conversation-Id") || "";
  if (!/^[0-9a-zA-Z_.-]{6,36}$/.test(conversationId)) {
    return Response.json({ error: "Invalid conversation ID" }, { status: 400, headers: corsHeaders });
  }
  try {
    const response = await fetch(`https://cook.corerevive.cn/${agent}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Makers-Conversation-Id": conversationId },
      body: await request.text(),
      signal: request.signal,
      cache: "no-store",
    });
    // Pass the original stream through; never call text/json on the response.
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return Response.json({ error: "AI 服务连接失败，请稍后重试。" }, { status: 502, headers: corsHeaders });
  }
}
