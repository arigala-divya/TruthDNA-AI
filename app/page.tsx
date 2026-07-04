"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FluidBackground from "@/components/FluidBackground";
import NewsTicker from "@/components/NewsTicker";

type Mode = "url" | "text";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [articleText, setArticleText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startInvestigation() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "url" ? { url: url.trim() || null } : { articleText: articleText.trim() || null }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/investigate/${data.id}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <FluidBackground />
      <NewsTicker />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex w-full max-w-3xl flex-col items-center text-center"
      >
        <div className="mb-6 flex items-center gap-2 rounded-full border border-hairline bg-white/[0.04] px-4 py-1.5 text-xs font-medium tracking-widest text-secondary uppercase backdrop-blur">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-accent" />
          Autonomous fact-checking · 8 AI agents
        </div>

        <h1 className="gradient-text text-5xl font-bold tracking-tight md:text-7xl">
          TruthDNA
        </h1>
        <p className="mt-5 max-w-xl text-base text-secondary md:text-lg">
          Paste a news story. Eight AI agents extract its claims, hunt down evidence across
          trusted sources, and sequence its <span className="text-foreground">genetic code of truth</span> —
          six forensic metrics in under a minute.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="glass mt-10 w-full p-6 text-left md:p-8"
        >
          <div className="mb-5 flex gap-2" role="tablist" aria-label="Input type">
            {(
              [
                { key: "url", label: "🔗 Article URL" },
                { key: "text", label: "📋 Paste text" },
              ] as { key: Mode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => setMode(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === tab.key
                    ? "bg-accent/20 text-foreground ring-1 ring-accent/50"
                    : "text-muted hover:bg-white/5 hover:text-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === "url" ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && startInvestigation()}
              placeholder="https://example.com/news/story-to-verify"
              className="w-full rounded-xl border border-hairline bg-black/40 px-4 py-3.5 text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          ) : (
            <textarea
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              placeholder="Paste the full article text here (up to 50,000 characters)…"
              rows={8}
              className="w-full resize-y rounded-xl border border-hairline bg-black/40 px-4 py-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          )}

          {error && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-serious">
              <span aria-hidden>⚠️</span> {error}
            </p>
          )}

          <button
            onClick={startInvestigation}
            disabled={loading}
            className="glow-button mt-6 w-full rounded-xl bg-gradient-to-r from-accent to-[#9085e9] px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Deploying agents…
              </span>
            ) : (
              "🔎 Start Investigation"
            )}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-10 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3"
        >
          {[
            { emoji: "🧩", title: "Claim extraction", desc: "Every checkable assertion isolated and categorized" },
            { emoji: "🌐", title: "Trusted evidence", desc: "Reuters, AP, BBC, WHO, PIB, FactCheck.org, Snopes" },
            { emoji: "🧬", title: "Six-metric DNA", desc: "Reliability, evidence, source trust, manipulation, context, consensus" },
          ].map((f) => (
            <div key={f.title} className="glass p-4">
              <div className="text-xl">{f.emoji}</div>
              <div className="mt-2 text-sm font-semibold">{f.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted">{f.desc}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </main>
  );
}
