"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import FluidBackground from "@/components/FluidBackground";
import ProgressIndicator from "@/components/ProgressIndicator";
import type { InvestigationStatus } from "@/lib/types";

const POLL_MS = 1500;

export default function InvestigatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<InvestigationStatus>("pending");
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/investigation/${id}`, { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 404) setError("Investigation not found.");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.status);
        if (data.title) setTitle(data.title);
        if (data.status === "complete") {
          setTimeout(() => router.replace(`/report/${id}`), 900);
          return;
        }
        if (data.status === "failed") {
          setError(data.error ?? "The investigation failed. Please try again.");
          return;
        }
      } catch {
        // transient network error — keep polling
      }
      if (!cancelled) timer.current = setTimeout(poll, POLL_MS);
    }

    poll();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [id, router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <FluidBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.04] px-4 py-1.5 text-xs font-medium tracking-widest text-secondary uppercase">
            <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-accent" />
            Investigation in progress
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {status === "complete" ? (
              <span className="text-good">Report ready — opening…</span>
            ) : (
              <span className="gradient-text">Sequencing the truth</span>
            )}
          </h1>
          {title && (
            <p className="mx-auto mt-2 line-clamp-2 max-w-md text-sm text-muted">“{title}”</p>
          )}
        </div>

        {error ? (
          <div className="glass p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-serious">
              <span aria-hidden>⚠️</span> {error}
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-accent/20 px-5 py-2.5 text-sm font-medium text-foreground ring-1 ring-accent/50 transition-colors hover:bg-accent/30"
            >
              ← Start a new investigation
            </Link>
          </div>
        ) : (
          <div className="glass p-5 md:p-6">
            <ProgressIndicator status={status} />
          </div>
        )}
      </motion.div>
    </main>
  );
}
