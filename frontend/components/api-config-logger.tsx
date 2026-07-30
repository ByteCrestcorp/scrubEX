"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

/**
 * Logs the active backend target URL to the browser console on mount.
 * Drop this component into the root layout so misconfigured environment
 * variables are immediately visible during development — no network
 * request required.
 */
export function ApiConfigLogger() {
  useEffect(() => {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    console.log(
      `[API Config] Browser API base (same-origin): ${API_BASE_URL || "(empty — requests use /api/… rewrites)"} · NEXT_PUBLIC_API_URL: ${publicUrl || "(unset)"}`,
    );
  }, []);

  return null;
}
