import { loadEnvConfig } from "@next/env";
import path from "path";
import type { NextConfig } from "next";

// Monorepo: real vars live in the repo-root `.env`. Next normally loads
// `frontend/.env*` first and **caches** that result; a plain second call to
// `loadEnvConfig(parent)` would return the cache and never read the root file.
// `forceReload: true` re-runs loading from `rootDir` so `NEXT_PUBLIC_*` exists
// in `process.env` and in `combinedEnv` for `env` / rewrites below.
const rootDir = path.resolve(__dirname, "..");
const { combinedEnv } = loadEnvConfig(
  rootDir,
  process.env.NODE_ENV !== "production",
  console,
  true,
);

const apiBase = (
  combinedEnv.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Required by infra/docker/frontend.Dockerfile, which copies `.next/standalone`
  // and runs `node server.js`. `npm run dev` as a production entrypoint was
  // explicitly rejected — a dev server is not a runtime.
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: combinedEnv.NEXT_PUBLIC_API_URL ?? "",
  },
  async redirects() {
    return [{ source: "/metadata", destination: "/tools/scrubex", permanent: true }];
  },
  async rewrites() {
    if (!apiBase) {
      return [];
    }
    return [
      { source: "/api/v1/:path*", destination: `${apiBase}/api/v1/:path*` },
      { source: "/api/scrubex/:path*", destination: `${apiBase}/api/scrubex/:path*` },
      { source: "/health", destination: `${apiBase}/health` },
      { source: "/health/:path*", destination: `${apiBase}/health/:path*` },
    ];
  },
};

export default nextConfig;
