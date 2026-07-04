import { z } from "zod";
import { callAgent } from "./base";
import type {
  ClaimVerdict,
  ExtractedClaim,
  FinalReport,
  ManipulationScores,
  MissingContextItem,
  SourceCredibility,
} from "../types";

const reportSchema = z.object({
  scores: z.object({
    reliability: z.number().min(0).max(100),
    evidence: z.number().min(0).max(100),
    sourceTrust: z.number().min(0).max(100),
    manipulation: z.number().min(0).max(100),
    context: z.number().min(0).max(100),
    consensus: z.number().min(0).max(100),
  }),
  explanation: z.object({
    reliability: z.string(),
    evidence: z.string(),
    sourceTrust: z.string(),
    manipulation: z.string(),
    context: z.string(),
    consensus: z.string(),
  }),
  overallVerdict: z.string(),
  summary: z.string(),
});

const SYSTEM = `You are the Verdict Synthesis Agent of TruthDNA, an automated news fact-checking system. Produce the final TruthDNA report from all agent outputs.

Six scores, 0-100, where HIGHER IS ALWAYS BETTER (a clean, accurate article scores high on everything):
- reliability: overall trustworthiness of the article, all signals combined
- evidence: how well the article's claims are backed by retrieved evidence (weight of Supported vs Contradicted verdicts, evidence quality and quantity)
- sourceTrust: adopt the source credibility agent's trustScore, adjusted only if other signals strongly conflict
- manipulation: INVERTED cleanliness score — 100 means no manipulation detected, 0 means heavy manipulation (use 100 minus the overall manipulation score as your anchor)
- context: INVERTED completeness score — 100 means no important context missing, reduced by the number and severity of missing-context items
- consensus: how strongly independent trusted sources agree with the article's claims (many Supported verdicts from distinct reputable domains = high; Contradicted or thin coverage = low)

Explanations: 1-2 plain sentences per metric, concrete, referencing actual findings (name claims/sources where relevant).
overallVerdict: one short label like "Largely Accurate", "Mixed Accuracy", "Misleading", "Mostly False", "Unverifiable".
summary: 3-5 sentences a general reader would understand — what the article says, what checks found, and the bottom line.`;

export async function synthesizeReport(input: {
  title: string;
  claims: (ExtractedClaim & { verdict: ClaimVerdict; evidenceDomains: string[] })[];
  manipulation: ManipulationScores;
  missingContext: MissingContextItem[];
  source: SourceCredibility;
}): Promise<FinalReport> {
  const claimsBlock = input.claims
    .map(
      (c) =>
        `- [${c.category}] "${c.text}" → ${c.verdict.verdict} (${c.verdict.confidence}% confidence). Sources: ${
          c.evidenceDomains.length ? c.evidenceDomains.join(", ") : "none found"
        }. ${c.verdict.reasoning}`
    )
    .join("\n");

  const contextBlock = input.missingContext.length
    ? input.missingContext.map((m) => `- [${m.severity}] ${m.issue}: ${m.detail}`).join("\n")
    : "(none detected)";

  return callAgent({
    agentName: "verdict_synthesis",
    system: SYSTEM,
    input: `ARTICLE TITLE: ${input.title}

CLAIM VERDICTS:
${claimsBlock}

MANIPULATION ANALYSIS (0=absent, 100=extreme): overall ${input.manipulation.overall}/100
fear ${input.manipulation.fear}, urgency ${input.manipulation.urgency}, anger ${input.manipulation.anger}, cherry-picking ${input.manipulation.cherry_picking}, emotional language ${input.manipulation.emotional_language}, sensationalism ${input.manipulation.sensationalism}, authority bias ${input.manipulation.authority_bias}, false dilemma ${input.manipulation.false_dilemma}, conspiracy language ${input.manipulation.conspiracy_language}
Notes: ${input.manipulation.notes}

MISSING CONTEXT:
${contextBlock}

SOURCE CREDIBILITY: ${input.source.domain} → ${input.source.trustScore}/100. ${input.source.notes}`,
    schema: reportSchema,
    temperature: 0.3,
  });
}
