/**
 * Veilryn — central API client
 *
 * In the browser, this is the empty string so requests use the Next.js origin;
 * `next.config.ts` rewrites `/api/v1/*`, `/api/links/*`, and `/health` to
 * `NEXT_PUBLIC_API_URL` (avoids CORS and “NetworkError” when :8000 is blocked).
 * On the server, the full backend origin is used (rewrites apply to incoming HTTP only).
 */

const _backendOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/$/,
  "",
);

// Server must reach FastAPI directly; the browser uses same-origin paths + rewrites.
// (Client modules can still be evaluated in Node during SSR — only enforce on server.)
if (typeof window === "undefined" && !_backendOrigin) {
  throw new Error(
    "[api.ts] NEXT_PUBLIC_API_URL is not defined. " +
      "Set it in the repo-root `.env` and restart `next dev` (see next.config.ts)."
  );
}

export const API_BASE_URL =
  typeof window === "undefined" ? _backendOrigin : "";

/** Standard JSON headers for non-upload requests. */
const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/** Structured error thrown by apiFetch when a request fails. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly url: string,
    public readonly body?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Typed wrapper around `fetch` that targets the backend API.
 *
 * - Prepends `API_BASE_URL` if `path` starts with `/`.
 * - Sets JSON headers by default (override via `init.headers`).
 * - Guards against non-JSON responses on both error and success paths.
 * - Throws `ApiError` with HTTP status, URL, and raw body on failure.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        ...JSON_HEADERS,
        ...init?.headers,
      },
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      if (isJson) {
        // Parse JSON error body and throw a structured error
        const errorBody = await res.json();
        const message =
          errorBody?.message ??
          errorBody?.error?.message ??
          `Request failed (HTTP ${res.status})`;
        throw new ApiError(message, res.status, url);
      }

      // Non-JSON error (e.g. HTML 404 from wrong server)
      const rawText = await res.text();
      throw new ApiError(
        `HTTP ${res.status} — non-JSON error response from ${url}`,
        res.status,
        url,
        rawText,
      );
    }

    // Success but unexpected content type
    if (!isJson) {
      const rawText = await res.text();
      throw new ApiError(
        `HTTP ${res.status} — expected JSON but received "${contentType}" from ${url}`,
        res.status,
        url,
        rawText,
      );
    }

    return res;
  } catch (err) {
    // Re-throw ApiErrors as-is (already structured)
    if (err instanceof ApiError) {
      throw err;
    }
    // Network-level errors (TypeError: Failed to fetch, etc.)
    throw new Error(
      `Network error reaching ${url}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/** Generic success envelope returned by the backend. */
export interface ApiEnvelope<T = Record<string, unknown>> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; detail: string }>;
}

/**
 * Unified security error type returned by classifyResponse.
 * Shared across all three service API clients.
 */
export type SecurityError =
  | { type: "rate_limited"; retryAfter: number }
  | { type: "blocked" }
  | { type: "validation_error"; fields: Record<string, string> }
  | { type: "server_error" };

/**
 * Classify an HTTP response into a typed security error, or return null
 * if the response is successful. Call this before parsing the response
 * body in any service API client.
 */
export async function classifyResponse(
  response: Response,
): Promise<SecurityError | null> {
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After")) || 10;
    return { type: "rate_limited", retryAfter };
  }
  if (response.status === 403) {
    return { type: "blocked" };
  }
  if (response.status === 422) {
    const json = await response.json().catch(() => ({ detail: [] }));
    const fields: Record<string, string> = {};
    for (const item of json.detail ?? []) {
      const field = String(item.loc?.at(-1) ?? "unknown");
      if (!fields[field]) fields[field] = item.msg;
    }
    return { type: "validation_error", fields };
  }
  if (!response.ok) {
    return { type: "server_error" };
  }
  return null;
}
