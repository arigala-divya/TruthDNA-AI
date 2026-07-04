export type ClaimType =
  | "Fact"
  | "Opinion"
  | "Prediction"
  | "Statistic"
  | "Quotation"
  | "Speculation"
  | "Allegation";

export type VerdictType =
  | "Supported"
  | "Contradicted"
  | "Partially Supported"
  | "Insufficient Evidence";

export type InvestigationStatus =
  | "pending"
  | "extracting"
  | "claims"
  | "searching"
  | "comparing"
  | "consensus"
  | "manipulation"
  | "reporting"
  | "complete"
  | "failed";

/** The six TruthDNA metrics. All 0–100. Higher is always better
 *  (Manipulation and Context are stored inverted: 100 = clean). */
export interface TruthDNAScore {
  reliability: number;
  evidence: number;
  sourceTrust: number;
  manipulation: number;
  context: number;
  consensus: number;
}

export interface TruthDNAExplanation {
  reliability: string;
  evidence: string;
  sourceTrust: string;
  manipulation: string;
  context: string;
  consensus: string;
}

export interface ArticleData {
  title: string;
  author: string | null;
  siteName: string | null;
  publishedAt: string | null; // ISO string
  text: string;
  url: string | null;
  inputType: "url" | "text";
}

export interface ExtractedClaim {
  id: number;
  text: string;
  category: ClaimType;
  confidence: number;
}

export interface EvidenceItem {
  source: string;
  domain: string;
  title: string;
  text: string;
  publishedDate: string | null;
  relevance: number;
  similarity?: number;
}

export interface ClaimVerdict {
  verdict: VerdictType;
  confidence: number; // 0–100
  reasoning: string;
}

export interface MissingContextItem {
  issue: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

export type ManipulationTechnique =
  | "fear"
  | "urgency"
  | "anger"
  | "cherry_picking"
  | "emotional_language"
  | "sensationalism"
  | "authority_bias"
  | "false_dilemma"
  | "conspiracy_language";

export type ManipulationScores = Record<ManipulationTechnique, number> & {
  overall: number;
  notes: string;
};

export interface SourceCredibility {
  domain: string;
  trustScore: number; // 0–100
  metrics: {
    domainReputation: number;
    httpsSsl: number;
    authorVerifiable: number;
    editorialPolicy: number;
    factCheckHistory: number;
    transparency: number;
  };
  notes: string;
}

export interface FinalReport {
  scores: TruthDNAScore;
  explanation: TruthDNAExplanation;
  overallVerdict: string;
  summary: string;
}

export const STATUS_STEPS: { status: InvestigationStatus; label: string; emoji: string }[] = [
  { status: "extracting", label: "Extracting article", emoji: "📄" },
  { status: "claims", label: "Identifying claims", emoji: "🧩" },
  { status: "searching", label: "Searching trusted sources", emoji: "🌐" },
  { status: "comparing", label: "Comparing evidence", emoji: "📚" },
  { status: "consensus", label: "Measuring consensus", emoji: "⚖️" },
  { status: "manipulation", label: "Detecting manipulation", emoji: "🧠" },
  { status: "reporting", label: "Generating TruthDNA report", emoji: "📝" },
];
