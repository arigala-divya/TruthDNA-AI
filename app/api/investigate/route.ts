import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { investigateInputSchema } from "@/lib/validate";
import { checkRateLimit } from "@/lib/ratelimit";
import { runInvestigation } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300; // the full agent pipeline runs inside this invocation via after()

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rate = await checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error:
            "Rate limit reached — you can run 10 investigations per hour. Please try again later.",
        },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = investigateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const investigation = await db.investigation.create({
      data: {
        inputType: input.url ? "url" : "text",
        url: input.url ?? null,
        articleText: input.url ? null : input.articleText,
        status: "pending",
      },
    });

    // Run the 8-agent pipeline after the response is sent; the client polls
    // GET /api/investigation/[id] for live status.
    after(() => runInvestigation(investigation.id, input));

    return NextResponse.json({ id: investigation.id, status: "pending" }, { status: 202 });
  } catch (err) {
    console.error("POST /api/investigate failed:", err);
    return NextResponse.json(
      { error: "Something went wrong starting the investigation. Please try again." },
      { status: 500 }
    );
  }
}
