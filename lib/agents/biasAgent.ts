import { z } from "zod";
import { callAgent } from "./base";
import type { ManipulationScores } from "../types";

const biasSchema = z.object({
  fear: z.number().min(0).max(100),
  urgency: z.number().min(0).max(100),
  anger: z.number().min(0).max(100),
  cherry_picking: z.number().min(0).max(100),
  emotional_language: z.number().min(0).max(100),
  sensationalism: z.number().min(0).max(100),
  authority_bias: z.number().min(0).max(100),
  false_dilemma: z.number().min(0).max(100),
  conspiracy_language: z.number().min(0).max(100),
  notes: z.string(),
});

const SYSTEM = `You are the Bias & Manipulation Agent of TruthDNA, an automated news fact-checking system.

Score the article 0-100 on each manipulation technique (0 = absent, 100 = extreme):
- fear: fear-mongering, threat inflation
- urgency: artificial time pressure ("act now", "before it's too late")
- anger: outrage bait, us-vs-them framing
- cherry_picking: selective presentation of facts
- emotional_language: loaded adjectives, appeals to emotion over evidence
- sensationalism: hype, exaggeration, clickbait framing
- authority_bias: vague appeals to unnamed "experts" or misused credentials
- false_dilemma: presenting only two options when more exist
- conspiracy_language: hidden-agenda framing, "what they don't want you to know"

Calibrate: straight wire-service reporting scores 0-15; typical opinion writing 20-40; propaganda 70+.
"notes" = 1-2 sentences naming the dominant techniques with a short quoted example, or stating the article is clean.`;

/** Scores nine manipulation techniques and averages them into one 0-100 score. */
export async function analyzeManipulation(articleText: string): Promise<ManipulationScores> {
  const scores = await callAgent({
    agentName: "bias_manipulation",
    system: SYSTEM,
    input: `ARTICLE:\n\n${articleText.slice(0, 20000)}`,
    schema: biasSchema,
  });
  const { notes, ...techniques } = scores;
  const values = Object.values(techniques);
  const overall = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { ...techniques, overall, notes };
}
