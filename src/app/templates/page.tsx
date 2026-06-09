"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Hash } from "lucide-react";
import toast from "react-hot-toast";

interface Template { id: number; name: string; captionTemplate: string; }
interface HashtagGroup { id: number; name: string; tags: string[]; }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([]);
  const [newTemplate, setNewTemplate] = useState({ name: "", captionTemplate: "" });
  const [newHashtag, setNewHashtag] = useState({ name: "", tags: "" });

  async function load() {
    const [t, h] = await Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/templates/hashtags").then((r) => r.json()),
    ]);
    setTemplates(t);
    setHashtagGroups(h);
  }

  useEffect(() => { load(); }, []);

  async function createTemplate() {
    if (!newTemplate.name || !newTemplate.captionTemplate) return toast.error("Fill all fields");
    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTemplate),
    });
    setNewTemplate({ name: "", captionTemplate: "" });
    toast.success("Template created");
    load();
  }

  async function deleteTemplate(id: number) {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  }

  async function createHashtag() {
    if (!newHashtag.name || !newHashtag.tags) return toast.error("Fill all fields");
    const tags = newHashtag.tags.split(/[\s,]+/).map((t) => t.replace(/^#/, "")).filter(Boolean);
    await fetch("/api/templates/hashtags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newHashtag.name, tags }),
    });
    setNewHashtag({ name: "", tags: "" });
    toast.success("Hashtag group created");
    load();
  }

  async function deleteHashtag(id: number) {
    await fetch(`/api/templates/hashtags/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Templates</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Caption Templates */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
            Caption Templates
          </h2>

          <div className="surface p-4 mb-4">
            <input
              value={newTemplate.name}
              onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
              placeholder="Template name"
              className="w-full text-sm bg-transparent outline-none mb-2 pb-2 border-b"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <textarea
              value={newTemplate.captionTemplate}
              onChange={(e) => setNewTemplate((p) => ({ ...p, captionTemplate: e.target.value }))}
              placeholder="Caption template text..."
              rows={3}
              className="w-full text-sm bg-transparent outline-none resize-none mb-3"
              style={{ color: "var(--foreground)" }}
            />
            <button onClick={createTemplate} className="btn-primary text-xs flex items-center gap-1">
              <Plus size={12} /> Add Template
            </button>
          </div>

          <div className="space-y-2">
            {templates.map((t) => (
              <div key={t.id} className="surface p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>
                    {t.captionTemplate}
                  </p>
                </div>
                <button onClick={() => deleteTemplate(t.id)} className="flex-shrink-0 hover:opacity-70">
                  <Trash2 size={14} style={{ color: "var(--muted)" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hashtag Groups */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
            Hashtag Groups
          </h2>

          <div className="surface p-4 mb-4">
            <input
              value={newHashtag.name}
              onChange={(e) => setNewHashtag((p) => ({ ...p, name: e.target.value }))}
              placeholder="Group name (e.g. Skate Niche)"
              className="w-full text-sm bg-transparent outline-none mb-2 pb-2 border-b"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            />
            <textarea
              value={newHashtag.tags}
              onChange={(e) => setNewHashtag((p) => ({ ...p, tags: e.target.value }))}
              placeholder="#skating #sk8 #skatelife (space or comma separated)"
              rows={3}
              className="w-full text-sm bg-transparent outline-none resize-none mb-3"
              style={{ color: "var(--foreground)" }}
            />
            <button onClick={createHashtag} className="btn-primary text-xs flex items-center gap-1">
              <Hash size={12} /> Add Group
            </button>
          </div>

          <div className="space-y-2">
            {hashtagGroups.map((g) => (
              <div key={g.id} className="surface p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">{g.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {g.tags.slice(0, 8).map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--border)", color: "var(--muted)" }}>
                        #{tag}
                      </span>
                    ))}
                    {g.tags.length > 8 && (
                      <span className="text-xs" style={{ color: "var(--muted)" }}>+{g.tags.length - 8}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteHashtag(g.id)} className="flex-shrink-0 hover:opacity-70">
                  <Trash2 size={14} style={{ color: "var(--muted)" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
