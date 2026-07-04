"use client";

import { motion, AnimatePresence } from "framer-motion";
import { STATUS_STEPS, type InvestigationStatus } from "@/lib/types";

function stepIndex(status: InvestigationStatus): number {
  if (status === "pending") return -1;
  if (status === "complete") return STATUS_STEPS.length;
  const i = STATUS_STEPS.findIndex((s) => s.status === status);
  return i === -1 ? STATUS_STEPS.length : i;
}

export default function ProgressIndicator({ status }: { status: InvestigationStatus }) {
  const current = stepIndex(status);

  return (
    <ol className="flex w-full flex-col gap-2.5" aria-label="Investigation progress">
      {STATUS_STEPS.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "pending";
        return (
          <motion.li
            key={step.status}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: state === "pending" ? 0.45 : 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className={`relative flex items-center gap-4 overflow-hidden rounded-xl border px-4 py-3.5 transition-colors duration-500 ${
              state === "active"
                ? "scan-line border-accent/40 bg-accent/10"
                : state === "done"
                  ? "border-hairline bg-white/[0.04]"
                  : "border-transparent bg-white/[0.02]"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {step.emoji}
            </span>
            <span
              className={`flex-1 text-sm font-medium md:text-base ${
                state === "active" ? "text-foreground" : state === "done" ? "text-secondary" : "text-muted"
              }`}
            >
              {step.label}
              {state === "active" && (
                <span className="ml-1 inline-flex" aria-hidden>
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse [animation-delay:200ms]">.</span>
                  <span className="animate-pulse [animation-delay:400ms]">.</span>
                </span>
              )}
            </span>
            <AnimatePresence mode="wait">
              {state === "done" ? (
                <motion.span
                  key="done"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-good/20 text-sm text-good"
                  aria-label="done"
                >
                  ✓
                </motion.span>
              ) : state === "active" ? (
                <motion.span
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-5 w-5 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
                  aria-label="in progress"
                />
              ) : null}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ol>
  );
}
