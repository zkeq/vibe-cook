import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { fetch as desktopFetch } from "@mygo-plugins/fetch";
import { isMyGo } from "mygo-runtime";

/** EdgeOne rejects CORS preflight without a conversation ID; native HTTP avoids it. */
export async function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isMyGo()) return desktopFetch(input, init);
  if (!Capacitor.isNativePlatform()) return globalThis.fetch(input, init);

  const request = new Request(input, init);
  if (!/^https?:/.test(request.url)) return globalThis.fetch(input, init);
  if (request.signal.aborted) throw request.signal.reason;
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  const result = await CapacitorHttp.request({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    data: body,
    responseType: "text",
    connectTimeout: 15_000,
    readTimeout: 300_000,
  });
  if (request.signal.aborted) throw request.signal.reason;
  const text = typeof result.data === "string" ? result.data : JSON.stringify(result.data);
  return new Response([204, 205, 304].includes(result.status) ? null : text, {
    status: result.status,
    headers: result.headers,
  });
}
