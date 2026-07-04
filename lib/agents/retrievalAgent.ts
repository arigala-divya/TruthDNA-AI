import { searchEvidence } from "../tavily";
import type { EvidenceItem } from "../types";

/** Evidence Retrieval Agent — queries trusted sources via Tavily for a single claim.
 *  Returns up to 5 evidence pieces with URL, snippet, date and relevance. */
export async function retrieveEvidence(claimText: string): Promise<EvidenceItem[]> {
  try {
    return await searchEvidence(claimText);
  } catch (err) {
    console.error("Evidence retrieval failed for claim:", claimText.slice(0, 80), err);
    return []; // a single failed search shouldn't sink the investigation
  }
}
