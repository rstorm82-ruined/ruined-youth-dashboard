import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const [post] = await db
    .insert(posts)
    .values({
      content: body.content,
      mediaUrls: body.mediaUrls ?? [],
      profileIds: body.profileIds,
      status: body.status ?? "pending_approval",
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      recycleAfterDays: body.recycleAfterDays ?? null,
    })
    .returning();

  return NextResponse.json(post, { status: 201 });
}
