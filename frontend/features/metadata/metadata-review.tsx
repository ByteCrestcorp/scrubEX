"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Eraser,
  FileType2,
  MapPin,
  Smartphone,
  Clock,
  Code2,
  User,
  Camera,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { InspectResult, RiskLevel, CategorySummary } from "./types";
import { CATEGORY_DISPLAY_ORDER } from "./types";

const ease = [0.25, 0.1, 0.25, 1] as const;

interface MetadataReviewProps {
  inspectResult: InspectResult;
  onStrip: () => void;
  onReset: () => void;
}

/** Icon mapping per privacy category. */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  location: MapPin,
  device: Smartphone,
  timestamps: Clock,
  software: Code2,
  author: User,
  camera_settings: Camera,
  auxiliary: Layers,
};

/** Risk level → badge variant. */
const RISK_BADGE_VARIANT: Record<RiskLevel, "warning" | "info" | "neutral"> = {
  high: "warning",
  medium: "info",
  low: "neutral",
};

const RISK_BADGE_LABEL: Record<RiskLevel, string> = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
};

/** Collapsible section for a single privacy category. */
function PrivacyCategorySection({
  categoryKey,
  summary,
  fields,
  defaultOpen,
}: {
  categoryKey: string;
  summary: CategorySummary;
  fields: Record<string, string>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Icon = CATEGORY_ICONS[categoryKey] ?? Layers;
  const fieldCount = Object.keys(fields).length;

  return (
    <div className="bg-surface-deep rounded-xl border border-border-default overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 p-4 text-left hover:bg-surface-raised/30 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
        )}
        <Icon className="w-4 h-4 text-text-muted shrink-0" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-text-heading">
            {summary.label}
          </span>
          <span className="text-text-faint text-xs leading-snug">
            {summary.description}
          </span>
        </div>
        <Badge variant={RISK_BADGE_VARIANT[summary.risk]} className="shrink-0">
          {RISK_BADGE_LABEL[summary.risk]}
        </Badge>
        <span className="text-text-faint text-xs shrink-0 ml-1">
          {fieldCount}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5">
              {Object.entries(fields).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 text-sm font-mono"
                >
                  <span className="text-text-muted truncate shrink-0 max-w-[45%]">
                    {key}
                  </span>
                  <span className="text-text-heading truncate text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MetadataReview({
  inspectResult,
  onStrip,
  onReset,
}: MetadataReviewProps) {
  const {
    file_type,
    metadata_found,
    classified_metadata,
    findings_summary,
    basic_file_info,
  } = inspectResult;

  const { total_fields_found, high_risk_count, per_category } = findings_summary;

  // Order categories by the defined display order
  const orderedCategories = CATEGORY_DISPLAY_ORDER.filter(
    (key) => key in classified_metadata && key in per_category,
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, ease }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-surface-raised/80 rounded-lg flex items-center justify-center shrink-0 border border-border-subtle">
            <FileType2 className="w-5 h-5 text-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-text-heading font-semibold truncate text-sm">
              {file_type}
            </p>
            <p className="text-text-faint text-xs">
              {basic_file_info?.Dimensions && `${basic_file_info.Dimensions}`}
              {basic_file_info?.["File Size"] && ` \u00B7 ${basic_file_info["File Size"]}`}
            </p>
          </div>
        </div>

        {metadata_found ? (
          <Badge variant="warning">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Metadata Found
            </span>
          </Badge>
        ) : (
          <Badge variant="success">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Clean
            </span>
          </Badge>
        )}
      </div>

      {/* Summary */}
      {metadata_found && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm text-text-body">
            Found{" "}
            <span className="font-semibold text-text-heading">
              {total_fields_found}
            </span>{" "}
            hidden metadata {total_fields_found === 1 ? "field" : "fields"}
            {high_risk_count > 0 && (
              <>
                {" "}including{" "}
                <span className="font-semibold text-text-heading">
                  {high_risk_count}
                </span>{" "}
                high-risk {high_risk_count === 1 ? "field" : "fields"}
              </>
            )}
            {" "}across{" "}
            <span className="font-semibold text-text-heading">
              {orderedCategories.length}
            </span>{" "}
            privacy {orderedCategories.length === 1 ? "category" : "categories"}.
            Review below and strip when ready.
          </p>
        </div>
      )}

      {!metadata_found && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm text-text-body">
            No hidden embedded metadata detected in standard EXIF, GPS, XMP, or
            IPTC categories. You can still strip to be safe.
          </p>
        </div>
      )}

      {/* Privacy category sections */}
      {orderedCategories.length > 0 && (
        <div className="space-y-3 mb-6 max-h-[420px] overflow-y-auto pr-1">
          {orderedCategories.map((catKey) => (
            <PrivacyCategorySection
              key={catKey}
              categoryKey={catKey}
              summary={per_category[catKey]}
              fields={classified_metadata[catKey]}
              defaultOpen={per_category[catKey].risk === "high"}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto flex-1 justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Upload Different File
        </Button>
        <Button
          variant="accent"
          onClick={onStrip}
          className="w-full sm:w-auto flex-1 justify-center"
        >
          <Eraser className="w-4 h-4 mr-2" />
          {metadata_found ? "Strip Metadata" : "Strip Anyway"}
        </Button>
      </div>
    </motion.div>
  );
}
