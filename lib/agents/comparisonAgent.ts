import { z } from "zod";
import { callAgent, embed, cosineSimilarity } from "./base";
import type { ClaimVerdict, EvidenceItem } from "../types";

const verdictSchema = z.object({
  verdict: z.enum(["Supported", "Contradicted", "Partially Supported", "Insufficient Evidence"]),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

const SYSTEM = `You are the Evidence Comparison Agent of TruthDNA, an automated news fact-checking system.

Compare a claim against retrieved evidence snippets and deliver a verdict:
- "Supported": multiple credible pieces of evidence corroborate the claim.
- "Contradicted": credible evidence directly refutes the claim.
- "Partially Supported": evidence confirms part of the claim, or confirms it with important caveats.
- "Insufficient Evidence": the evidence neither confirms nor refutes it.

Rules:
- Weigh evidence by source credibility and semantic similarity (provided per snippet).
- Never use your own world knowledge as the deciding factor — the evidence decides. If evidence is thin, say "Insufficient Evidence".
- confidence is 0-100: how sure you are in the verdict given this evidence.
- reasoning: 2-3 plain-language sentences citing which sources drove the verdict.`;

/** Embeds claim + evidence, annotates each evidence item with cosine similarity,
 *  then asks the model for a structured verdict. */
export async function compareEvidence(
  claimText: string,
  evidence: EvidenceItem[]
): Promise<{ verdict: ClaimVerdict; evidence: EvidenceItem[] }> {
  if (evidence.length === 0) {
    return {
      verdict: {
        verdict: "Insufficient Evidence",
        confidence: 25,
        reasoning: "No relevant evidence was found in trusted sources for this claim.",
      },
      evidence,
    };
  }

  let scored = evidence;
  try {
    const vectors = await embed([claimText, ...evidence.map((e) => e.text)]);
    const claimVec = vectors[0];
    scored = evidence.map((e, i) => ({
      ...e,
      similarity: Math.round(cosineSimilarity(claimVec, vectors[i + 1]) * 1000) / 1000,
    }));
  } catch (err) {
    console.error("Embedding similarity failed, proceeding without it:", err);
  }

  const evidenceBlock = scored
    .map(
      (e, i) =>
        `[${i + 1}] ${e.domain} — "${e.title}" (published: ${e.publishedDate ?? "unknown"}, similarity: ${
          e.similarity ?? "n/a"
        }, search relevance: ${e.relevance.toFixed(2)})\n${e.text}`
    )
    .join("\n\n");

  const verdict = await callAgent({
    agentName: "evidence_comparison",
    system: SYSTEM,
    input: `CLAIM: ${claimText}\n\nEVIDENCE:\n\n${evidenceBlock}`,
    schema: verdictSchema,
  });

  return { verdict, evidence: scored };
}
