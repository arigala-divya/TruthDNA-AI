/** Verdict badges pair a status color with an icon + label — never color alone. */
export const VERDICT_STYLES: Record<
  string,
  { icon: string; className: string; bar: string }
> = {
  Supported: {
    icon: "✓",
    className: "bg-good/15 text-good ring-good/40",
    bar: "var(--status-good)",
  },
  Contradicted: {
    icon: "✕",
    className: "bg-critical/15 text-critical ring-critical/40",
    bar: "var(--status-critical)",
  },
  "Partially Supported": {
    icon: "◐",
    className: "bg-warning/15 text-warning ring-warning/40",
    bar: "var(--status-warning)",
  },
  "Insufficient Evidence": {
    icon: "?",
    className: "bg-white/10 text-secondary ring-white/20",
    bar: "#898781",
  },
};

export const CATEGORY_EMOJI: Record<string, string> = {
  Fact: "📌",
  Opinion: "💭",
  Prediction: "🔮",
  Statistic: "📊",
  Quotation: "❝",
  Speculation: "🌫️",
  Allegation: "⚡",
};
