import { NextResponse } from "next/server";
import { db } from "@/db";
import { postAnalytics, posts, profiles } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getPostAnalytics } from "@/lib/zernio";

export async function POST() {
  const postedPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "posted"));

  let synced = 0;

  for (const post of postedPosts) {
    if (!post.zernioJobId) continue;

    for (const profileId of post.profileIds) {
      try {
        const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
        if (!profile) continue;

        const analytics = await getPostAnalytics(profile.zernioAccountId, post.zernioJobId);

        await db.insert(postAnalytics).values({
          postId: post.id,
          profileId,
          views: analytics.views,
          likes: analytics.likes,
          comments: analytics.comments,
          shares: analytics.shares,
        });
        synced++;
      } catch {
        // skip
      }
    }
  }

  return NextResponse.json({ synced });
}
