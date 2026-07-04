"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import EvidenceCard from "./EvidenceCard";
import { VERDICT_STYLES, CATEGORY_EMOJI } from "./verdictStyles";
import type { SerializedClaim } from "@/lib/serialized";

export default function ClaimCard({ claim, index }: { claim: SerializedClaim; index: number }) {
  const [open, setOpen] = useState(false);
  const style = VERDICT_STYLES[claim.verdict ?? "Insufficient Evidence"] ?? VERDICT_STYLES["Insufficient Evidence"];
  const topEvidence = claim.evidence.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 4) * 0.05 }}
      className="glass overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.03] md:p-5"
        aria-expanded={open}
      >
        <span className="mt-0.5 text-lg" aria-hidden>
          {CATEGORY_EMOJI[claim.category] ?? "📌"}
        </span>
        <span className="flex-1">
          <span className="block text-sm leading-relaxed text-foreground md:text-[15px]">
            {claim.text}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-secondary">
              {claim.category}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${style.className}`}
            >
              <span aria-hidden>{style.icon}</span>
              {claim.verdict ?? "Insufficient Evidence"}
            </span>
            {claim.confidence != null && claim.confidence > 1 && (
              <span className="text-[11px] text-muted">{Math.round(claim.confidence)}% confidence</span>
            )}
            {topEvidence.length > 0 && (
              <span className="text-[11px] text-muted">
                {topEvidence.length} source{topEvidence.length > 1 ? "s" : ""}
              </span>
            )}
          </span>
        </span>
        <span
          className={`mt-1 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-hairline px-4 pb-4 md:px-5 md:pb-5">
          {claim.reasoning && (
            <p className="mt-3 text-sm leading-relaxed text-secondary">{claim.reasoning}</p>
          )}
          {topEvidence.length > 0 ? (
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {topEvidence.map((e) => (
                <EvidenceCard key={e.id} evidence={e} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">No evidence found in trusted sources.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
