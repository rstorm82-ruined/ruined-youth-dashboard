import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, parseInt(id)));
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [profile] = await db
    .update(profiles)
    .set({ groupId: body.groupId ?? null })
    .where(eq(profiles.id, parseInt(id)))
    .returning();
  return NextResponse.json(profile);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(profiles).where(eq(profiles.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
