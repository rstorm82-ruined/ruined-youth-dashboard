import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { templates } from "@/db/schema";

export async function GET() {
  const data = await db.select().from(templates).orderBy(templates.name);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [template] = await db
    .insert(templates)
    .values({
      name: body.name,
      captionTemplate: body.captionTemplate,
      hashtagGroupId: body.hashtagGroupId ?? null,
    })
    .returning();
  return NextResponse.json(template, { status: 201 });
}
