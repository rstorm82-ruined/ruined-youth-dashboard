import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, profiles } from "@/db/schema";
import { eq, lte, and } from "drizzle-orm";
import { createPost } from "@/lib/zernio";

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await db
    .select()
    .from(posts)
    .where(and(eq(posts.status, "scheduled"), lte(posts.scheduledAt, new Date())));

  let fired = 0;
  let failed = 0;

  for (const post of due) {
    await db.update(posts).set({ status: "posting" }).where(eq(posts.id, post.id));

    try {
      const jobIds: string[] = [];

      for (const profileId of post.profileIds) {
        const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
        if (!profile) continue;

        const result = await createPost({
          account_id: profile.zernioAccountId,
          content: post.content,
          media_urls: post.mediaUrls ?? [],
        });
        jobIds.push(result.job_id);

        await db
          .update(profiles)
          .set({ lastPostedAt: new Date() })
          .where(eq(profiles.id, profileId));
      }

      await db.update(posts).set({
        status: "posted",
        postedAt: new Date(),
        zernioJobId: jobIds[0] ?? null,
        updatedAt: new Date(),
      }).where(eq(posts.id, post.id));

      fired++;
    } catch (err) {
      await db.update(posts).set({
        status: "failed",
        failureReason: String(err),
        updatedAt: new Date(),
      }).where(eq(posts.id, post.id));
      failed++;
    }
  }

  return NextResponse.json({ fired, failed, total: due.length });
}
