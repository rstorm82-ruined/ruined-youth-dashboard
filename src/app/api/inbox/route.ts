import { NextResponse } from "next/server";
import { db } from "@/db";
import { dms } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const data = await db.select().from(dms).orderBy(desc(dms.receivedAt)).limit(100);
  return NextResponse.json(data);
}
