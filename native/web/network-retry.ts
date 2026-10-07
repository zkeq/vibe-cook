export const NETWORK_RETRY_EVENT = "native-network-retry";
const RECOVERY_WINDOW_MS = 60_000;

function waitForRetry(delay: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("online", resume);
      window.removeEventListener(NETWORK_RETRY_EVENT, resume);
      document.removeEventListener("visibilitychange", visible);
      signal?.removeEventListener("abort", abort);
    };
    const resume = () => { cleanup(); resolve(); };
    const visible = () => { if (!document.hidden) resume(); };
    const abort = () => {
      cleanup();
      reject(signal?.reason ?? new DOMException("Request aborted", "AbortError"));
    };
    const timer = setTimeout(resume, delay);
    window.addEventListener("online", resume);
    window.addEventListener(NETWORK_RETRY_EVENT, resume);
    document.addEventListener("visibilitychange", visible);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
  });
}

/** iOS may reject initial reads before its first-launch network prompt is answered. */
export async function fetchWithNetworkRecovery(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : undefined;
  const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
  const signal = init?.signal ?? request?.signal;
  // Never replay AI POSTs or consume/buffer a streaming response.
  if (method !== "GET" && method !== "HEAD") return globalThis.fetch(input, init);

  const deadline = Date.now() + RECOVERY_WINDOW_MS;
  let attempt = 0;
  for (;;) {
    signal?.throwIfAborted();
    try {
      return await globalThis.fetch(input, init);
    } catch (error) {
      const remaining = deadline - Date.now();
      // A valid HTTP error is returned normally; only connection failures are retried.
      if (!(error instanceof TypeError) || signal?.aborted || remaining <= 0) throw error;
      await waitForRetry(Math.min(1_000 * ++attempt, 3_000, remaining), signal);
    }
  }
}
