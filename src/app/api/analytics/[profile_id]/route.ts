import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { postAnalytics } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: Promise<{ profile_id: string }> }) {
  const { profile_id } = await params;
  const data = await db
    .select()
    .from(postAnalytics)
    .where(eq(postAnalytics.profileId, parseInt(profile_id)))
    .orderBy(desc(postAnalytics.fetchedAt))
    .limit(100);
  return NextResponse.json(data);
}
