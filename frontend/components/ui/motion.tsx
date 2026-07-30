"use client";

import { motion, type Variants } from "framer-motion";
import React from "react";

/* ── Easing presets ────────────────────────────────────── */
const ease = {
  smooth: [0.25, 0.1, 0.25, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  spring: { type: "spring" as const, stiffness: 260, damping: 25 },
};

/* ── FadeIn ────────────────────────────────────────────── */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  const offsets = {
    up: { y: 24 },
    down: { y: -24 },
    left: { x: 24 },
    right: { x: -24 },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: ease.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── SlideUp (scroll-triggered) ────────────────────────── */
export function SlideUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: ease.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── ScaleIn ───────────────────────────────────────────── */
export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: ease.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── StaggerContainer ──────────────────────────────────── */
const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        ...staggerContainerVariants,
        visible: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay + 0.1,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Hover scale wrapper ───────────────────────────────── */
export function HoverScale({
  children,
  className,
  scale = 1.02,
}: {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
