# 🧬 TruthDNA AI

**Automated news fact-checking via AI agents.** Paste a news URL or article text; eight AI agents extract its claims, hunt down evidence across trusted sources (Reuters, AP, BBC, WHO, PIB, FactCheck.org, Snopes), and sequence a six-metric **TruthDNA score** — Reliability, Evidence, Source Trust, Manipulation, Context, and Consensus.

100% Node.js. One deploy to Vercel. No external microservices.

## Stack

- **Next.js 15** (App Router, TypeScript) · Tailwind CSS 4 · Framer Motion · Recharts
- **Prisma 6** + PostgreSQL (Neon)
- **Google Gemini** `gemini-2.5-flash-lite` (OpenAI-compatible API + Zod structured outputs) + `gemini-embedding-001`
- **Tavily** search API for evidence retrieval
- **Upstash Redis** (optional) for rate limiting + caching

## The eight agents

| Agent | File | Job |
|---|---|---|
| Claim Extraction | `lib/agents/claimAgent.ts` | Pulls 5–10 checkable claims, categorized (Fact / Opinion / Prediction / Statistic / Quotation / Speculation / Allegation) |
| Evidence Retrieval | `lib/agents/retrievalAgent.ts` | Tavily search over trusted domains, 5 evidence pieces per claim |
| Evidence Comparison | `lib/agents/comparisonAgent.ts` | Embedding similarity + verdict: Supported / Contradicted / Partially Supported / Insufficient Evidence |
| Missing Context | `lib/agents/contextAgent.ts` | Cherry-picking, uncontextualized statistics, omitted counterpoints |
| Bias & Manipulation | `lib/agents/biasAgent.ts` | Nine techniques (fear, urgency, anger, …) → one manipulation score |
| Source Credibility | `lib/agents/sourceAgent.ts` | Domain trust score from six metrics |
| Verdict Synthesis | `lib/agents/verdictAgent.ts` | Final six-metric TruthDNA report |
| Orchestrator | `lib/pipeline.ts` | Runs them all, streams live status to the DB |

## Local development

```bash
npm install
cp .env.example .env        # fill in GEMINI_API_KEY, TAVILY_API_KEY, DATABASE_URL
npx prisma migrate dev      # creates tables (needs DATABASE_URL)
npm run dev
```

Open http://localhost:3000, paste a news URL, hit **🔎 Start Investigation**.

## Deploy to Vercel

1. **Database** — create a free [Neon](https://neon.tech) Postgres project; copy the pooled connection string.
2. **Push to GitHub** and import the repo at [vercel.com/new](https://vercel.com/new).
3. **Environment variables** (Project → Settings → Environment Variables):
   - `GEMINI_API_KEY`, `TAVILY_API_KEY`, `DATABASE_URL`
   - optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (enables 10/hour/IP rate limiting + result caching)
4. **Migrate** — run once locally against the production DB:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```
5. **Deploy.** `npm run build` already runs `prisma generate`.

> The investigation pipeline runs inside the `POST /api/investigate` invocation via Next's `after()` (route `maxDuration = 300`). On Vercel Hobby, enable **Fluid Compute** (default for new projects) so functions can run past 10s.

## API

- `POST /api/investigate` — body `{ "url": "https://…" }` or `{ "articleText": "…" }` → `202 { id, status }`
- `GET /api/investigation/:id` — full investigation: status, claims, evidence, report

## How a score is made

1. Article extracted with Mozilla Readability (or pasted text, max 50k chars)
2. Claims extracted + categorized with structured outputs (Zod-validated JSON, no hallucinated shapes)
3. Per claim: Tavily search → cosine similarity via embeddings → evidence-grounded verdict
4. Whole-article passes: manipulation (9 techniques), missing context, source credibility
5. Synthesis agent folds everything into six 0–100 scores with plain-language explanations
