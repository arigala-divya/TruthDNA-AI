import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const investigation = await db.investigation.findUnique({
      where: { id },
      include: {
        claims: {
          include: { evidence: { orderBy: { relevance: "desc" } } },
          orderBy: { id: "asc" },
        },
        report: true,
      },
    });
    if (!investigation) {
      return NextResponse.json({ error: "Investigation not found." }, { status: 404 });
    }
    return NextResponse.json(investigation);
  } catch (err) {
    console.error("GET /api/investigation/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load investigation." }, { status: 500 });
  }
}
