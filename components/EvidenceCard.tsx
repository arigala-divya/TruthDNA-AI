import type { SerializedEvidence } from "@/lib/serialized";

export default function EvidenceCard({ evidence }: { evidence: SerializedEvidence }) {
  return (
    <a
      href={evidence.source}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-hairline bg-black/30 p-3 transition-colors hover:border-accent/40 hover:bg-accent/5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-accent">{evidence.domain}</span>
        {evidence.publishedDate && (
          <span className="shrink-0 text-[11px] text-muted">
            {new Date(evidence.publishedDate).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
      {evidence.title && (
        <div className="mt-1 line-clamp-1 text-xs font-medium text-secondary">{evidence.title}</div>
      )}
      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted">{evidence.text}</p>
      {evidence.similarity != null && (
        <div className="mt-2 text-[11px] text-muted">
          semantic match{" "}
          <span className="font-mono text-secondary">{Math.round(evidence.similarity * 100)}%</span>
        </div>
      )}
    </a>
  );
}
