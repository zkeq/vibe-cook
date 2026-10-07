/** Native builds replace this module with their platform HTTP transport. */
export function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return globalThis.fetch(input, init);
}
