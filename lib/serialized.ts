import type {
  ManipulationScores,
  MissingContextItem,
  SourceCredibility,
  TruthDNAExplanation,
  TruthDNAScore,
} from "./types";

/** JSON-safe shapes passed from the server report page to client components. */

export interface SerializedEvidence {
  id: string;
  source: string;
  domain: string;
  title: string | null;
  text: string;
  publishedDate: string | null;
  similarity: number | null;
  relevance: number | null;
}

export interface SerializedClaim {
  id: string;
  text: string;
  category: string;
  verdict: string | null;
  confidence: number | null;
  reasoning: string | null;
  evidence: SerializedEvidence[];
}

export interface SerializedReport {
  scores: TruthDNAScore;
  explanation: TruthDNAExplanation;
  manipulation: ManipulationScores;
  missingContext: MissingContextItem[];
  sourceCredibility: SourceCredibility;
  overallVerdict: string;
  summary: string;
}

export interface SerializedInvestigation {
  id: string;
  url: string | null;
  title: string | null;
  author: string | null;
  siteName: string | null;
  publishedAt: string | null;
  createdAt: string;
  claims: SerializedClaim[];
  report: SerializedReport;
}
