import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dms } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.update(dms).set({ isRead: true }).where(eq(dms.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
