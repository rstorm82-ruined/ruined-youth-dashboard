import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { templates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(templates).where(eq(templates.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
