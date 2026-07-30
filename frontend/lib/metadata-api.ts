/**
 * Veilryn — metadata API client
 *
 * Typed functions for the ScrubEX pipeline:
 *   upload → poll inspect → review → trigger strip → poll strip → download
 *
 * All endpoints target /api/scrubex/*.
 * Mutating endpoints pass through classifyResponse for Arcjet rejection detection.
 */

import { API_BASE_URL, classifyResponse, type SecurityError } from "./api";

/** Structured error thrown by metadata API calls. */
export class MetadataApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Array<{ field: string; detail: string }>,
  ) {
    super(message);
    this.name = "MetadataApiError";
  }
}

/** Security rejection from Arcjet (429 or 403). */
export class MetadataSecurityError extends Error {
  constructor(public readonly security: SecurityError) {
    super(security.type === "rate_limited" ? "rate_limited" : "blocked");
    this.name = "MetadataSecurityError";
  }
}

// ── Upload ──────────────────────────────────────────────────────────────────

/**
 * Upload a file and start background metadata inspection.
 *
 * POST /api/scrubex/upload → { file_id }
 *
 * Throws MetadataSecurityError on 429/403 (Arcjet rejection).
 */
export async function uploadFile(file: File): Promise<{ file_id: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/scrubex/upload`, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
  });

  const securityErr = await classifyResponse(res);
  if (securityErr) {
    throw new MetadataSecurityError(securityErr);
  }

  if (!res.ok) {
    throw new MetadataApiError(
      `Upload failed (HTTP ${res.status})`,
      res.status,
    );
  }

  return res.json();
}

// ── Strip trigger ───────────────────────────────────────────────────────────

/**
 * Trigger metadata stripping for a previously inspected file.
 *
 * POST /api/scrubex/strip/{file_id} → { file_id, status }
 *
 * Throws MetadataSecurityError on 429/403 (Arcjet rejection).
 */
export async function triggerStrip(
  fileId: string,
): Promise<{ file_id: string; status: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/scrubex/strip/${encodeURIComponent(fileId)}`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
    },
  );

  const securityErr = await classifyResponse(res);
  if (securityErr) {
    throw new MetadataSecurityError(securityErr);
  }

  if (!res.ok) {
    throw new MetadataApiError(
      `Strip request failed (HTTP ${res.status})`,
      res.status,
    );
  }

  return res.json();
}

// ── Download ────────────────────────────────────────────────────────────────

/**
 * Download the cleaned file via one-time download token.
 * Fetches binary as a blob, creates an object URL, and triggers
 * a browser save dialog.
 *
 * GET /api/scrubex/download/{token} → binary stream
 */
export async function downloadCleanedFile(
  token: string,
  originalFileName: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/scrubex/download/${encodeURIComponent(token)}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new MetadataApiError(
      res.status === 410
        ? "Download expired or already used"
        : `Download failed (HTTP ${res.status})`,
      res.status,
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Build clean filename
  const parts = originalFileName.split(".");
  const ext = parts.pop();
  a.download = ext
    ? `${parts.join(".")}_clean.${ext}`
    : `${originalFileName}_clean`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Cancel ──────────────────────────────────────────────────────────────────

/**
 * Cancel a ScrubEX job and clean up Redis resources.
 *
 * DELETE /api/scrubex/cancel/{file_id} → 204
 *
 * Fire-and-forget — errors are silently swallowed.
 */
export function cancelJob(fileId: string): void {
  fetch(`${API_BASE_URL}/api/scrubex/cancel/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  }).catch(() => {
    /* intentionally swallowed */
  });
}
