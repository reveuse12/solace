export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); this.name = "ApiError"; }
}
export function createApiClient(baseUrl: string, getToken: () => Promise<string | null>, transport: typeof fetch = fetch, timeoutMs = 25000) {
  const base = new URL(baseUrl);
  if (base.protocol !== "https:" || base.username || base.password || base.pathname !== "/" || base.search || base.hash) throw new Error("Use the HTTPS origin of your Solace PWA.");
  return async function request<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
    if (!path.startsWith("/api/") || path.includes("..") || path.includes("\\") || path.includes("#") || path.includes("?")) throw new Error("Invalid API path.");
    const destination = new URL(path, base);
    if (destination.origin !== base.origin || !destination.pathname.startsWith("/api/")) throw new Error("Invalid API path.");
    const controller = new AbortController();
    const abort = () => controller.abort();
    let rejectAbort: (reason: unknown) => void = () => {};
    const interrupted = () => rejectAbort(new ApiError("Sign-in or sync timed out or was interrupted. Please try again."));
    const deadline = new Promise<never>((_, reject) => { rejectAbort = reject; });
    controller.signal.addEventListener("abort", interrupted, { once: true });
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) abort();
    const timer = setTimeout(abort, timeoutMs);
    try {
      return await Promise.race([deadline, (async () => {
        if (controller.signal.aborted) throw new ApiError("The request was interrupted. Please try again.");
        const token = await getToken();
        // A timed-out token may still arrive later. Never start its cancelled request.
        if (controller.signal.aborted) throw new ApiError("The request was interrupted. Please try again.");
        if (!token) throw new ApiError("Please sign in again to sync your space.", 401);
        const response = await transport(destination.href, {
          method: options.method ?? "GET", redirect: "error", signal: controller.signal,
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}) },
          ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new ApiError(response.status === 401 ? "Please sign in again to sync your space." : typeof payload?.error === "string" ? payload.error : "We couldn't sync your space. Please try again.", response.status);
        if (!payload || typeof payload !== "object") throw new ApiError("The server returned an unexpected response. Please try again.");
        return payload as T;
      })()]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(controller.signal.aborted ? "The request timed out or was interrupted. Please try again." : "Couldn't reach Solace. Check your connection and try again.");
    } finally { clearTimeout(timer); controller.signal.removeEventListener("abort", interrupted); options.signal?.removeEventListener("abort", abort); }
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;
