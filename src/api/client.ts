export const BASE_URL = "https://mobile-task.ai-worldhub.com";

/**
 * Any failed request. Carries codes only, never user-facing text: the API
 * doesn't send any, and the UI translates the code (see i18n/errors.ts).
 */
export class ApiError extends Error {
  constructor(
    /** 0 means we never got an answer. */
    public status: number,
    /** Server code, or our own NETWORK / TIMEOUT. */
    public code?: string,
    public fields?: string[],
    /** Seconds, from Retry-After on 429. */
    public retryAfter?: number,
  ) {
    super(code ?? `HTTP ${status}`);
    this.name = "ApiError";
  }

  get isTransient() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

/** Failed on the device, before or without a request. */
export class AppError extends Error {
  constructor(
    public code: "PHOTO_MISSING" | "REQUEST_FAILED",
    detail?: string,
  ) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "AppError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  params?: URLSearchParams;
  /** Objects go as JSON, FormData as multipart. */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

// fetch has no timeout, and this server sometimes never answers. Without a
// limit nothing fails, so nothing retries and the spinner just spins.
const DEFAULT_TIMEOUT_MS = 20_000;

export async function requestJson<T>(
  path: string,
  {
    method = "GET",
    params,
    body,
    headers,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: RequestOptions = {},
): Promise<T> {
  const url = `${BASE_URL}${path}${params?.size ? `?${params}` : ""}`;

  // The caller's signal and our timeout share one controller
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(onAbort, timeoutMs);

  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined &&
          !isForm && { "Content-Type": "application/json" }),
        ...headers,
      },
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
    });
  } catch (e) {
    // Caller cancelled (e.g. a newer search): rethrow as-is so TanStack
    // treats it as a cancellation, not an error to show
    if (signal?.aborted) throw e;
    if (controller.signal.aborted) throw new ApiError(0, "TIMEOUT");
    if (isNetworkFailure(e)) throw new ApiError(0, "NETWORK");
    // Never left the device (bad body etc.). That's a bug, don't disguise it
    // as "offline", or the outbox would wait for a network that's already up.
    throw new AppError(
      "REQUEST_FAILED",
      e instanceof Error ? e.message : String(e),
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const retryAfter = Number(res.headers.get("Retry-After")) || undefined;
    throw new ApiError(res.status, data?.code, data?.fields, retryAfter);
  }

  return res.json();
}

// Expo's fetch wraps transport errors as "fetch failed: …", RN's old fetch
// says "Network request failed". Matching on text is fragile; revisit on
// SDK upgrades.
function isNetworkFailure(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  return (
    message.startsWith("fetch failed") ||
    message.includes("Network request failed")
  );
}

export function getJson<T>(
  path: string,
  params?: URLSearchParams,
  signal?: AbortSignal,
): Promise<T> {
  return requestJson<T>(path, { params, signal });
}

// Retry policy for reads. 4xx won't get better by asking again; 429 is the
// exception.
export function shouldRetry(failureCount: number, error: unknown) {
  const status = error instanceof ApiError ? error.status : 0;
  if (status >= 400 && status < 500 && status !== 429) return false;
  return failureCount < 2;
}

export function retryDelay(attempt: number, error: unknown) {
  if (error instanceof ApiError && error.retryAfter) {
    return error.retryAfter * 1000;
  }
  return Math.min(1000 * 2 ** attempt, 30_000);
}
