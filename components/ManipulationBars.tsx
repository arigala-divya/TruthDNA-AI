"use client";

import { motion } from "framer-motion";
import type { ManipulationScores, ManipulationTechnique } from "@/lib/types";

const TECHNIQUES: { key: ManipulationTechnique; label: string }[] = [
  { key: "fear", label: "Fear" },
  { key: "urgency", label: "Urgency" },
  { key: "anger", label: "Anger" },
  { key: "cherry_picking", label: "Cherry-picking" },
  { key: "emotional_language", label: "Emotional language" },
  { key: "sensationalism", label: "Sensationalism" },
  { key: "authority_bias", label: "Authority bias" },
  { key: "false_dilemma", label: "False dilemma" },
  { key: "conspiracy_language", label: "Conspiracy language" },
];

function severity(v: number): { color: string; icon: string; label: string } {
  if (v < 25) return { color: "var(--status-good)", icon: "✓", label: "minimal" };
  if (v < 50) return { color: "var(--status-warning)", icon: "◐", label: "noticeable" };
  if (v < 75) return { color: "var(--status-serious)", icon: "▲", label: "heavy" };
  return { color: "var(--status-critical)", icon: "✕", label: "extreme" };
}

/** Nine manipulation-technique meters. Fill color carries severity and is
 *  always paired with the numeric value + severity word (never color alone). */
export default function ManipulationBars({ scores }: { scores: ManipulationScores }) {
  return (
    <div className="flex flex-col gap-3">
      {TECHNIQUES.map((t, i) => {
        const value = Math.round(scores[t.key] ?? 0);
        const sev = severity(value);
        return (
          <div key={t.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-secondary">{t.label}</span>
              <span className="text-muted">
                <span aria-hidden style={{ color: sev.color }}>
                  {sev.icon}
                </span>{" "}
                {value} · {sev.label}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/[0.07]"
              role="meter"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${t.label}: ${value} out of 100 (${sev.label})`}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: sev.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(value, 2)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
      {scores.notes && (
        <p className="mt-2 border-t border-hairline pt-3 text-xs leading-relaxed text-muted">
          {scores.notes}
        </p>
      )}
    </div>
  );
}
