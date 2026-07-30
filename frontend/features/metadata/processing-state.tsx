"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1] as const;

interface ProcessingStateProps {
  mode: "uploading" | "inspecting" | "stripping";
  fileName: string;
}

const STEPS: Record<ProcessingStateProps["mode"], string[]> = {
  uploading: [
    "Uploading file to server",
    "Validating file integrity",
    "Preparing for inspection",
  ],
  inspecting: [
    "Scanning EXIF metadata",
    "Checking for GPS coordinates",
    "Extracting XMP and IPTC data",
    "Classifying privacy categories",
  ],
  stripping: [
    "Rebuilding image from pixel data",
    "Removing all embedded metadata",
    "Verifying cleaned output",
  ],
};

const TITLES: Record<ProcessingStateProps["mode"], string> = {
  uploading: "Uploading File",
  inspecting: "Inspecting Metadata",
  stripping: "Stripping metadata…",
};

export function ProcessingState({ mode, fileName }: ProcessingStateProps) {
  const steps = STEPS[mode];
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (mode === "stripping") {
      return;
    }
    setVisibleCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= steps.length) {
        clearInterval(timer);
      }
      setVisibleCount(i + 1);
    }, 600);
    return () => clearInterval(timer);
  }, [mode, steps.length]);

  if (mode === "stripping") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.35, ease }}
        className="text-center py-6"
      >
        <h2 className="text-xl font-bold text-text-heading mb-6">
          Stripping metadata…
        </h2>
        <div className="mb-4">
          <div className="progress-track shadow-inner overflow-hidden relative max-w-md mx-auto">
            <motion.div
              className="progress-fill absolute top-0 left-0"
              animate={{ width: ["5%", "65%", "35%", "85%", "50%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
        <p className="text-text-muted text-sm font-medium">
          Processing &lsquo;{fileName}&rsquo;
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-xl font-bold text-text-heading">
          {TITLES[mode]}
        </h2>
      </div>

      {/* Indeterminate progress bar */}
      <div className="mb-8">
        <div className="progress-track shadow-inner overflow-hidden relative">
          <motion.div
            className="progress-fill absolute top-0 left-0"
            animate={{ width: ["5%", "65%", "35%", "85%", "50%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <p className="text-text-muted text-sm mt-2.5 font-medium">
          Processing &lsquo;{fileName}&rsquo;&hellip;
        </p>
      </div>

      {/* Activity Log */}
      <div className="bg-surface-deep rounded-xl border border-border-default p-5 font-mono shadow-inner">
        <div className="text-xs text-text-muted mb-4 uppercase tracking-wider font-semibold">
          Activity Log
        </div>
        <div className="space-y-0.5">
          <AnimatePresence>
            {steps.map((text, idx) => (
              <motion.div
                key={`${mode}-${idx}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: idx < visibleCount ? 1 : 0.25,
                  x: 0,
                }}
                transition={{ duration: 0.3, ease }}
                className="log-row"
              >
                <div
                  className={`status-dot transition-all duration-400 ${
                    idx < visibleCount
                      ? "bg-accent-400 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse"
                      : "bg-text-faint"
                  }`}
                />
                <span
                  className={`transition-colors duration-300 text-[13px] ${
                    idx < visibleCount ? "text-text-heading" : "text-text-muted"
                  }`}
                >
                  {text}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
