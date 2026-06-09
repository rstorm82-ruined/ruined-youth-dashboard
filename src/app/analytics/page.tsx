import { db } from "@/db";
import { postAnalytics, profiles, posts } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

async function getNetworkStats() {
  try {
    const [totals] = await db.select({
      totalViews: sql<number>`sum(${postAnalytics.views})`,
      totalLikes: sql<number>`sum(${postAnalytics.likes})`,
      totalComments: sql<number>`sum(${postAnalytics.comments})`,
      totalShares: sql<number>`sum(${postAnalytics.shares})`,
    }).from(postAnalytics);

    const topProfiles = await db
      .select({
        profileId: postAnalytics.profileId,
        name: profiles.name,
        platform: profiles.platform,
        totalViews: sql<number>`sum(${postAnalytics.views})`,
        totalLikes: sql<number>`sum(${postAnalytics.likes})`,
      })
      .from(postAnalytics)
      .innerJoin(profiles, eq(postAnalytics.profileId, profiles.id))
      .groupBy(postAnalytics.profileId, profiles.name, profiles.platform)
      .orderBy(desc(sql`sum(${postAnalytics.views})`))
      .limit(10);

    return { totals, topProfiles };
  } catch {
    return { totals: null, topProfiles: [] };
  }
}

export default async function AnalyticsPage() {
  const { totals, topProfiles } = await getNetworkStats();

  const networkStats = [
    { label: "Total Views", value: totals?.totalViews ?? 0 },
    { label: "Total Likes", value: totals?.totalLikes ?? 0 },
    { label: "Total Comments", value: totals?.totalComments ?? 0 },
    { label: "Total Shares", value: totals?.totalShares ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {networkStats.map(({ label, value }) => (
          <div key={label} className="surface p-5">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{label}</p>
            <p className="text-3xl font-bold">{formatNumber(Number(value ?? 0))}</p>
          </div>
        ))}
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
          Top Profiles by Views
        </h2>
        {topProfiles.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No analytics data yet. Posts need to be synced from the platform.
          </p>
        ) : (
          <div className="space-y-3">
            {topProfiles.map((p, i) => (
              <Link key={p.profileId} href={`/analytics/${p.profileId}`}
                className="flex items-center gap-4 py-2 hover:opacity-80 transition-opacity">
                <span className="text-xs w-5 flex-shrink-0" style={{ color: "var(--muted)" }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>{p.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatNumber(Number(p.totalViews ?? 0))}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>views</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
