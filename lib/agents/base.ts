import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const AGENT_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
export const EMBEDDING_MODEL = "text-embedding-3-small";

const MAX_RETRIES = 3;

function isRetryable(err: unknown): boolean {
  if (err instanceof OpenAI.APIError) {
    return err.status === 429 || (err.status !== undefined && err.status >= 500);
  }
  return false;
}

/** Call the model via the Responses API with a Zod-enforced structured output.
 *  Retries with exponential backoff on rate limits and transient server errors. */
export async function callAgent<T>(opts: {
  agentName: string;
  system: string;
  input: string;
  schema: ZodType<T>;
  temperature?: number;
}): Promise<T> {
  const openai = getOpenAI();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await openai.responses.parse({
        model: AGENT_MODEL,
        instructions: opts.system,
        input: opts.input,
        temperature: opts.temperature ?? 0.2,
        text: { format: zodTextFormat(opts.schema, opts.agentName) },
      });
      const parsed = response.output_parsed;
      if (parsed === null || parsed === undefined) {
        throw new Error(`${opts.agentName} returned no parsable output`);
      }
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1 && isRetryable(err)) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt + Math.random() * 500));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/** Embed a batch of texts. Returns one vector per input, in order. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.slice(0, 8000)),
  });
  return res.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
