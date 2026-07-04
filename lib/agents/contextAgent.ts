import { z } from "zod";
import { callAgent } from "./base";
import type { MissingContextItem } from "../types";

const contextSchema = z.object({
  items: z.array(
    z.object({
      issue: z.string(),
      detail: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
});

const SYSTEM = `You are the Missing Context Agent of TruthDNA, an automated news fact-checking system.

Given an article and the claims extracted from it, identify what important context is MISSING. Look for:
- Cherry-picking: selectively reporting facts while omitting ones that change the picture.
- Uncontextualized statistics: numbers without baselines, denominators, time ranges, or comparisons.
- Missing counterpoints: only one side of a contested issue presented.
- Omitted timeline or causation context that changes interpretation.
- Missing sourcing: strong assertions with no attribution.

For each item: "issue" is a short title (5-8 words), "detail" explains what's missing and why it matters (1-2 sentences), "severity" reflects how much the omission distorts the reader's understanding.

Return an empty list if the article is well-contextualized. Do not invent problems.`;

export async function findMissingContext(
  articleText: string,
  claims: string[]
): Promise<MissingContextItem[]> {
  const { items } = await callAgent({
    agentName: "missing_context",
    system: SYSTEM,
    input: `ARTICLE:\n\n${articleText.slice(0, 20000)}\n\nEXTRACTED CLAIMS:\n${claims
      .map((c, i) => `${i + 1}. ${c}`)
      .join("\n")}`,
    schema: contextSchema,
  });
  return items;
}
