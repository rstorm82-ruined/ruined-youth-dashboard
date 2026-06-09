"use client";

import { useEffect, useState } from "react";
import { RefreshCw, MessageSquare } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface DM {
  id: number;
  profileId: number;
  platform: string;
  sender: string;
  message: string;
  isRead: boolean;
  receivedAt: string;
}

export default function InboxPage() {
  const [dms, setDms] = useState<DM[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/inbox");
    setDms(await res.json());
    setLoading(false);
  }

  async function syncInbox() {
    setSyncing(true);
    try {
      await fetch("/api/inbox/sync", { method: "POST" });
      toast.success("Inbox synced");
      load();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function markRead(id: number) {
    await fetch(`/api/inbox/${id}/read`, { method: "POST" });
    setDms((prev) => prev.map((d) => (d.id === id ? { ...d, isRead: true } : d)));
  }

  useEffect(() => { load(); }, []);

  const unread = dms.filter((d) => !d.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          {unread > 0 && (
            <p className="text-sm mt-1" style={{ color: "var(--accent)" }}>{unread} unread</p>
          )}
        </div>
        <button onClick={syncInbox} disabled={syncing}
          className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          Sync
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading...</p>
      ) : dms.length === 0 ? (
        <div className="surface p-8 text-center">
          <MessageSquare size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>No messages. Hit Sync to pull from Zernio.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dms.map((dm) => (
            <div key={dm.id}
              onClick={() => !dm.isRead && markRead(dm.id)}
              className="surface p-4 cursor-pointer transition-colors hover:border-white/10"
              style={{
                borderColor: dm.isRead ? "var(--border)" : "var(--accent)",
                opacity: dm.isRead ? 0.7 : 1,
              }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!dm.isRead && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
                    )}
                    <span className="font-medium text-sm">{dm.sender}</span>
                    <span className="text-xs capitalize px-1.5 py-0.5 rounded"
                      style={{ background: "var(--border)", color: "var(--muted)" }}>
                      {dm.platform}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-2" style={{ color: dm.isRead ? "var(--muted)" : "var(--foreground)" }}>
                    {dm.message}
                  </p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                  {relativeTime(dm.receivedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
