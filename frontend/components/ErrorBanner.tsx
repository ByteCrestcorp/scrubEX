"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert, WifiOff } from "lucide-react";

interface ErrorBannerProps {
  variant: "rate_limited" | "blocked" | "server_error" | "network_error" | "turnstile_error";
  retryAfter?: number;
}

const config: Record<
  ErrorBannerProps["variant"],
  {
    Icon: typeof AlertTriangle;
    title: string;
    body: string | ((retryAfter?: number) => string);
    subtext?: string;
    bg: string;
    border: string;
    iconColor: string;
    titleColor: string;
    bodyColor: string;
  }
> = {
  rate_limited: {
    Icon: AlertTriangle,
    title: "Slow down a little",
    body: (retryAfter) =>
      `You\u2019ve made too many requests. Please wait ${retryAfter ?? 10} seconds.`,
    bg: "rgba(234, 179, 8, 0.08)",
    border: "rgba(234, 179, 8, 0.20)",
    iconColor: "var(--color-warning-400)",
    titleColor: "var(--color-warning-400)",
    bodyColor: "var(--color-text-body)",
  },
  blocked: {
    Icon: ShieldAlert,
    title: "Request blocked",
    body: "Your request was flagged by our security filter.",
    subtext: "If you believe this is an error, try again in a few minutes.",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.20)",
    iconColor: "var(--color-error-400)",
    titleColor: "var(--color-error-400)",
    bodyColor: "var(--color-text-body)",
  },
  server_error: {
    Icon: AlertTriangle,
    title: "Something went wrong",
    body: "We couldn\u2019t complete your request. Please try again.",
    bg: "rgba(107, 122, 142, 0.10)",
    border: "rgba(107, 122, 142, 0.20)",
    iconColor: "var(--color-text-muted)",
    titleColor: "var(--color-text-heading)",
    bodyColor: "var(--color-text-body)",
  },
  network_error: {
    Icon: WifiOff,
    title: "Something went wrong",
    body: "We couldn\u2019t complete your request. Please try again.",
    bg: "rgba(107, 122, 142, 0.10)",
    border: "rgba(107, 122, 142, 0.20)",
    iconColor: "var(--color-text-muted)",
    titleColor: "var(--color-text-heading)",
    bodyColor: "var(--color-text-body)",
  },
  turnstile_error: {
    Icon: ShieldAlert,
    title: "Verification failed",
    body: "Human verification failed or the service is not configured correctly. Please try again.",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.20)",
    iconColor: "var(--color-error-400)",
    titleColor: "var(--color-error-400)",
    bodyColor: "var(--color-text-body)",
  },
};

export function ErrorBanner({ variant, retryAfter }: ErrorBannerProps) {
  const c = config[variant];
  const bodyText =
    typeof c.body === "function" ? c.body(retryAfter) : c.body;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="mb-4 rounded-xl px-5 py-4"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-start gap-3">
        <c.Icon
          className="w-5 h-5 mt-0.5 shrink-0"
          style={{ color: c.iconColor }}
        />
        <div className="min-w-0">
          <p
            className="text-sm font-semibold"
            style={{ color: c.titleColor }}
          >
            {c.title}
          </p>
          <p
            className="text-sm mt-1 leading-relaxed"
            style={{ color: c.bodyColor }}
          >
            {bodyText}
          </p>
          {c.subtext && (
            <p
              className="text-xs mt-1.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              {c.subtext}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
