import { z } from "zod";
import { callAgent } from "./base";
import { cacheGet, cacheSet, TTL } from "../cache";
import type { SourceCredibility } from "../types";

const sourceSchema = z.object({
  trustScore: z.number().min(0).max(100),
  domainReputation: z.number().min(0).max(100),
  httpsSsl: z.number().min(0).max(100),
  authorVerifiable: z.number().min(0).max(100),
  editorialPolicy: z.number().min(0).max(100),
  factCheckHistory: z.number().min(0).max(100),
  transparency: z.number().min(0).max(100),
  notes: z.string(),
});

const SYSTEM = `You are the Source Credibility Agent of TruthDNA, an automated news fact-checking system.

Assess the publishing source's credibility, 0-100 per metric:
- domainReputation: how established and reputable the outlet is (wire services and major public broadcasters score 85+; unknown domains 30-50; known misinformation outlets under 20)
- httpsSsl: whether the site serves over HTTPS (provided as input — score 100 if yes, 20 if no)
- authorVerifiable: whether a named, verifiable author is attached (provided as input)
- editorialPolicy: whether the outlet is known to have editorial standards and corrections policies
- factCheckHistory: the outlet's track record with independent fact-checkers
- transparency: ownership, funding, and about-page transparency norms for this outlet

trustScore is your weighted overall judgment (domainReputation and factCheckHistory matter most).
If the domain is unknown to you, be conservative: mid-range scores and say so in the notes.
notes: 1-2 sentences justifying the score.`;

/** Scores a publishing domain's trustworthiness. Cached for 7 days.
 *  For pasted text with no source, returns a neutral "unknown source" assessment. */
export async function assessSource(input: {
  domain: string | null;
  isHttps: boolean;
  hasAuthor: boolean;
}): Promise<SourceCredibility> {
  if (!input.domain) {
    return {
      domain: "(pasted text — no source)",
      trustScore: 50,
      metrics: {
        domainReputation: 50,
        httpsSsl: 50,
        authorVerifiable: input.hasAuthor ? 70 : 30,
        editorialPolicy: 50,
        factCheckHistory: 50,
        transparency: 50,
      },
      notes:
        "The article was pasted as plain text, so the publishing source could not be evaluated. Source trust is neutral.",
    };
  }

  const cacheKey = `truthdna:source:${input.domain}:${input.hasAuthor ? 1 : 0}`;
  const cached = await cacheGet<SourceCredibility>(cacheKey);
  if (cached) return cached;

  const s = await callAgent({
    agentName: "source_credibility",
    system: SYSTEM,
    input: `DOMAIN: ${input.domain}\nHTTPS: ${input.isHttps ? "yes" : "no"}\nNAMED AUTHOR PRESENT: ${
      input.hasAuthor ? "yes" : "no"
    }`,
    schema: sourceSchema,
  });

  const result: SourceCredibility = {
    domain: input.domain,
    trustScore: Math.round(s.trustScore),
    metrics: {
      domainReputation: s.domainReputation,
      httpsSsl: s.httpsSsl,
      authorVerifiable: s.authorVerifiable,
      editorialPolicy: s.editorialPolicy,
      factCheckHistory: s.factCheckHistory,
      transparency: s.transparency,
    },
    notes: s.notes,
  };
  await cacheSet(cacheKey, result, TTL.SOURCE_CREDIBILITY);
  return result;
}
