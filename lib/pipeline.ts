import { db } from "./db";
import { extractArticle, ScrapeError } from "./scraper";
import { extractClaims } from "./agents/claimAgent";
import { retrieveEvidence } from "./agents/retrievalAgent";
import { compareEvidence } from "./agents/comparisonAgent";
import { findMissingContext } from "./agents/contextAgent";
import { analyzeManipulation } from "./agents/biasAgent";
import { assessSource } from "./agents/sourceAgent";
import { synthesizeReport } from "./agents/verdictAgent";
import type { InvestigateInput } from "./validate";
import type { EvidenceItem, InvestigationStatus } from "./types";

/** Tiny concurrency limiter so we don't blast OpenAI/Tavily with 10 parallel calls. */
function pLimit(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    active--;
    queue.shift()?.();
  };
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= concurrency) await new Promise<void>((r) => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      next();
    }
  };
}

/** Interfaces lack the index signature Prisma's InputJsonValue wants — round-trip to plain JSON. */
function toJson<T>(value: T): import("@prisma/client").Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value));
}

async function setStatus(id: string, status: InvestigationStatus) {
  await db.investigation.update({ where: { id }, data: { status } });
}

/** Runs the full 8-agent investigation. Designed to be kicked off from the API
 *  route (via `after()`) while the client polls GET /api/investigation/[id]. */
export async function runInvestigation(id: string, input: InvestigateInput): Promise<void> {
  try {
    // 1. Extract article
    await setStatus(id, "extracting");
    const article = await extractArticle(input);
    await db.investigation.update({
      where: { id },
      data: {
        title: article.title,
        author: article.author,
        siteName: article.siteName,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
        articleText: article.text,
      },
    });

    // 2. Extract claims
    await setStatus(id, "claims");
    const claims = await extractClaims(article.text);
    const claimRows = await Promise.all(
      claims.map((c) =>
        db.claim.create({
          data: {
            investigationId: id,
            text: c.text,
            category: c.category,
            confidence: c.confidence,
          },
        })
      )
    );

    // 3. Retrieve evidence per claim
    await setStatus(id, "searching");
    const searchLimit = pLimit(4);
    const evidenceByClaim: EvidenceItem[][] = await Promise.all(
      claims.map((c) => searchLimit(() => retrieveEvidence(c.text)))
    );

    // 4. Compare evidence and store verdicts
    await setStatus(id, "comparing");
    // free-tier Gemini allows ~10 requests/min — keep LLM parallelism low
    const compareLimit = pLimit(2);
    const compared = await Promise.all(
      claims.map((c, i) =>
        compareLimit(async () => {
          const { verdict, evidence } = await compareEvidence(c.text, evidenceByClaim[i]);
          await db.claim.update({
            where: { id: claimRows[i].id },
            data: {
              verdict: verdict.verdict,
              confidence: verdict.confidence,
              reasoning: verdict.reasoning,
            },
          });
          if (evidence.length) {
            await db.evidence.createMany({
              data: evidence.map((e) => ({
                claimId: claimRows[i].id,
                source: e.source,
                domain: e.domain,
                title: e.title,
                text: e.text,
                publishedDate: e.publishedDate ? new Date(e.publishedDate) : null,
                similarity: e.similarity ?? null,
                relevance: e.relevance,
              })),
            });
          }
          return { claim: c, verdict, evidence };
        })
      )
    );

    // 5. Consensus: cross-source context + credibility analysis
    await setStatus(id, "consensus");
    const sourceDomain = article.url ? new URL(article.url).hostname.replace(/^www\./, "") : null;
    const [missingContext, source] = await Promise.all([
      findMissingContext(
        article.text,
        claims.map((c) => c.text)
      ),
      assessSource({
        domain: sourceDomain,
        isHttps: article.url?.startsWith("https:") ?? false,
        hasAuthor: !!article.author,
      }),
    ]);

    // 6. Manipulation analysis
    await setStatus(id, "manipulation");
    const manipulation = await analyzeManipulation(article.text);

    // 7. Synthesize final report
    await setStatus(id, "reporting");
    const report = await synthesizeReport({
      title: article.title,
      claims: compared.map(({ claim, verdict, evidence }) => ({
        ...claim,
        verdict,
        evidenceDomains: [...new Set(evidence.map((e) => e.domain))],
      })),
      manipulation,
      missingContext,
      source,
    });

    await db.report.create({
      data: {
        investigationId: id,
        scores: toJson(report.scores),
        explanation: toJson(report.explanation),
        manipulation: toJson(manipulation),
        missingContext: toJson(missingContext),
        sourceCredibility: toJson(source),
        overallVerdict: report.overallVerdict,
        summary: report.summary,
      },
    });

    await setStatus(id, "complete");
  } catch (err) {
    console.error(`Investigation ${id} failed:`, err);
    const message =
      err instanceof ScrapeError
        ? err.message
        : "The investigation hit an unexpected error. Please try again.";
    await db.investigation
      .update({ where: { id }, data: { status: "failed", error: message } })
      .catch(() => {});
  }
}
