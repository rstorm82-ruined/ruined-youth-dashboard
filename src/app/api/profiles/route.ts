import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const data = await db.select().from(profiles).orderBy(profiles.name);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [profile] = await db
    .insert(profiles)
    .values({
      name: body.name,
      platform: body.platform,
      zernioAccountId: body.zernioAccountId,
      groupId: body.groupId ?? null,
      avatarUrl: body.avatarUrl ?? null,
    })
    .returning();
  return NextResponse.json(profile, { status: 201 });
}
