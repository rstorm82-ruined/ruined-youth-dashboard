import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const query = db.select().from(posts).orderBy(desc(posts.scheduledAt)).limit(limit);
  const data = status
    ? await db.select().from(posts).where(eq(posts.status, status as any)).orderBy(desc(posts.scheduledAt)).limit(limit)
    : await query;

  return NextResponse.json(data);
}
