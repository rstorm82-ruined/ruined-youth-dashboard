"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Upload, X, Hash } from "lucide-react";
import toast from "react-hot-toast";

interface Profile { id: number; name: string; platform: string; groupId: number | null; }
interface Group { id: number; name: string; }
interface HashtagGroup { id: number; name: string; tags: string[]; }
interface Template { id: number; name: string; captionTemplate: string; }

export default function ComposePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [mode, setMode] = useState<"now" | "schedule" | "draft" | "approval">("approval");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profiles").then((r) => r.json()),
      fetch("/api/profiles/groups").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/templates/hashtags").then((r) => r.json()),
    ]).then(([p, g, t, h]) => {
      setProfiles(p);
      setGroups(g);
      setTemplates(t);
      setHashtagGroups(h);
    });
  }, []);

  function toggleProfile(id: number) {
    setSelectedProfiles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectGroup(groupId: number) {
    const groupProfiles = profiles.filter((p) => p.groupId === groupId).map((p) => p.id);
    const allSelected = groupProfiles.every((id) => selectedProfiles.includes(id));
    if (allSelected) {
      setSelectedProfiles((prev) => prev.filter((id) => !groupProfiles.includes(id)));
    } else {
      setSelectedProfiles((prev) => [...new Set([...prev, ...groupProfiles])]);
    }
  }

  async function generateCaption() {
    if (!content && selectedProfiles.length === 0) {
      toast.error("Add some context or select profiles first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, profileCount: selectedProfiles.length }),
      });
      const data = await res.json();
      setContent(data.caption);
    } catch {
      toast.error("Failed to generate caption");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      setMediaUrls((prev) => [...prev, data.url]);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim()) return toast.error("Write something first");
    if (selectedProfiles.length === 0) return toast.error("Select at least one profile");
    if (mode === "schedule" && !scheduledAt) return toast.error("Pick a schedule time");

    const statusMap = {
      now: "scheduled" as const,
      schedule: "scheduled" as const,
      draft: "draft" as const,
      approval: "pending_approval" as const,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mediaUrls,
          profileIds: selectedProfiles,
          status: statusMap[mode],
          scheduledAt: mode === "now" ? new Date().toISOString() : scheduledAt || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(mode === "now" ? "Post queued!" : mode === "draft" ? "Saved as draft" : mode === "approval" ? "Sent for approval" : "Scheduled!");
      setContent("");
      setMediaUrls([]);
      setSelectedProfiles([]);
      setScheduledAt("");
    } catch {
      toast.error("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  function insertHashtags(tags: string[]) {
    const hashStr = tags.map((t) => `#${t}`).join(" ");
    setContent((prev) => prev + (prev.endsWith(" ") || prev === "" ? "" : " ") + hashStr);
  }

  function applyTemplate(t: Template) {
    setContent(t.captionTemplate);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Compose Post</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: composer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="surface p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Caption</label>
              <div className="flex gap-2">
                {templates.length > 0 && (
                  <select
                    onChange={(e) => {
                      const t = templates.find((x) => x.id === Number(e.target.value));
                      if (t) applyTemplate(t);
                    }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: "var(--border)", color: "var(--foreground)", border: "none" }}>
                    <option value="">Template...</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
                <button onClick={generateCaption} disabled={aiLoading}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
                  style={{ background: "var(--border)", color: "var(--accent)" }}>
                  <Sparkles size={12} />
                  {aiLoading ? "Writing..." : "AI Caption"}
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's the post about?"
              rows={6}
              className="w-full text-sm resize-none bg-transparent outline-none"
              style={{ color: "var(--foreground)" }}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t"
              style={{ borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{content.length} chars</span>
              <div className="flex gap-2">
                {hashtagGroups.map((hg) => (
                  <button key={hg.id} onClick={() => insertHashtags(hg.tags)}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                    style={{ background: "var(--border)", color: "var(--muted)" }}>
                    <Hash size={10} />
                    {hg.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="surface p-4">
            <label className="text-xs uppercase tracking-wide block mb-3" style={{ color: "var(--muted)" }}>Media</label>
            <div className="flex gap-2 flex-wrap">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setMediaUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.8)" }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded flex flex-col items-center justify-center text-xs gap-1 transition-colors"
                style={{ border: "1px dashed var(--border)", color: "var(--muted)" }}>
                <Upload size={16} />
                {uploading ? "Uploading..." : "Add"}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {/* Schedule */}
          <div className="surface p-4">
            <label className="text-xs uppercase tracking-wide block mb-3" style={{ color: "var(--muted)" }}>Post Timing</label>
            <div className="flex gap-2 mb-3">
              {(["now", "schedule", "approval", "draft"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className="text-xs px-3 py-1.5 rounded capitalize transition-colors"
                  style={{
                    background: mode === m ? "var(--accent)" : "var(--border)",
                    color: mode === m ? "#000" : "var(--foreground)",
                  }}>
                  {m === "now" ? "Post Now" : m === "approval" ? "Send for Approval" : m}
                </button>
              ))}
            </div>
            {mode === "schedule" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="text-sm px-3 py-2 rounded w-full"
                style={{ background: "var(--border)", border: "none", color: "var(--foreground)" }}
              />
            )}
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
            {submitting ? "Saving..." : mode === "now" ? "Post Now" : mode === "schedule" ? "Schedule Post" : mode === "draft" ? "Save Draft" : "Send for Approval"}
          </button>
        </div>

        {/* Right: profile selector */}
        <div className="surface p-4 h-fit">
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
            Post To ({selectedProfiles.length} selected)
          </p>

          {groups.map((group) => {
            const groupProfiles = profiles.filter((p) => p.groupId === group.id);
            return (
              <div key={group.id} className="mb-4">
                <button onClick={() => selectGroup(group.id)}
                  className="text-xs font-semibold mb-2 flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--accent)" }}>
                  {group.name} ({groupProfiles.length})
                </button>
                <div className="space-y-1">
                  {groupProfiles.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProfiles.includes(p.id)}
                        onChange={() => toggleProfile(p.id)}
                        className="accent-[var(--accent)]"
                      />
                      {p.name}
                      <span className="text-xs capitalize" style={{ color: "var(--muted)" }}>{p.platform}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Profiles with no group */}
          {profiles.filter((p) => !p.groupId).length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Ungrouped</p>
              {profiles.filter((p) => !p.groupId).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(p.id)}
                    onChange={() => toggleProfile(p.id)}
                    className="accent-[var(--accent)]"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
