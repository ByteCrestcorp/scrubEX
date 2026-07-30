/**
 * Veilryn — Metadata feature types
 *
 * TypeScript interfaces mirroring the backend API response shapes.
 * Single source of truth for the metadata workflow data contracts.
 *
 * Backend status values are UPPERCASE: PENDING, INSPECTED, STRIPPING,
 * COMPLETE, FAILED.  The frontend normalizes these in the types below.
 */

// ── Privacy Category Model ──────────────────────────────────────────────────

/** Risk level for a privacy category. */
export type RiskLevel = "high" | "medium" | "low";

/** Per-category summary from the findings report. */
export interface CategorySummary {
  count: number;
  risk: RiskLevel;
  label: string;
  description: string;
}

/** Full findings summary returned by the backend. */
export interface FindingsSummary {
  total_fields_found: number;
  categories_found: string[];
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  per_category: Record<string, CategorySummary>;
}

/** Delta report after stripping. */
export interface StripDelta {
  fields_removed: number;
  fields_remaining: number;
  categories_removed: string[];
  categories_remaining: string[];
  per_category_removed: Record<string, number>;
}

/** Fields grouped by privacy category. */
export type ClassifiedMetadata = Record<string, Record<string, string>>;

/** Basic file info (non-sensitive). */
export type BasicFileInfo = Record<string, string>;

// ── Backend Job Status ──────────────────────────────────────────────────────

export type JobStatus =
  | "PENDING"
  | "INSPECTED"
  | "STRIPPING"
  | "COMPLETE"
  | "FAILED";

/** Terminal states where polling should stop. */
export const TERMINAL_INSPECT_STATUSES = new Set<JobStatus>([
  "INSPECTED",
  "FAILED",
]);

export const TERMINAL_STRIP_STATUSES = new Set<JobStatus>([
  "COMPLETE",
  "FAILED",
]);

/** Failure states. */
export const FAILURE_JOB_STATUSES = new Set<JobStatus>(["FAILED"]);

// ── API Response Shapes ─────────────────────────────────────────────────────

/** POST /api/scrubex/upload — 202 response. */
export interface UploadResult {
  file_id: string;
}

/** GET /api/scrubex/status/{file_id} — poll response. */
export interface InspectPollResult {
  status: JobStatus;
  metadata?: {
    metadata_found: boolean;
    basic_file_info: BasicFileInfo;
    classified_metadata: ClassifiedMetadata;
    findings_summary: FindingsSummary;
  };
}

/** POST /api/scrubex/strip/{file_id} — 202 response. */
export interface StripTriggerResult {
  file_id: string;
  status: "STRIPPING";
}

/** GET /api/scrubex/strip-status/{file_id} — poll response. */
export interface StripPollResult {
  status: JobStatus;
  download_token?: string;
}

// ── Frontend UI Types ───────────────────────────────────────────────────────

/** Inspect phase result for the review screen. */
export interface InspectResult {
  file_id: string;
  status: string;
  file_type: string;
  metadata_found: boolean;
  basic_file_info: BasicFileInfo;
  classified_metadata: ClassifiedMetadata;
  findings_summary: FindingsSummary;
}

/** Strip phase result for the result screen. */
export interface StripResult {
  file_id: string;
  status: "COMPLETE";
  download_token: string;
  findings_summary: FindingsSummary;
  strip_summary: StripDelta;
  metadata_before: ClassifiedMetadata;
  metadata_after: ClassifiedMetadata;
}

// ── Frontend State Machine ──────────────────────────────────────────────────

export type AppState =
  | "IDLE"
  | "UPLOADING"
  | "INSPECTING"
  | "REVIEWING"
  | "STRIPPING"
  | "DONE"
  | "ERROR";

/** Structured error for UI display. */
export interface AppError {
  message: string;
  field?: string;
  detail?: string;
  retryable: boolean;
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Accepted MIME types — must match backend config. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/heic",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const SUPPORTED_EXTENSIONS_LABEL = "JPG, PNG, WebP, PDF, TIFF, HEIC";

/** Default polling interval in ms. */
export const POLL_INTERVAL_MS = 1500;

/** Max time to poll before timing out (ms). */
export const POLL_TIMEOUT_MS = 60_000;

/** Privacy category display order (highest risk first). */
export const CATEGORY_DISPLAY_ORDER = [
  "location",
  "device",
  "author",
  "timestamps",
  "software",
  "camera_settings",
  "auxiliary",
] as const;

/** Human-readable risk labels for badges. */
export const RISK_LABELS: Record<RiskLevel, string> = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
};

/** Risk-to-badge-variant mapping. */
export const RISK_VARIANTS: Record<RiskLevel, "warning" | "default" | "success"> = {
  high: "warning",
  medium: "default",
  low: "success",
};
