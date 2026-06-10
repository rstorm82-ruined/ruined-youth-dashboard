"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, ImageIcon, Users, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Post {
  id: number;
  content: string;
  status: string;
  scheduledAt: string | null;
  profileIds: number[];
  mediaUrls: string[];
  createdAt: string;
  failureReason: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  draft:            { bg: "#2a2a2a",   color: "#888",    label: "Draft" },
  pending_approval: { bg: "#2d2000",   color: "#fbbf24", label: "Pending Approval" },
  scheduled:        { bg: "#0d2d1a",   color: "#4ade80", label: "Scheduled" },
  posted:           { bg: "#0d2d1a",   color: "#4ade80", label: "Posted" },
  failed:           { bg: "#2d0d0d",   color: "#f87171", label: "Failed" },
};

// Extract hashtags from content
function extractHashtags(text: string) {
  return text.match(/#\w+/g) ?? [];
}

// Truncate caption for card display
function truncate(text: string, max = 120) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

const FILTERS = ["all", "draft", "pending_approval", "scheduled", "posted", "failed"] as const;

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const url = `/api/posts/queue${filter !== "all" ? `?status=${filter}` : ""}`;
    const data = await fetch(url).then((r) => r.json());
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function approve(id: number) {
    await fetch(`/api/posts/${id}/approve`, { method: "POST" });
    toast.success("Approved — moved to scheduled");
    load();
  }

  async function reject(id: number) {
    await fetch(`/api/posts/${id}/reject`, { method: "POST" });
    toast.success("Rejected");
    load();
  }

  async function deletePost(id: number) {
    setDeleting(id);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
    setDeleting(null);
  }

  // Use grid for draft/all views, list for approval/scheduled/posted/failed
  const useGrid = filter === "all" || filter === "draft";

  // Count by status for filter badges
  const counts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Queue</h1>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => {
          const count = f === "all" ? posts.length : (counts[f] ?? 0);
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded capitalize transition-colors"
              style={{
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "#000" : "var(--muted)",
                border: "1px solid var(--border)",
                fontWeight: active ? 600 : 400,
              }}>
              {f.replace("_", " ")}
              {count > 0 && (
                <span className="rounded-full px-1.5 py-0 text-[10px]"
                  style={{ background: active ? "rgba(0,0,0,0.2)" : "var(--border)" }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--muted)" }}>
          <p className="text-sm">No posts in this view.</p>
          <Link href="/compose" className="btn-primary inline-block mt-4 text-sm">Create a post</Link>
        </div>
      ) : useGrid ? (
        /* ── GRID VIEW (draft / all) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => {
            const style = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
            const tags = extractHashtags(post.content);
            const captionOnly = post.content.replace(/#\w+/g, "").trim();
            const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;

            return (
              <div key={post.id} className="surface flex flex-col overflow-hidden"
                style={{ borderRadius: 8 }}>

                {/* Media preview / placeholder */}
                <div className="relative w-full bg-black flex items-center justify-center overflow-hidden"
                  style={{ aspectRatio: "1/1", maxHeight: 280 }}>
                  {hasMedia ? (
                    post.mediaUrls[0].match(/\.(mp4|mov|webm)$/i) ? (
                      <video src={post.mediaUrls[0]} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <ImageIcon size={36} />
                      <span className="text-xs">No media</span>
                    </div>
                  )}
                  {/* Multi-media indicator */}
                  {post.mediaUrls && post.mediaUrls.length > 1 && (
                    <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                      +{post.mediaUrls.length - 1}
                    </span>
                  )}
                  {/* Status badge */}
                  <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}33` }}>
                    {style.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 p-3 gap-2">
                  {/* Caption */}
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {truncate(captionOnly || post.content)}
                  </p>

                  {/* Hashtags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--border)", color: "var(--accent)" }}>
                          {tag}
                        </span>
                      ))}
                      {tags.length > 6 && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>+{tags.length - 6} more</span>
                      )}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs mt-auto pt-1" style={{ color: "var(--muted)" }}>
                    <span className="flex items-center gap-1">
                      <Users size={10} />
                      {post.profileIds.length} profile{post.profileIds.length !== 1 ? "s" : ""}
                    </span>
                    {post.scheduledAt ? (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(post.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(post.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>

                  {post.failureReason && (
                    <p className="text-xs rounded px-2 py-1" style={{ background: "#2d0d0d", color: "#f87171" }}>
                      {post.failureReason}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                    {post.status === "pending_approval" && (
                      <>
                        <button onClick={() => approve(post.id)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded"
                          style={{ background: "#0d2d1a", color: "#4ade80" }}>
                          <CheckCircle size={11} /> Approve
                        </button>
                        <button onClick={() => reject(post.id)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded"
                          style={{ background: "#2d0d0d", color: "#f87171" }}>
                          <XCircle size={11} /> Reject
                        </button>
                      </>
                    )}
                    {(post.status === "draft" || post.status === "scheduled") && (
                      <Link href={`/compose?edit=${post.id}`}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded"
                        style={{ background: "var(--border)", color: "var(--foreground)" }}>
                        <Edit3 size={11} /> Edit
                      </Link>
                    )}
                    <button onClick={() => deletePost(post.id)} disabled={deleting === post.id}
                      className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded hover:opacity-80"
                      style={{ background: "var(--border)", color: "var(--muted)" }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW (scheduled / posted / failed / pending) ── */
        <div className="space-y-3">
          {posts.map((post) => {
            const style = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
            const tags = extractHashtags(post.content);
            const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
            return (
              <div key={post.id} className="surface p-4 flex gap-4">
                {/* Thumbnail */}
                {hasMedia && (
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0"
                    style={{ background: "var(--border)" }}>
                    <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2 mb-1">{post.content}</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--border)", color: "var(--accent)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="px-2 py-0.5 rounded-full"
                      style={{ background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                    <span className="flex items-center gap-1"><Users size={10} />{post.profileIds.length} profile{post.profileIds.length !== 1 ? "s" : ""}</span>
                    {post.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {post.failureReason && (
                    <p className="text-xs mt-1" style={{ color: "#f87171" }}>Error: {post.failureReason}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {post.status === "pending_approval" && (
                    <>
                      <button onClick={() => approve(post.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded"
                        style={{ background: "#0d2d1a", color: "#4ade80" }}>
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button onClick={() => reject(post.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded"
                        style={{ background: "#2d0d0d", color: "#f87171" }}>
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => deletePost(post.id)} disabled={deleting === post.id}
                    className="flex items-center gap-1 text-xs px-2 py-1.5 rounded hover:opacity-80"
                    style={{ background: "var(--border)", color: "var(--muted)" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
