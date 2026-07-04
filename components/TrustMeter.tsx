"use client";

import { motion } from "framer-motion";

function severityOf(score: number): { color: string; label: string; icon: string } {
  if (score >= 75) return { color: "var(--status-good)", label: "High trust", icon: "✓" };
  if (score >= 55) return { color: "var(--status-warning)", label: "Moderate trust", icon: "◐" };
  if (score >= 35) return { color: "var(--status-serious)", label: "Low trust", icon: "▲" };
  return { color: "var(--status-critical)", label: "Very low trust", icon: "✕" };
}

/** SVG arc gauge for a 0–100 trust score. Severity is carried by fill color
 *  AND an icon + label, never color alone. */
export default function TrustMeter({
  score,
  label = "Source trust",
}: {
  score: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const severity = severityOf(clamped);
  // 240° arc from 150° to 390°
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 240 / 360;
  const dashTotal = circumference * arcFraction;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${clamped} out of 100 — ${severity.label}`}>
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-[210deg]">
          {/* track */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#2c2c2a"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dashTotal} ${circumference}`}
          />
          {/* fill */}
          <motion.circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={severity.color}
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${(clamped / 100) * dashTotal} ${circumference}` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold">{clamped}</span>
          <span className="text-[10px] tracking-widest text-muted uppercase">/ 100</span>
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-secondary">
        <span style={{ color: severity.color }} aria-hidden>
          {severity.icon}
        </span>
        {severity.label}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
