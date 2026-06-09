import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { lt, isNull, or } from "drizzle-orm";

const STALE_DAYS = 7;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);

  await db.update(profiles).set({ healthStatus: "stale" }).where(
    or(isNull(profiles.lastPostedAt), lt(profiles.lastPostedAt, cutoff))
  );

  return NextResponse.json({ ok: true });
}
