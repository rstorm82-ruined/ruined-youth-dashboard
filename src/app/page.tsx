import { db } from "@/db";
import { posts, profiles, dms } from "@/db/schema";
import { eq, gte, count } from "drizzle-orm";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Clock, Users, MessageSquare, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [profileCount] = await db.select({ count: count() }).from(profiles);
    const [scheduledCount] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, "scheduled"));
    const [pendingCount] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, "pending_approval"));
    const [unreadDMs] = await db
      .select({ count: count() })
      .from(dms)
      .where(eq(dms.isRead, false));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayPosts = await db
      .select()
      .from(posts)
      .where(gte(posts.scheduledAt, todayStart))
      .limit(5);

    return {
      profileCount: profileCount.count,
      scheduledCount: scheduledCount.count,
      pendingCount: pendingCount.count,
      unreadDMs: unreadDMs.count,
      todayPosts,
    };
  } catch (e) {
    console.error("Dashboard stats error:", e);
    return {
      profileCount: 0,
      scheduledCount: 0,
      pendingCount: 0,
      unreadDMs: 0,
      todayPosts: [],
    };
  }
}

export default async function Dashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Profiles", value: stats.profileCount, icon: Users, href: "/profiles" },
    { label: "Scheduled", value: stats.scheduledCount, icon: Clock, href: "/queue" },
    { label: "Pending Approval", value: stats.pendingCount, icon: TrendingUp, href: "/queue" },
    { label: "Unread DMs", value: stats.unreadDMs, icon: MessageSquare, href: "/inbox" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}
            className="surface p-5 hover:border-[var(--accent)] transition-colors block"
            style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</span>
              <Icon size={14} style={{ color: "var(--muted)" }} />
            </div>
            <div className="text-3xl font-bold">{formatNumber(Number(value))}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface p-5">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Posting Today
          </h2>
          {stats.todayPosts.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Nothing scheduled today.{" "}
              <Link href="/compose" className="underline" style={{ color: "var(--accent)" }}>Create a post</Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.todayPosts.map((post) => (
                <li key={post.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "var(--accent)" }} />
                  <div>
                    <p className="line-clamp-1">{post.content}</p>
                    {post.scheduledAt && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link href="/compose" className="btn-primary block text-center w-full">New Post</Link>
            <Link href="/queue" className="btn-ghost block text-center w-full">Review Approval Queue</Link>
            <Link href="/profiles" className="btn-ghost block text-center w-full">Manage Profiles</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
