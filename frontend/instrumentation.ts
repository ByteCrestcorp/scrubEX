/**
 * ScrubEX — Next.js Instrumentation Hook
 *
 * Runs once on server startup (not in the browser).
 * Performs a backend health check and logs results to the
 * terminal — nothing is exposed to the client.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in the Node.js server runtime, not Edge
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await checkBackendConnectivity();
  }
}

async function checkBackendConnectivity() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const healthUrl = `${apiUrl}/health`;

  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 3_000;
  const RETRY_DELAY_MS = 1_000;

  console.log("");
  console.log("  Connecting to server...");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(healthUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (json?.success && json?.data?.status === "ok") {
        console.log(
          `  Server connected — ${json.data.service ?? "backend"} v${json.data.version ?? "?"}`
        );
        console.log(`  Health endpoint: ${healthUrl}`);
        console.log("");
        return;
      }

      console.warn("  Invalid backend response shape");
      console.log("");
      return;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }

      const msg =
        err instanceof DOMException && err.name === "AbortError"
          ? "Connection timed out"
          : err instanceof TypeError
            ? "Server unavailable — is the backend running?"
            : String((err as Error).message ?? "Unknown error");

      console.warn(`  Server unavailable — ${msg}`);
      console.log(
        "  Start the backend with: cd backend && poetry run backend start"
      );
      console.log("");
    }
  }
}
