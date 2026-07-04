"use client";

interface TimelineEvent {
  date: string; // ISO
  label: string;
  detail?: string;
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Publication → evidence → investigation date progression. */
export default function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (sorted.length === 0) return null;

  return (
    <ol className="relative ml-2 border-l border-hairline pl-6">
      {sorted.map((e, i) => (
        <li key={i} className={i < sorted.length - 1 ? "pb-5" : ""}>
          <span
            className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-[#1a1a19]"
            aria-hidden
          />
          <div className="text-xs font-mono text-muted">{fmt(e.date)}</div>
          <div className="mt-0.5 text-sm font-medium text-foreground">{e.label}</div>
          {e.detail && <div className="mt-0.5 line-clamp-1 text-xs text-muted">{e.detail}</div>}
        </li>
      ))}
    </ol>
  );
}
