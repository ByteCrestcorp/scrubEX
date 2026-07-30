/**
 * Veilryn — job polling hook
 *
 * Simple HTTP polling — no SSE, no EventSource.
 * Polls the given endpoint at a fixed interval until a terminal
 * status is reached or the timeout expires.
 *
 * Usage:
 *   const { result, error } = useJobPoller(fileId, "inspect");
 *   const { result, error } = useJobPoller(fileId, "strip");
 */

"use client";

import { useEffect, useRef, useState } from "react";

type JobStatus = "PENDING" | "INSPECTED" | "STRIPPING" | "COMPLETE" | "FAILED";

interface PollResult {
  status: JobStatus;
  metadata?: Record<string, unknown>;
  download_token?: string;
}

export function useJobPoller(
  fileId: string | null,
  phase: "inspect" | "strip" = "inspect",
) {
  const [result, setResult] = useState<PollResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!fileId) return;

    // Reset state on new fileId/phase
    setResult(null);
    setError(null);

    const endpoint =
      phase === "inspect"
        ? `/api/scrubex/status/${fileId}`
        : `/api/scrubex/strip-status/${fileId}`;

    const TERMINAL: JobStatus[] =
      phase === "inspect"
        ? ["INSPECTED", "FAILED"]
        : ["COMPLETE", "FAILED"];

    const cleanup = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const poll = async () => {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error("poll_failed");
        const data: PollResult = await res.json();
        setResult(data);

        if (TERMINAL.includes(data.status)) {
          cleanup();
        }
      } catch {
        setError("Something went wrong");
        cleanup();
      }
    };

    // Immediate first poll
    poll();

    // Then poll on interval
    intervalRef.current = setInterval(poll, 1500);

    // Hard timeout — stop polling after 60s
    timeoutRef.current = setTimeout(() => {
      cleanup();
      setError("Processing timed out");
    }, 60_000);

    return cleanup;
  }, [fileId, phase]);

  return { result, error };
}
