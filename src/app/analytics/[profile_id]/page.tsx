import { db } from "@/db";
import { postAnalytics, profiles } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default async function ProfileAnalyticsPage({
  params,
}: {
  params: Promise<{ profile_id: string }>;
}) {
  const { profile_id } = await params;
  const profileId = parseInt(profile_id);

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
  if (!profile) notFound();

  const history = await db
    .select()
    .from(postAnalytics)
    .where(eq(postAnalytics.profileId, profileId))
    .orderBy(desc(postAnalytics.fetchedAt))
    .limit(30);

  const [totals] = await db
    .select({
      totalViews: sql<number>`sum(${postAnalytics.views})`,
      totalLikes: sql<number>`sum(${postAnalytics.likes})`,
      totalComments: sql<number>`sum(${postAnalytics.comments})`,
      totalShares: sql<number>`sum(${postAnalytics.shares})`,
    })
    .from(postAnalytics)
    .where(eq(postAnalytics.profileId, profileId));

  return (
    <div>
      <Link href="/analytics" className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        Back to Analytics
      </Link>

      <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
      <p className="text-sm mb-6 capitalize" style={{ color: "var(--muted)" }}>{profile.platform}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Views", value: totals?.totalViews },
          { label: "Likes", value: totals?.totalLikes },
          { label: "Comments", value: totals?.totalComments },
          { label: "Shares", value: totals?.totalShares },
        ].map(({ label, value }) => (
          <div key={label} className="surface p-4">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{label}</p>
            <p className="text-2xl font-bold">{formatNumber(Number(value ?? 0))}</p>
          </div>
        ))}
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
          Analytics History
        </h2>
        {history.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No data synced yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Views", "Likes", "Comments", "Shares"].map((h) => (
                    <th key={h} className="text-left pb-2 pr-4 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 pr-4 text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(row.fetchedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4">{formatNumber(row.views ?? 0)}</td>
                    <td className="py-2 pr-4">{formatNumber(row.likes ?? 0)}</td>
                    <td className="py-2 pr-4">{formatNumber(row.comments ?? 0)}</td>
                    <td className="py-2 pr-4">{formatNumber(row.shares ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
