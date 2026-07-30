"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { UploadZone } from "./upload-zone";
import { ProcessingState } from "./processing-state";
import { MetadataReview } from "./metadata-review";
import { ResultPanel } from "./result-panel";
import { ErrorState } from "./error-state";
import { ErrorBanner } from "@/components/ErrorBanner";
import {
  uploadFile,
  triggerStrip,
  cancelJob,
  MetadataApiError,
  MetadataSecurityError,
} from "@/lib/metadata-api";
import { useJobPoller } from "@/lib/use-job-poller";
import type {
  AppState,
  AppError,
  InspectResult,
  StripResult,
} from "./types";
import type { SecurityError } from "@/lib/api";

type SecurityBanner =
  | { type: "rate_limited"; retryAfter: number }
  | { type: "blocked" }
  | null;

export function MetadataStripper() {
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [stripResult, setStripResult] = useState<StripResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [securityBanner, setSecurityBanner] = useState<SecurityBanner>(null);

  // ── Polling phase ──────────────────────────────────────────────────
  const [pollPhase, setPollPhase] = useState<"inspect" | "strip" | null>(null);

  // Only poll when we have an active phase
  const {
    result: pollResult,
    error: pollError,
  } = useJobPoller(
    pollPhase ? fileId : null,
    pollPhase ?? "inspect",
  );

  // ── Rate-limit countdown ───────────────────────────────────────────
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSecurityBanner({ type: "rate_limited", retryAfter: seconds });

    countdownRef.current = setInterval(() => {
      setSecurityBanner((prev) => {
        if (!prev || prev.type !== "rate_limited") {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return prev;
        }
        const next = prev.retryAfter - 1;
        if (next <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return null;
        }
        return { type: "rate_limited", retryAfter: next };
      });
    }, 1000);
  }, []);

  const handleSecurityError = useCallback(
    (sec: SecurityError) => {
      if (sec.type === "rate_limited") {
        startCountdown(sec.retryAfter);
        setAppState("IDLE");
      } else if (sec.type === "blocked") {
        setSecurityBanner({ type: "blocked" });
        setAppState("IDLE");
      }
    },
    [startCountdown],
  );

  // ── Cancel on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (fileId) {
        cancelJob(fileId);
      }
    };
  }, [fileId]);

  // ── React to inspect poll results ──────────────────────────────────
  useEffect(() => {
    if (!pollResult || pollPhase !== "inspect") return;

    if (pollResult.status === "INSPECTED" && pollResult.metadata) {
      const meta = pollResult.metadata as {
        metadata_found: boolean;
        basic_file_info: Record<string, string>;
        classified_metadata: Record<string, Record<string, string>>;
        findings_summary: InspectResult["findings_summary"];
      };

      setInspectResult({
        file_id: fileId!,
        status: pollResult.status,
        file_type: file?.type ?? "unknown",
        metadata_found: meta.metadata_found,
        basic_file_info: meta.basic_file_info ?? {},
        classified_metadata: meta.classified_metadata ?? {},
        findings_summary: meta.findings_summary ?? {
          total_fields_found: 0,
          categories_found: [],
          high_risk_count: 0,
          medium_risk_count: 0,
          low_risk_count: 0,
          per_category: {},
        },
      });
      setPollPhase(null);
      setAppState("REVIEWING");
      return;
    }

    if (pollResult.status === "FAILED") {
      setPollPhase(null);
      handleError(
        new MetadataApiError("Processing failed", 500),
      );
    }
  }, [pollResult, pollPhase, fileId, file]);

  // ── React to strip poll results ────────────────────────────────────
  useEffect(() => {
    if (!pollResult || pollPhase !== "strip") return;

    if (pollResult.status === "COMPLETE" && pollResult.download_token) {
      setStripResult({
        file_id: fileId!,
        status: "COMPLETE",
        download_token: pollResult.download_token,
        // These will be populated from the inspect result
        metadata_before: inspectResult?.classified_metadata ?? {},
        metadata_after: {},
        findings_summary: inspectResult?.findings_summary ?? {
          total_fields_found: 0,
          categories_found: [],
          high_risk_count: 0,
          medium_risk_count: 0,
          low_risk_count: 0,
          per_category: {},
        },
        strip_summary: {
          fields_removed: inspectResult?.findings_summary?.total_fields_found ?? 0,
          fields_remaining: 0,
          categories_removed: inspectResult?.findings_summary?.categories_found ?? [],
          categories_remaining: [],
          per_category_removed: Object.fromEntries(
            Object.entries(inspectResult?.findings_summary?.per_category ?? {}).map(
              ([key, val]) => [key, val.count],
            ),
          ),
        },
      });
      setPollPhase(null);
      setAppState("DONE");
      return;
    }

    if (pollResult.status === "FAILED") {
      setPollPhase(null);
      handleError(
        new MetadataApiError("Processing failed", 500),
      );
    }
  }, [pollResult, pollPhase, fileId, inspectResult]);

  // ── React to poll errors ───────────────────────────────────────────
  useEffect(() => {
    if (pollError) {
      setPollPhase(null);
      handleError(new MetadataApiError(pollError, 0));
    }
  }, [pollError]);

  // ── IDLE → UPLOADING → INSPECTING ──────────────────────────────────
  const handleUpload = async (f: File) => {
    setFile(f);
    setError(null);
    setSecurityBanner(null);
    setAppState("UPLOADING");

    try {
      const result = await uploadFile(f);
      setFileId(result.file_id);
      setPollPhase("inspect");
      setAppState("INSPECTING");
    } catch (err) {
      if (err instanceof MetadataSecurityError) {
        handleSecurityError(err.security);
      } else {
        handleError(err);
      }
    }
  };

  // ── REVIEWING → STRIPPING ──────────────────────────────────────────
  const handleStrip = async () => {
    if (!fileId) return;
    setAppState("STRIPPING");

    try {
      await triggerStrip(fileId);
      setPollPhase("strip");
    } catch (err) {
      if (err instanceof MetadataSecurityError) {
        handleSecurityError(err.security);
      } else {
        handleError(err);
      }
    }
  };

  // ── Error handler ─────────────────────────────────────────────────
  const handleError = (err: unknown) => {
    if (err instanceof MetadataApiError) {
      setError({
        message: err.message,
        field: err.errors?.[0]?.field,
        detail: err.errors?.[0]?.detail,
        retryable: true,
      });
    } else if (err instanceof TypeError) {
      setError({
        message: "Unable to reach the server. Check your connection and try again.",
        retryable: true,
      });
    } else {
      setError({
        message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        retryable: true,
      });
    }
    setAppState("ERROR");
  };

  // ── Full reset → IDLE ─────────────────────────────────────────────
  const handleReset = () => {
    // Cancel the current job if one exists
    if (fileId) {
      cancelJob(fileId);
    }
    setFile(null);
    setFileId(null);
    setInspectResult(null);
    setStripResult(null);
    setError(null);
    setSecurityBanner(null);
    setPollPhase(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setAppState("IDLE");
  };

  const bannerVariant = securityBanner?.type ?? null;

  return (
    <div className="card-panel p-6 sm:p-8 relative overflow-hidden">
      {/* Security banners (429 / 403) */}
      <AnimatePresence>
        {bannerVariant && (
          <ErrorBanner
            variant={bannerVariant}
            retryAfter={
              securityBanner?.type === "rate_limited"
                ? securityBanner.retryAfter
                : undefined
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {appState === "IDLE" && (
          <UploadZone key="upload" onFileSelect={handleUpload} />
        )}

        {appState === "UPLOADING" && file && (
          <ProcessingState
            key="uploading"
            mode="uploading"
            fileName={file.name}
          />
        )}

        {appState === "INSPECTING" && file && (
          <ProcessingState
            key="inspecting"
            mode="inspecting"
            fileName={file.name}
          />
        )}

        {appState === "REVIEWING" && inspectResult && (
          <MetadataReview
            key="review"
            inspectResult={inspectResult}
            onStrip={handleStrip}
            onReset={handleReset}
          />
        )}

        {appState === "STRIPPING" && file && (
          <ProcessingState
            key="stripping"
            mode="stripping"
            fileName={file.name}
          />
        )}

        {appState === "DONE" && stripResult && file && (
          <ResultPanel
            key="result"
            file={file}
            stripResult={stripResult}
            onReset={handleReset}
          />
        )}

        {appState === "ERROR" && error && (
          <ErrorState key="error" error={error} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}
