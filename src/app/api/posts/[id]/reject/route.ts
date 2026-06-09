import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post] = await db
    .update(posts)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(posts.id, parseInt(id)))
    .returning();
  return NextResponse.json(post);
}
