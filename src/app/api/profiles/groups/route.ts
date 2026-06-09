import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profileGroups } from "@/db/schema";

export async function GET() {
  const groups = await db.select().from(profileGroups).orderBy(profileGroups.name);
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [group] = await db
    .insert(profileGroups)
    .values({ name: body.name, description: body.description ?? null })
    .returning();
  return NextResponse.json(group, { status: 201 });
}
