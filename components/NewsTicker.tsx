"use client";

/** Ambient rows of scrolling headline fragments behind the hero —
 *  the "world's news flowing past" effect. Pure CSS animation, aria-hidden. */

const HEADLINES: string[][] = [
  [
    "BREAKING: Markets react to central bank decision",
    "Study finds link between sleep and memory",
    "Election results contested in three districts",
    "New vaccine rollout begins nationwide",
    "Tech giant announces record quarterly earnings",
    "Climate summit ends without binding agreement",
  ],
  [
    "Sources say merger talks have stalled",
    "Officials deny reports of policy reversal",
    "Viral video claims debunked by experts",
    "Report: unemployment falls to decade low",
    "Leaked memo sparks parliamentary inquiry",
    "Scientists observe rare deep-sea phenomenon",
  ],
  [
    "Fact-checkers flag misleading statistics",
    "Eyewitness accounts conflict with official story",
    "Anonymous claims spread across social media",
    "Independent audit confirms initial findings",
    "Correction issued after mistaken attribution",
    "Analysts question survey methodology",
  ],
];

export default function NewsTicker() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-20 flex flex-col justify-between overflow-hidden py-[8vh]"
      style={{
        maskImage: "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 30%, black 85%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 30%, black 85%)",
      }}
    >
      {HEADLINES.map((row, i) => (
        <div
          key={i}
          className={`ticker-row ${i % 2 === 1 ? "reverse" : ""}`}
          style={{ "--ticker-duration": `${70 + i * 25}s` } as React.CSSProperties}
        >
          {/* duplicate row so the -50% translate loops seamlessly */}
          {[...row, ...row].map((headline, j) => (
            <span
              key={j}
              className="text-2xl font-semibold tracking-tight text-white/[0.05] md:text-4xl"
            >
              {headline}
              <span className="mx-6 text-accent/20">◆</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
