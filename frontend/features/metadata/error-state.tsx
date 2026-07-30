"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import type { AppError } from "./types";

const ease = [0.25, 0.1, 0.25, 1] as const;

export function ErrorState({
  error,
  onReset,
}: {
  error: AppError;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease }}
      className="text-center py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5"
      >
        <AlertCircle className="w-8 h-8 text-red-400" />
      </motion.div>

      <h3 className="text-xl font-bold text-text-heading mb-2">
        Something went wrong
      </h3>

      <p className="text-text-muted text-sm mb-1 max-w-sm mx-auto">
        {error.message}
      </p>

      {error.detail && (
        <p className="text-text-faint text-xs mb-6 max-w-sm mx-auto">
          {error.detail}
        </p>
      )}

      {!error.detail && <div className="mb-6" />}

      <Button variant="outline" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </motion.div>
  );
}
