/**
 * BitScrub — Backend Health Check Utility
 *
 * Provides a typed, timeout-protected fetch against `/health`
 * with optional retries. Used by the dev-mode status indicator
 * and can be reused anywhere.
 */

import { API_BASE_URL } from "./api";

export interface HealthResult {
  connected: boolean;
  status?: string;
  service?: string;
  version?: string;
  message?: string;
  error?: string;
}

const HEALTH_TIMEOUT_MS = 3_000;
const RETRY_DELAY_MS = 1_000;
const MAX_RETRIES = 2;

/**
 * Calls `GET /health` on the backend.
 *
 * Returns a `HealthResult` — never throws.
 */
export async function checkBackendHealth(
  retries = MAX_RETRIES
): Promise<HealthResult> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

      const res = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      // Validate expected shape
      if (!json?.success) {
        return {
          connected: false,
          error: "Invalid backend response",
        };
      }

      return {
        connected: true,
        status: json.data?.status ?? "ok",
        service: json.data?.service,
        version: json.data?.version,
        message: json.message,
      };
    } catch (err) {
      // On last attempt, return the failure
      if (attempt === retries) {
        const msg =
          err instanceof DOMException && err.name === "AbortError"
            ? "Connection timed out"
            : err instanceof TypeError
              ? "Server unavailable"
              : String((err as Error).message ?? "Unknown error");

        return { connected: false, error: msg };
      }

      // Wait before retrying
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  // Should never reach here, but TypeScript needs it
  return { connected: false, error: "Unknown error" };
}
