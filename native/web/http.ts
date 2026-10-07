import { fetch as desktopFetch } from "@mygo-plugins/fetch";
import { isMyGo } from "mygo-runtime";

/** Keep the browser's ReadableStream on mobile; CapacitorHttp buffers SSE. */
export async function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isMyGo()) return desktopFetch(input, init);
  return globalThis.fetch(input, init);
}
