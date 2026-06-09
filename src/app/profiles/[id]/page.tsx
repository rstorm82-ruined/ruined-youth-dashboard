import { db } from "@/db";
import { profiles, posts, postAnalytics } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = parseInt(id);

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
  if (!profile) notFound();

  const profilePosts = await db
    .select()
    .from(posts)
    .where(sql`${profileId} = ANY(${posts.profileIds})`)
    .orderBy(desc(posts.createdAt))
    .limit(20);

  const analytics = await db
    .select({
      totalViews: sql<number>`sum(${postAnalytics.views})`,
      totalLikes: sql<number>`sum(${postAnalytics.likes})`,
      totalComments: sql<number>`sum(${postAnalytics.comments})`,
      totalShares: sql<number>`sum(${postAnalytics.shares})`,
    })
    .from(postAnalytics)
    .where(eq(postAnalytics.profileId, profileId));

  const agg = analytics[0] ?? { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 };

  return (
    <div>
      <Link href="/profiles" className="flex items-center gap-2 text-sm mb-6"
        style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        Back to Profiles
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm capitalize" style={{ color: "var(--muted)" }}>
            {profile.platform} · {profile.healthStatus}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Views", value: agg.totalViews },
          { label: "Likes", value: agg.totalLikes },
          { label: "Comments", value: agg.totalComments },
          { label: "Shares", value: agg.totalShares },
        ].map(({ label, value }) => (
          <div key={label} className="surface p-4">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{label}</p>
            <p className="text-2xl font-bold">{formatNumber(Number(value ?? 0))}</p>
          </div>
        ))}
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
          Post History
        </h2>
        {profilePosts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {profilePosts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 py-3 border-b"
                style={{ borderColor: "var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    {post.status} ·{" "}
                    {post.scheduledAt
                      ? new Date(post.scheduledAt).toLocaleString()
                      : new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: post.status === "posted" ? "#14532d" : "var(--border)",
                    color: post.status === "posted" ? "#4ade80" : "var(--muted)",
                  }}>
                  {post.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
