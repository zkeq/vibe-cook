import { afterEach, expect, it, vi } from "vitest";
import { OPTIONS, POST } from "../../src/app/api/client/[agent]/route";

afterEach(() => vi.unstubAllGlobals());

it("allows browser preflight without a conversation header", () => {
  const response = OPTIONS();
  expect(response.status).toBe(204);
  expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Makers-Conversation-Id");
});

it("delivers the first AI chunk while the upstream response is still open", async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
  const fetch = vi.fn(async () => new Response(stream, { headers: { "Content-Type": "text/event-stream" } }));
  vi.stubGlobal("fetch", fetch);
  const response = await POST(new Request("https://cook.corerevive.cn/api/client/recipe-chef", {
    method: "POST", headers: { "Makers-Conversation-Id": "client-stream-test" }, body: '{"messages":[]}',
  }), { params: Promise.resolve({ agent: "recipe-chef" }) });
  const reader = response.body!.getReader();
  controller.enqueue(new TextEncoder().encode('event: delta\ndata: {"text":"第一段"}\n\n'));
  const first = await reader.read();
  expect(new TextDecoder().decode(first.value)).toContain("第一段");
  expect(first.done).toBe(false);
  controller.close();
  await reader.cancel();
  expect(fetch).toHaveBeenCalledWith("https://cook.corerevive.cn/recipe-chef", expect.objectContaining({ headers: { "Content-Type": "application/json", "Makers-Conversation-Id": "client-stream-test" } }));
});

it("rejects arbitrary proxy destinations", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const response = await POST(new Request("https://cook.corerevive.cn/api/client/other", { method: "POST" }), { params: Promise.resolve({ agent: "other" }) });
  expect(response.status).toBe(404);
  expect(fetch).not.toHaveBeenCalled();
});
