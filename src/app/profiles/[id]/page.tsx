import { db } from "@/db";
import { profiles, posts, postAnalytics } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const PLATFORM_ICONS: Record<string, string> = {
  twitter: "𝕏",
  tiktok: "TT",
  instagram: "IG",
  facebook: "FB",
  youtube: "YT",
  threads: "TH",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1d9bf0",
  tiktok: "#69c9d0",
  instagram: "#e1306c",
  facebook: "#1877f2",
  youtube: "#ff0000",
  threads: "#888",
};

async function getZernioAccount(accountId: string) {
  try {
    const res = await fetch(`${process.env.ZERNIO_API_BASE}/v1/accounts`, {
      headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accounts?.find((a: any) => a._id === accountId) ?? null;
  } catch {
    return null;
  }
}

// Get all accounts that share the same Zernio profileId
async function getRelatedAccounts(profileId: string) {
  try {
    const res = await fetch(`${process.env.ZERNIO_API_BASE}/v1/accounts`, {
      headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.accounts?.filter((a: any) => a.profileId?._id === profileId) ?? [];
  } catch {
    return [];
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = parseInt(id);

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
  if (!profile) notFound();

  const [zernioAccount, profilePosts, analytics] = await Promise.all([
    getZernioAccount(profile.zernioAccountId),
    db.select().from(posts)
      .where(sql`${profileId} = ANY(${posts.profileIds})`)
      .orderBy(desc(posts.createdAt))
      .limit(20),
    db.select({
      totalViews: sql<number>`sum(${postAnalytics.views})`,
      totalLikes: sql<number>`sum(${postAnalytics.likes})`,
      totalComments: sql<number>`sum(${postAnalytics.comments})`,
      totalShares: sql<number>`sum(${postAnalytics.shares})`,
    }).from(postAnalytics).where(eq(postAnalytics.profileId, profileId)),
  ]);

  // Get sibling accounts (same Zernio profile group = other platforms)
  const relatedAccounts = zernioAccount?.profileId?._id
    ? await getRelatedAccounts(zernioAccount.profileId._id)
    : [];

  const agg = analytics[0] ?? { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 };
  const followers = zernioAccount?.metadata?.profileData?.followersCount;
  const profileUrl = zernioAccount?.profileUrl;

  return (
    <div>
      <Link href="/profiles" className="flex items-center gap-2 text-sm mb-6"
        style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        Back to Profiles
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover"
            style={{ border: "2px solid var(--border)" }} />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                style={{ background: "var(--border)", color: "var(--muted)" }}>
                <ExternalLink size={10} /> View Profile
              </a>
            )}
          </div>
          <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--muted)" }}>
            {profile.platform}
            {followers != null && ` · ${formatNumber(followers)} followers`}
            {zernioAccount?.metadata?.profileData?.bio && (
              <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>
                · {zernioAccount.metadata.profileData.bio.slice(0, 60)}{zernioAccount.metadata.profileData.bio.length > 60 ? "…" : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Platform connections for this Zernio profile */}
      {relatedAccounts.length > 0 && (
        <div className="surface p-4 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
            Platform Connections — {zernioAccount?.profileId?.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {relatedAccounts.map((acc: any) => {
              const active = acc.isActive && acc.platformStatus === "active";
              const needsReconnect = !active && acc.isActive;
              const url = acc.profileUrl ?? acc.metadata?.profileData?.profileUrl;
              const accFollowers = acc.metadata?.profileData?.followersCount;
              return (
                <div key={acc._id} className="flex items-center gap-3 px-3 py-2.5 rounded"
                  style={{ background: "var(--border)" }}>
                  <span className="text-xs font-bold w-6 text-center flex-shrink-0"
                    style={{ color: PLATFORM_COLORS[acc.platform] ?? "#888" }}>
                    {PLATFORM_ICONS[acc.platform] ?? acc.platform.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">@{acc.username}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {acc.platform}
                      {accFollowers != null && ` · ${formatNumber(accFollowers)} followers`}
                    </p>
                  </div>
                  {active ? (
                    <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                  ) : needsReconnect ? (
                    <AlertTriangle size={13} className="text-yellow-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={13} className="flex-shrink-0" style={{ color: "var(--muted)" }} />
                  )}
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 hover:opacity-70">
                      <ExternalLink size={12} style={{ color: "var(--muted)" }} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Post history */}
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
