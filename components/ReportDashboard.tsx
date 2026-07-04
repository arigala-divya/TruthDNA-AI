"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ScoreChart from "./ScoreChart";
import TrustMeter from "./TrustMeter";
import ClaimCard from "./ClaimCard";
import Timeline from "./Timeline";
import ManipulationBars from "./ManipulationBars";
import type { SerializedInvestigation } from "@/lib/serialized";
import type { TruthDNAScore } from "@/lib/types";

const METRIC_ORDER: { key: keyof TruthDNAScore; label: string }[] = [
  { key: "reliability", label: "Reliability" },
  { key: "evidence", label: "Evidence" },
  { key: "sourceTrust", label: "Source Trust" },
  { key: "manipulation", label: "Clean of Manipulation" },
  { key: "context", label: "Context" },
  { key: "consensus", label: "Consensus" },
];

const SEVERITY_BADGE: Record<string, string> = {
  high: "bg-critical/15 text-critical ring-critical/40",
  medium: "bg-serious/15 text-serious ring-serious/40",
  low: "bg-warning/15 text-warning ring-warning/40",
};

function verdictTone(reliability: number) {
  if (reliability >= 70) return { color: "var(--status-good)", icon: "✓" };
  if (reliability >= 45) return { color: "var(--status-warning)", icon: "◐" };
  return { color: "var(--status-critical)", icon: "✕" };
}

export default function ReportDashboard({ inv }: { inv: SerializedInvestigation }) {
  const { report } = inv;
  const tone = verdictTone(report.scores.reliability);
  const cred = report.sourceCredibility;

  const timelineEvents = [
    ...(inv.publishedAt
      ? [{ date: inv.publishedAt, label: "Article published", detail: inv.siteName ?? undefined }]
      : []),
    ...inv.claims
      .flatMap((c) => c.evidence)
      .filter((e) => e.publishedDate)
      .sort((a, b) => Date.parse(a.publishedDate!) - Date.parse(b.publishedDate!))
      .slice(0, 4)
      .map((e) => ({
        date: e.publishedDate!,
        label: `Evidence: ${e.domain}`,
        detail: e.title ?? undefined,
      })),
    { date: inv.createdAt, label: "TruthDNA investigation", detail: "This report" },
  ];

  const credMetrics: { label: string; value: number }[] = [
    { label: "Domain reputation", value: cred.metrics.domainReputation },
    { label: "HTTPS / SSL", value: cred.metrics.httpsSsl },
    { label: "Author verifiable", value: cred.metrics.authorVerifiable },
    { label: "Editorial policy", value: cred.metrics.editorialPolicy },
    { label: "Fact-check history", value: cred.metrics.factCheckHistory },
    { label: "Transparency", value: cred.metrics.transparency },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      {/* header */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-muted transition-colors hover:text-secondary">
            ← New investigation
          </Link>
          <span className="rounded-full border border-hairline bg-white/[0.04] px-3 py-1 text-[11px] tracking-widest text-muted uppercase">
            🧬 TruthDNA Report
          </span>
        </div>
        <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight md:text-4xl">
          {inv.title ?? "Untitled article"}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {inv.siteName && <span>{inv.siteName}</span>}
          {inv.author && <span>by {inv.author}</span>}
          {inv.publishedAt && (
            <span>
              {new Date(inv.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {inv.url && (
            <a
              href={inv.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              original ↗
            </a>
          )}
        </div>
      </motion.header>

      {/* overall verdict banner */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass mt-8 flex flex-col gap-4 p-6 md:flex-row md:items-center md:gap-8 md:p-8"
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold"
            style={{ background: `color-mix(in srgb, ${tone.color} 18%, transparent)`, color: tone.color }}
            aria-hidden
          >
            {tone.icon}
          </span>
          <div>
            <div className="text-[11px] tracking-widest text-muted uppercase">Overall verdict</div>
            <div className="text-xl font-bold md:text-2xl" style={{ color: tone.color }}>
              {report.overallVerdict}
            </div>
          </div>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-secondary md:text-[15px]">
          {report.summary}
        </p>
      </motion.section>

      {/* radar + metric explanations */}
      <section className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="glass p-5 lg:col-span-3 md:p-6">
          <h2 className="text-sm font-semibold tracking-widest text-muted uppercase">
            TruthDNA profile
          </h2>
          <ScoreChart scores={report.scores} />
        </div>
        <div className="glass p-5 lg:col-span-2 md:p-6">
          <h2 className="text-sm font-semibold tracking-widest text-muted uppercase">
            Six metrics explained
          </h2>
          <dl className="mt-4 flex flex-col gap-4">
            {METRIC_ORDER.map((m) => (
              <div key={m.key}>
                <dt className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">{m.label}</span>
                  <span className="font-mono text-secondary">
                    {Math.round(report.scores[m.key])}
                    <span className="text-muted">/100</span>
                  </span>
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-muted">
                  {report.explanation[m.key]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* claims */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold tracking-tight md:text-xl">
          🧩 Claims under the microscope{" "}
          <span className="text-sm font-normal text-muted">({inv.claims.length})</span>
        </h2>
        <div className="flex flex-col gap-3">
          {inv.claims.map((claim, i) => (
            <ClaimCard key={claim.id} claim={claim} index={i} />
          ))}
        </div>
      </section>

      {/* manipulation + source credibility + timeline */}
      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="glass p-5 md:p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-widest text-muted uppercase">
            🧠 Manipulation breakdown
          </h2>
          <ManipulationBars scores={report.manipulation} />
        </div>

        <div className="glass p-5 md:p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-widest text-muted uppercase">
            🛡️ Source credibility
          </h2>
          <div className="flex justify-center">
            <TrustMeter score={cred.trustScore} label={cred.domain} />
          </div>
          <dl className="mt-5 flex flex-col gap-2 border-t border-hairline pt-4">
            {credMetrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between text-xs">
                <dt className="text-muted">{m.label}</dt>
                <dd className="font-mono text-secondary">{Math.round(m.value)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-muted">{cred.notes}</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass p-5 md:p-6">
            <h2 className="mb-4 text-sm font-semibold tracking-widest text-muted uppercase">
              🕰️ Timeline
            </h2>
            <Timeline events={timelineEvents} />
          </div>

          <div className="glass flex-1 p-5 md:p-6">
            <h2 className="mb-3 text-sm font-semibold tracking-widest text-muted uppercase">
              🧭 Missing context
            </h2>
            {report.missingContext.length === 0 ? (
              <p className="text-sm text-secondary">
                <span className="text-good" aria-hidden>
                  ✓
                </span>{" "}
                No significant missing context detected.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {report.missingContext.map((item, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ${
                          SEVERITY_BADGE[item.severity] ?? SEVERITY_BADGE.low
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="font-medium text-foreground">{item.issue}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{item.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-hairline pt-6 text-center text-xs text-muted">
        Generated by TruthDNA&apos;s eight-agent investigation pipeline. AI-assisted analysis — verify
        critical decisions against primary sources.
      </footer>
    </main>
  );
}
