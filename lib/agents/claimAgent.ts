import { z } from "zod";
import { callAgent } from "./base";
import type { ExtractedClaim } from "../types";

const claimSchema = z.object({
  claims: z
    .array(
      z.object({
        id: z.number().int(),
        text: z.string(),
        category: z.enum([
          "Fact",
          "Opinion",
          "Prediction",
          "Statistic",
          "Quotation",
          "Speculation",
          "Allegation",
        ]),
        confidence: z.number().min(0).max(1),
      })
    )
    .min(1)
    .max(10),
});

const SYSTEM = `You are the Claim Extraction Agent of TruthDNA, an automated news fact-checking system.

Extract the 5-10 most significant, checkable claims from the article. Rules:
- Each claim must be a single, self-contained, verifiable statement. Resolve pronouns and add missing context (who/what/when/where) so the claim stands alone.
- Prioritize claims central to the article's thesis; skip trivia.
- Categorize each claim: Fact (asserted as objectively true), Opinion, Prediction, Statistic (numeric assertion), Quotation (attributed statement), Speculation, or Allegation (unproven accusation).
- confidence (0-1) is YOUR confidence that the extraction and category are correct — not whether the claim is true.
- Number ids from 1.`;

export async function extractClaims(articleText: string): Promise<ExtractedClaim[]> {
  const { claims } = await callAgent({
    agentName: "claim_extraction",
    system: SYSTEM,
    input: `ARTICLE:\n\n${articleText.slice(0, 24000)}`,
    schema: claimSchema,
  });
  return claims;
}
