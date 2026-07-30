"use client";

import Link from "next/link";
import { Shield, ChevronDown, CheckCircle2, Ban } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useRef, useEffect } from "react";

const ease = [0.25, 0.1, 0.25, 1] as const;

export default function Home() {
  return (
    <div className="flex-1 w-full flex flex-col items-center relative overflow-hidden bg-bg-deep">
      {/* Background Orbs — ambient drift */}
      <motion.div
        className="absolute top-[15%] left-[15%] w-[600px] h-[600px] bg-primary-800/8 rounded-full blur-[160px] pointer-events-none"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 15, 0],
          scale: [1, 1.05, 0.97, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-[25%] right-[10%] w-[500px] h-[500px] bg-accent-700/6 rounded-full blur-[160px] pointer-events-none"
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 20, -15, 0],
          scale: [1, 0.96, 1.04, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* ════ HERO SECTION ════ */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-24 px-5 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto z-10 text-center flex flex-col items-center">
        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-[1.75rem] sm:text-4xl md:text-[3.25rem] font-bold tracking-[0.06em] leading-[1.15] mb-5 uppercase bg-gradient-to-r from-white via-primary-200 to-accent-400 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Typewriter text="Private tools. Nothing collected." speed={80} />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="text-base md:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Strip hidden metadata from images and PDFs before sharing them —
            no accounts, no tracking, no user-data collection.
          </motion.p>
        </div>

        {/* Tool Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease }}
          className="w-full max-w-sm mt-14 md:mt-16 relative"
        >
          <div className="absolute inset-0 bg-primary-600/4 rounded-3xl blur-[80px] -z-10" />
          <div className="bg-surface-deep/50 backdrop-blur-xl rounded-2xl border border-border-default/40 p-7 sm:p-8 flex flex-col items-center text-center transition-all duration-400 hover:border-primary-500/35 hover:bg-surface-deep/70 hover:shadow-[0_8px_40px_rgba(59,89,152,0.12)] group">
            <motion.div
              className="w-[4.5rem] h-[4.5rem] flex items-center justify-center mb-5 rounded-full bg-primary-900/30 border border-primary-700/20 transition-all duration-400 group-hover:bg-primary-900/50 group-hover:border-primary-600/30 group-hover:shadow-[0_0_20px_rgba(59,89,152,0.2)]"
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Shield className="w-9 h-9 text-primary-400 stroke-[1.5]" />
            </motion.div>
            <h3 className="text-lg font-bold text-text-heading mb-2.5">
              Metadata Stripper
            </h3>
            <p className="text-text-muted text-sm mb-7 leading-relaxed font-medium max-w-[280px]">
              Remove hidden metadata from files before sharing. Device info,
              GPS, author tags, timestamps — stripped clean.
            </p>
            <Link href="/tools/scrubex" className="w-full sm:w-auto min-w-[170px]">
              <button
                type="button"
                className="w-full bg-primary-600 hover:bg-primary-500 text-text-heading font-semibold text-sm py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm shadow-primary-900/20 hover:shadow-md hover:shadow-primary-900/30 hover:-translate-y-px active:translate-y-0"
              >
                Clean a file
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <HowItWorks />

      {/* ════ PRIVACY PROMISE ════ */}
      <PrivacyPromise />
    </div>
  );
}

/* ── How It Works ──────────────────────────────────────────── */

function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-16 md:py-20 w-full max-w-4xl mx-auto px-5 z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease }}
        className="text-center mb-10"
      >
        <span className="text-text-muted text-sm font-medium tracking-wide">How it works</span>
      </motion.div>

      <div className="flex flex-col md:flex-row items-center justify-between relative gap-6 md:gap-0">
        <ProcessStep number="1" text="Upload a file" delay={0.1} isInView={isInView} />
        <StepConnector isInView={isInView} delay={0.2} />
        <ProcessStep number="2" text="Review what's hidden" delay={0.3} isInView={isInView} />
        <StepConnector isInView={isInView} delay={0.4} />
        <ProcessStep
          number="3"
          text="Download the clean file"
          subtext="We don't keep a copy."
          delay={0.5}
          isInView={isInView}
        />
      </div>
    </section>
  );
}

function ProcessStep({
  number,
  text,
  subtext,
  delay,
  isInView,
}: {
  number: string;
  text: string;
  subtext?: string;
  delay: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease }}
      className="flex flex-col items-center text-center text-sm z-10 w-48 font-medium"
    >
      <span className="text-text-heading">
        {number}. {text}
      </span>
      {subtext && <span className="text-text-muted mt-1 text-xs">{subtext}</span>}
    </motion.div>
  );
}

function StepConnector({ isInView, delay }: { isInView: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
      transition={{ duration: 0.5, delay, ease }}
      className="hidden md:flex flex-1 items-center justify-center px-4 relative origin-left"
    >
      <div className="w-full h-[1.5px] bg-gradient-to-r from-primary-700/80 to-primary-400/60 relative flex items-center justify-end">
        <div className="absolute right-0 w-2 h-2 border-t border-r border-primary-400/60 rotate-45 translate-x-[2px] -translate-y-[0.5px]" />
      </div>
    </motion.div>
  );
}

/* ── Privacy Promise ───────────────────────────────────────── */

function PrivacyPromise() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-16 md:py-20 w-full max-w-2xl mx-auto px-5 z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease }}
      >
        <span className="text-text-muted text-sm font-medium block mb-3 tracking-wide">Trust</span>
        <h2
          className="text-2xl md:text-3xl font-bold tracking-[0.12em] text-text-heading uppercase mb-14"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          We don&rsquo;t collect your data
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.15, ease }}
        className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-14 mb-16"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary-400" />
          </div>
          <span className="text-text-heading font-semibold text-sm">No sign-up required</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-900/40 flex items-center justify-center">
            <Ban className="w-5 h-5 text-primary-400" />
          </div>
          <span className="text-text-heading font-semibold text-sm">No behavioral tracking</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.25, ease }}
        className="text-left flex flex-col gap-px bg-border-default/20 border border-border-default/30 rounded-xl overflow-hidden"
      >
        <FaqItem
          question="What happens to files I upload?"
          answer="They are processed for the task and not kept as a long-term copy. Details are in the Privacy Model."
          defaultOpen
        />
        <FaqItem
          question="How is this free?"
          answer="ScrubEX is free to use with no account. There are no premium tiers funded by selling your data."
        />
        <FaqItem
          question="Where can I read more?"
          answer={
            <>
              See the{" "}
              <Link href="/privacy" className="text-primary-400 hover:underline">
                Privacy Model
              </Link>
              .
            </>
          }
        />
      </motion.div>
    </section>
  );
}

function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface-deep/60">
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-text-heading cursor-pointer hover:bg-surface-mid/40 transition-colors duration-200 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform duration-300 shrink-0 ml-4 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={defaultOpen}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-sm text-text-muted leading-relaxed font-medium">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Typewriter ────────────────────────────────────────── */

function Typewriter({ text, speed = 50 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <>
      {displayed}
      <span
        className={`inline-block w-[3px] h-[0.85em] bg-accent-400 ml-1 align-middle rounded-sm ${done ? "animate-pulse" : ""}`}
        style={{ animationDuration: "1s" }}
      />
    </>
  );
}
