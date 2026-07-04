import { cacheGet, cacheSet, TTL } from "./cache";
import type { EvidenceItem } from "./types";

/** High-trust outlets we prefer when gathering evidence. */
export const TRUSTED_DOMAINS = [
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
  "who.int",
  "pib.gov.in",
  "factcheck.org",
  "snopes.com",
];

interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
  published_date?: string;
}

async function tavilyRequest(query: string, includeDomains?: string[]): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not configured");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      max_results: 5,
      include_answer: false,
      ...(includeDomains?.length ? { include_domains: includeDomains } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tavily search failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}

function toEvidence(r: TavilyResult): EvidenceItem {
  let domain = "";
  try {
    domain = new URL(r.url).hostname.replace(/^www\./, "");
  } catch {
    domain = r.url;
  }
  return {
    source: r.url,
    domain,
    title: r.title ?? domain,
    text: (r.content ?? "").slice(0, 2000),
    publishedDate:
      r.published_date && !isNaN(Date.parse(r.published_date))
        ? new Date(r.published_date).toISOString()
        : null,
    relevance: typeof r.score === "number" ? r.score : 0,
  };
}

/** Search trusted sources first; broaden to the open web when they come up dry.
 *  Results are cached for 24h. */
export async function searchEvidence(claimText: string): Promise<EvidenceItem[]> {
  const cacheKey = `truthdna:tavily:${claimText.toLowerCase().slice(0, 300)}`;
  const cached = await cacheGet<EvidenceItem[]>(cacheKey);
  if (cached) return cached;

  let results = await tavilyRequest(claimText, TRUSTED_DOMAINS);
  if (results.length < 3) {
    const broad = await tavilyRequest(claimText);
    const seen = new Set(results.map((r) => r.url));
    results = [...results, ...broad.filter((r) => !seen.has(r.url))];
  }

  const evidence = results.slice(0, 5).map(toEvidence);
  await cacheSet(cacheKey, evidence, TTL.TAVILY_SEARCH);
  return evidence;
}
