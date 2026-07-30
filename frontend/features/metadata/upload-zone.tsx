"use client";

import { useCallback, useState } from "react";
import { CloudUpload } from "lucide-react";
import { motion } from "framer-motion";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_EXTENSIONS_LABEL,
} from "./types";

const ease = [0.25, 0.1, 0.25, 1] as const;

function validateFile(f: File): string | null {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.type)) {
    return "Unsupported file type. Try JPG, PNG, PDF, or WebP.";
  }
  if (f.size > MAX_FILE_SIZE_BYTES) {
    return "File exceeds the 20 MB limit.";
  }
  return null;
}

export function UploadZone({ onFileSelect }: { onFileSelect: (f: File) => void }) {
  const [isHover, setIsHover] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const trySelect = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setValidationError(err);
        return;
      }
      setValidationError(null);
      onFileSelect(f);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsHover(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        trySelect(e.dataTransfer.files[0]);
      }
    },
    [trySelect],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      trySelect(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease }}
    >
      <label
        onDragOver={(e) => { e.preventDefault(); setIsHover(true); }}
        onDragLeave={() => setIsHover(false)}
        onDrop={handleDrop}
        className={`drop-zone block relative overflow-hidden group cursor-pointer transition-all duration-300 ${
          isHover
            ? 'border-primary-400 bg-primary-500/8 shadow-[0_0_30px_rgba(59,89,152,0.12)]'
            : 'hover:border-primary-500/50 hover:bg-surface-deep/50'
        }`}
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />

        <div className="py-4">
          <motion.div
            animate={{ y: isHover ? -6 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-16 h-16 bg-surface-raised/80 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary-500/15 transition-colors duration-300 border border-border-subtle"
          >
            <CloudUpload className={`w-8 h-8 transition-colors duration-300 ${isHover ? 'text-primary-300' : 'text-primary-400'}`} />
          </motion.div>

          <p className="text-text-heading font-semibold text-lg mb-1.5">
            Drop a file here, or click to upload
          </p>
          <div className="mb-5">
            <span className="cta-accent inline-flex pointer-events-none text-sm py-2 px-5 rounded-lg shadow-sm">
              Browse files
            </span>
          </div>
          <p className="text-text-muted text-sm">
            Supported: {SUPPORTED_EXTENSIONS_LABEL} — up to 20 MB
          </p>
        </div>

        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/tiff,image/heic,application/pdf,.jpg,.jpeg,.png,.webp,.pdf,.tif,.tiff,.heic"
          onChange={handleChange}
        />
      </label>

      {validationError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm mt-3 text-center font-medium"
        >
          {validationError}
        </motion.p>
      )}
    </motion.div>
  );
}
