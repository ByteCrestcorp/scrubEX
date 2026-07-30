"use client";

import { MetadataStripper } from "@/features/metadata/metadata-stripper";
import { motion } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1] as const;

export function MetadataStripperPage() {
  return (
    <div className="flex-1 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-14 md:py-20 w-full flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-center mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-text-heading mb-3">
            Strip hidden metadata before sharing files.
          </h1>
          <p className="text-text-muted max-w-lg mx-auto leading-relaxed">
            Files carry information you never meant to share — device details, GPS
            coordinates, author fields, timestamps, and software history. ScrubEX
            removes it before you send.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
        >
          <MetadataStripper />
        </motion.div>
        <p className="text-text-muted text-sm text-center mt-8 max-w-md mx-auto leading-relaxed">
          Files are processed temporarily and removed after download. Nothing is
          retained.
        </p>
      </div>
    </div>
  );
}
