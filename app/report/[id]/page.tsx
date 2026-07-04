import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import ReportDashboard from "@/components/ReportDashboard";
import type { SerializedInvestigation, SerializedReport } from "@/lib/serialized";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const inv = await db.investigation.findUnique({
    where: { id },
    include: {
      claims: {
        include: { evidence: { orderBy: { relevance: "desc" } } },
      },
      report: true,
    },
  });

  if (!inv) notFound();
  if (!inv.report) {
    // report not ready yet — send them back to the live progress view
    redirect(`/investigate/${id}`);
  }

  const serialized: SerializedInvestigation = {
    id: inv.id,
    url: inv.url,
    title: inv.title,
    author: inv.author,
    siteName: inv.siteName,
    publishedAt: inv.publishedAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    claims: inv.claims.map((c) => ({
      id: c.id,
      text: c.text,
      category: c.category,
      verdict: c.verdict,
      confidence: c.confidence,
      reasoning: c.reasoning,
      evidence: c.evidence.map((e) => ({
        id: e.id,
        source: e.source,
        domain: e.domain,
        title: e.title,
        text: e.text,
        publishedDate: e.publishedDate?.toISOString() ?? null,
        similarity: e.similarity,
        relevance: e.relevance,
      })),
    })),
    report: {
      scores: inv.report.scores,
      explanation: inv.report.explanation,
      manipulation: inv.report.manipulation,
      missingContext: inv.report.missingContext,
      sourceCredibility: inv.report.sourceCredibility,
      overallVerdict: inv.report.overallVerdict,
      summary: inv.report.summary,
    } as unknown as SerializedReport,
  };

  return <ReportDashboard inv={serialized} />;
}
