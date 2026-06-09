"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface Post {
  id: number;
  content: string;
  status: string;
  scheduledAt: string | null;
  profileIds: number[];
  createdAt: string;
  failureReason: string | null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: "#1f1f1f", color: "#888" },
  pending_approval: { bg: "#2d2000", color: "#fbbf24" },
  scheduled: { bg: "#0d2d1a", color: "#4ade80" },
  posted: { bg: "#0d2d1a", color: "#4ade80" },
  failed: { bg: "#2d0d0d", color: "#f87171" },
};

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/posts/queue${filter !== "all" ? `?status=${filter}` : ""}`);
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function approve(id: number) {
    await fetch(`/api/posts/${id}/approve`, { method: "POST" });
    toast.success("Approved");
    load();
  }

  async function reject(id: number) {
    await fetch(`/api/posts/${id}/reject`, { method: "POST" });
    toast.success("Rejected");
    load();
  }

  const filters = ["all", "pending_approval", "scheduled", "draft", "posted", "failed"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Queue</h1>
        <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded capitalize transition-colors"
            style={{
              background: filter === f ? "var(--accent)" : "var(--surface)",
              color: filter === f ? "#000" : "var(--muted)",
              border: "1px solid var(--border)",
            }}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>No posts in this view.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const style = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
            return (
              <div key={post.id} className="surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-3 mb-2">{post.content}</p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: style.bg, color: style.color }}>
                        {post.status.replace("_", " ")}
                      </span>
                      <span>{post.profileIds.length} profile{post.profileIds.length !== 1 ? "s" : ""}</span>
                      {post.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(post.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {post.failureReason && (
                      <p className="text-xs mt-2" style={{ color: "#f87171" }}>
                        Error: {post.failureReason}
                      </p>
                    )}
                  </div>

                  {post.status === "pending_approval" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approve(post.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded"
                        style={{ background: "#0d2d1a", color: "#4ade80" }}>
                        <CheckCircle size={12} />
                        Approve
                      </button>
                      <button onClick={() => reject(post.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded"
                        style={{ background: "#2d0d0d", color: "#f87171" }}>
                        <XCircle size={12} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
