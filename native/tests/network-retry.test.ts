import { afterEach, expect, it, vi } from "vitest";
import { fetchWithNetworkRecovery, NETWORK_RETRY_EVENT } from "../web/network-retry";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const url = "https://cook-api.corerevive.cn/api/v1/recipes";

it("finishes the original reads after delayed network authorization, without reopening the page", async () => {
  vi.useFakeTimers();
  let authorized = false;
  const response = new Response('{"data":[{"id":"recipe"}]}');
  const fetch = vi.fn(async () => {
    if (!authorized) throw new TypeError("Load failed");
    return response;
  });
  vi.stubGlobal("fetch", fetch);
  const reads = [fetchWithNetworkRecovery(url), fetchWithNetworkRecovery(`${url}/categories`)];
  await vi.advanceTimersByTimeAsync(20_000);
  authorized = true;
  window.dispatchEvent(new Event(NETWORK_RETRY_EVENT));
  await expect(Promise.all(reads)).resolves.toEqual([response, response]);
  expect(vi.getTimerCount()).toBe(0);
});

it("retries immediately when connectivity returns", async () => {
  vi.useFakeTimers();
  const response = new Response("ok");
  const fetch = vi.fn().mockRejectedValueOnce(new TypeError("Load failed")).mockResolvedValue(response);
  vi.stubGlobal("fetch", fetch);
  const pending = fetchWithNetworkRecovery(url);
  await vi.advanceTimersByTimeAsync(0);
  window.dispatchEvent(new Event("online"));
  await expect(pending).resolves.toBe(response);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("does not replay an AI POST after a network error", async () => {
  const fetch = vi.fn().mockRejectedValue(new TypeError("Load failed"));
  vi.stubGlobal("fetch", fetch);
  await expect(fetchWithNetworkRecovery(url, { method: "POST", body: "question" })).rejects.toThrow("Load failed");
  await expect(fetchWithNetworkRecovery(new Request(url, { method: "POST", body: "question" }))).rejects.toThrow("Load failed");
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("returns a streaming POST response before the stream finishes", async () => {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
  const response = new Response(stream);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  const result = await fetchWithNetworkRecovery(url, { method: "POST" });
  const reader = result.body!.getReader();
  controller.enqueue(new TextEncoder().encode("first delta"));
  expect(new TextDecoder().decode((await reader.read()).value)).toBe("first delta");
  controller.close();
  await reader.cancel();
});

it("does not retry HTTP errors", async () => {
  const response = new Response("unavailable", { status: 503 });
  const fetch = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetch);
  await expect(fetchWithNetworkRecovery(url)).resolves.toBe(response);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("cancels a waiting read and removes its retry listeners", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn().mockRejectedValue(new TypeError("Load failed"));
  vi.stubGlobal("fetch", fetch);
  const abort = new AbortController();
  const pending = fetchWithNetworkRecovery(url, { signal: abort.signal });
  const rejected = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  await vi.advanceTimersByTimeAsync(0);
  abort.abort();
  await rejected;
  window.dispatchEvent(new Event(NETWORK_RETRY_EVENT));
  await vi.advanceTimersByTimeAsync(5_000);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it("stops retrying if network permission remains denied", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Load failed")));
  const rejected = expect(fetchWithNetworkRecovery(url)).rejects.toThrow("Load failed");
  await vi.advanceTimersByTimeAsync(60_000);
  await rejected;
  expect(vi.getTimerCount()).toBe(0);
});
