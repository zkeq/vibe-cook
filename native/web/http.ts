import { fetch as desktopFetch } from "@mygo-plugins/fetch";
import { isMyGo } from "mygo-runtime";
import { Capacitor } from "@capacitor/core";
import { fetchWithNetworkRecovery } from "./network-retry";

/** Keep the browser's ReadableStream on mobile; CapacitorHttp buffers SSE. */
export async function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isMyGo()) return desktopFetch(input, init);
  if (Capacitor.getPlatform() === "ios") return fetchWithNetworkRecovery(input, init);
  return globalThis.fetch(input, init);
}
