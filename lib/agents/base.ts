import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

/** All agents run on Google Gemini through its OpenAI-compatible endpoint,
 *  so the OpenAI SDK's structured-output helpers keep working unchanged. */
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

let client: OpenAI | null = null;

export function getLLM(): OpenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
    client = new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL });
  }
  return client;
}

export const AGENT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

const MAX_RETRIES = 5;

export function isRateLimit(err: unknown): boolean {
  return err instanceof OpenAI.APIError && err.status === 429;
}

function isRetryable(err: unknown): boolean {
  // network blips (DNS, resets) are worth retrying too
  if (err instanceof OpenAI.APIConnectionError) return true;
  if (err instanceof OpenAI.APIError) {
    return err.status === 429 || (err.status !== undefined && err.status >= 500);
  }
  return false;
}

/** Call the model with a Zod-enforced structured output. Free-tier Gemini has
 *  tight per-minute quotas, so 429s back off long enough to enter the next
 *  rate-limit window instead of burning retries inside the same one. */
export async function callAgent<T>(opts: {
  agentName: string;
  system: string;
  input: string;
  schema: ZodType<T>;
  temperature?: number;
}): Promise<T> {
  const llm = getLLM();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await llm.chat.completions.parse({
        model: AGENT_MODEL,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.input },
        ],
        temperature: opts.temperature ?? 0.2,
        response_format: zodResponseFormat(opts.schema, opts.agentName),
      });
      const parsed = completion.choices[0]?.message?.parsed;
      if (parsed === null || parsed === undefined) {
        throw new Error(`${opts.agentName} returned no parsable output`);
      }
      return parsed;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1 && isRetryable(err)) {
        // free-tier quotas reset per minute — wait past the window, not inside it
        const delay = isRateLimit(err)
          ? 20_000 * (attempt + 1) + Math.random() * 3000
          : 1000 * 2 ** attempt + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
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
  const llm = getLLM();
  const res = await llm.embeddings.create({
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
