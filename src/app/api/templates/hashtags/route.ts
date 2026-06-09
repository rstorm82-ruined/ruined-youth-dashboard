import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hashtagGroups } from "@/db/schema";

export async function GET() {
  const data = await db.select().from(hashtagGroups).orderBy(hashtagGroups.name);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [group] = await db
    .insert(hashtagGroups)
    .values({ name: body.name, tags: body.tags })
    .returning();
  return NextResponse.json(group, { status: 201 });
}
