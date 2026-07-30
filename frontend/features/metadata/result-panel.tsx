"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  ArrowLeft,
  ShieldCheck,
  FileType2,
  Loader2,
  Clock,
  Check,
  MapPin,
  Smartphone,
  Clock as ClockIcon,
  Code2,
  User,
  Camera,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import type { StripResult } from "./types";
import { CATEGORY_DISPLAY_ORDER } from "./types";
import { downloadCleanedFile, MetadataApiError } from "@/lib/metadata-api";

const ease = [0.25, 0.1, 0.25, 1] as const;

/** Icons per privacy category for the removal checklist. */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  location: MapPin,
  device: Smartphone,
  timestamps: ClockIcon,
  software: Code2,
  author: User,
  camera_settings: Camera,
  auxiliary: Layers,
};

/** Human labels for categories (fallback if findings_summary isn't available). */
const CATEGORY_LABELS: Record<string, string> = {
  location: "Location data",
  device: "Device identity",
  timestamps: "Timestamps",
  software: "Software tags",
  author: "Author / owner info",
  camera_settings: "Camera settings",
  auxiliary: "Auxiliary metadata",
};

interface ResultPanelProps {
  file: File;
  stripResult: StripResult;
  onReset: () => void;
}

export function ResultPanel({ file, stripResult, onReset }: ResultPanelProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadCleanedFile(stripResult.download_token, file.name);
    } catch (err) {
      if (err instanceof MetadataApiError) {
        setDownloadError(err.message);
      } else {
        setDownloadError("Download failed. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const { strip_summary, findings_summary } = stripResult;
  const fieldsRemoved = strip_summary?.fields_removed ?? 0;
  const fieldsRemaining = strip_summary?.fields_remaining ?? 0;
  const perCategoryRemoved = strip_summary?.per_category_removed ?? {};

  // Ordered list of categories that had fields removed
  const removedCategoryKeys = CATEGORY_DISPLAY_ORDER.filter(
    (key) => (perCategoryRemoved[key] ?? 0) > 0,
  );



  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -10 }}
      transition={{ duration: 0.4, ease }}
      className="text-center"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
        className="w-20 h-20 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.1)]"
      >
        <ShieldCheck className="w-10 h-10 text-success-500" />
      </motion.div>

      <h3 className="text-2xl font-bold text-text-heading mb-2">
        Metadata removed. Your file is ready.
      </h3>

      {fieldsRemoved > 0 ? (
        <p className="text-text-muted mb-6 max-w-sm mx-auto text-sm leading-relaxed">
          Removed {fieldsRemoved} metadata{" "}
          {fieldsRemoved === 1 ? "field" : "fields"} across{" "}
          {removedCategoryKeys.length} privacy{" "}
          {removedCategoryKeys.length === 1 ? "category" : "categories"}.
        </p>
      ) : (
        <p className="text-text-muted mb-6 max-w-sm mx-auto text-sm leading-relaxed">
          File verified clean — no sensitive metadata was present.
        </p>
      )}

      {/* Per-category removal checklist */}
      {removedCategoryKeys.length > 0 && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, ease }}
          className="max-w-sm mx-auto mb-6 text-left"
        >
          <div className="bg-surface-deep border border-border-default rounded-xl p-4 space-y-2.5">
            {removedCategoryKeys.map((catKey, idx) => {
              const Icon = CATEGORY_ICONS[catKey] ?? Layers;
              const label = CATEGORY_LABELS[catKey] ?? catKey;
              const count = perCategoryRemoved[catKey] ?? 0;

              return (
                <motion.div
                  key={catKey}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.06, ease }}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-success-500/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-success-500" />
                  </div>
                  <Icon className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-text-body flex-1">{label} removed</span>
                  <span className="text-text-faint text-xs">
                    {count} {count === 1 ? "field" : "fields"}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {fieldsRemaining > 0 && (
            <p className="text-text-faint text-xs mt-2 px-1">
              {fieldsRemaining} non-sensitive{" "}
              {fieldsRemaining === 1 ? "field remains" : "fields remain"} (basic
              file properties).
            </p>
          )}
        </motion.div>
      )}

      {/* Before / After comparison */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, ease }}
        className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6"
      >
        <div className="bg-surface-deep border border-border-default rounded-xl p-4">
          <p className="text-text-faint text-xs uppercase tracking-wider mb-1 font-semibold">
            Before
          </p>
          <p className="text-2xl font-bold text-text-heading">
            {fieldsRemoved + fieldsRemaining}
          </p>
          <p className="text-text-muted text-xs">metadata fields</p>
        </div>
        <div className="bg-surface-deep border border-success-500/20 rounded-xl p-4">
          <p className="text-text-faint text-xs uppercase tracking-wider mb-1 font-semibold">
            After
          </p>
          <p className="text-2xl font-bold text-success-400">{fieldsRemaining}</p>
          <p className="text-text-muted text-xs">metadata fields</p>
        </div>
      </motion.div>

      {/* File info card */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, ease }}
        className="bg-surface-deep border border-border-default rounded-xl p-5 mb-4 flex items-center justify-between max-w-md mx-auto"
      >
        <div className="flex items-center gap-4 text-left overflow-hidden">
          <div className="w-10 h-10 bg-surface-raised/80 rounded-lg flex items-center justify-center shrink-0 border border-border-subtle">
            <FileType2 className="w-5 h-5 text-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-text-heading font-medium truncate text-sm">
              {file.name}
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <Badge variant="success" className="shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
            Cleaned
          </span>
        </Badge>
      </motion.div>

      <div className="mb-6" />

      {/* Download error */}
      {downloadError && (
        <p className="text-red-400 text-sm mb-4">{downloadError}</p>
      )}

      {/* Actions */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, ease }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
      >
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto flex-1 justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Scrub Another
        </Button>
        <Button
          variant="accent"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full sm:w-auto flex-1 justify-center"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {downloading ? "Downloading…" : "Download clean file"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
