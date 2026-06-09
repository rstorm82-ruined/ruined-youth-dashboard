import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";

interface BulkRow {
  content: string;
  scheduledAt: string;
  profileIds: string;
}

export async function POST(req: NextRequest) {
  const body: BulkRow[] = await req.json();

  const rows = body.map((row) => ({
    content: row.content,
    mediaUrls: [] as string[],
    profileIds: row.profileIds.split(",").map((id) => parseInt(id.trim())).filter(Boolean),
    status: "scheduled" as const,
    scheduledAt: row.scheduledAt ? new Date(row.scheduledAt) : null,
  }));

  const created = await db.insert(posts).values(rows).returning();
  return NextResponse.json({ created: created.length }, { status: 201 });
}
