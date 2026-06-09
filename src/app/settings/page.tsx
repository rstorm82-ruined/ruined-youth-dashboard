"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface Profile { id: number; name: string; platform: string; zernioAccountId: string; groupId: number | null; }
interface Group { id: number; name: string; description: string | null; }

const PLATFORMS = ["instagram", "tiktok", "twitter", "facebook", "youtube", "threads"];

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newProfile, setNewProfile] = useState({ name: "", platform: "instagram", zernioAccountId: "", groupId: "" });
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [tab, setTab] = useState<"profiles" | "groups">("profiles");

  async function load() {
    const [p, g] = await Promise.all([
      fetch("/api/profiles").then((r) => r.json()),
      fetch("/api/profiles/groups").then((r) => r.json()),
    ]);
    setProfiles(p);
    setGroups(g);
  }

  useEffect(() => { load(); }, []);

  async function createProfile() {
    if (!newProfile.name || !newProfile.zernioAccountId) return toast.error("Fill required fields");
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newProfile,
        groupId: newProfile.groupId ? parseInt(newProfile.groupId) : null,
      }),
    });
    if (res.ok) {
      toast.success("Profile added");
      setNewProfile({ name: "", platform: "instagram", zernioAccountId: "", groupId: "" });
      load();
    } else toast.error("Failed");
  }

  async function deleteProfile(id: number) {
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  }

  async function createGroup() {
    if (!newGroup.name) return toast.error("Group name required");
    await fetch("/api/profiles/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGroup),
    });
    toast.success("Group created");
    setNewGroup({ name: "", description: "" });
    load();
  }

  async function deleteGroup(id: number) {
    await fetch(`/api/profiles/groups/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  }

  const inputStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 13,
    width: "100%",
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex gap-2 mb-6">
        {(["profiles", "groups"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="text-sm px-4 py-2 rounded capitalize"
            style={{
              background: tab === t ? "var(--accent)" : "var(--surface)",
              color: tab === t ? "#000" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "profiles" && (
        <div>
          <div className="surface p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Add Profile
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input style={inputStyle} placeholder="Display name *"
                value={newProfile.name} onChange={(e) => setNewProfile((p) => ({ ...p, name: e.target.value }))} />
              <select style={inputStyle} value={newProfile.platform}
                onChange={(e) => setNewProfile((p) => ({ ...p, platform: e.target.value }))}>
                {PLATFORMS.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
              </select>
              <input style={inputStyle} placeholder="Zernio Account ID *"
                value={newProfile.zernioAccountId}
                onChange={(e) => setNewProfile((p) => ({ ...p, zernioAccountId: e.target.value }))} />
              <select style={inputStyle} value={newProfile.groupId}
                onChange={(e) => setNewProfile((p) => ({ ...p, groupId: e.target.value }))}>
                <option value="">No group</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <button onClick={createProfile} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Add Profile
            </button>
          </div>

          <div className="surface">
            {profiles.map((p, i) => (
              <div key={p.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < profiles.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>
                    {p.platform} · {p.zernioAccountId}
                  </p>
                </div>
                <button onClick={() => deleteProfile(p.id)} className="hover:opacity-70">
                  <Trash2 size={14} style={{ color: "var(--muted)" }} />
                </button>
              </div>
            ))}
            {profiles.length === 0 && (
              <p className="p-4 text-sm" style={{ color: "var(--muted)" }}>No profiles yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === "groups" && (
        <div>
          <div className="surface p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Create Group
            </h2>
            <div className="space-y-3 mb-3">
              <input style={inputStyle} placeholder="Group name (e.g. Skate Accounts)"
                value={newGroup.name} onChange={(e) => setNewGroup((p) => ({ ...p, name: e.target.value }))} />
              <input style={inputStyle} placeholder="Description (optional)"
                value={newGroup.description}
                onChange={(e) => setNewGroup((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <button onClick={createGroup} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Create Group
            </button>
          </div>

          <div className="surface">
            {groups.map((g, i) => (
              <div key={g.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < groups.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{g.name}</p>
                  {g.description && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{g.description}</p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {profiles.filter((p) => p.groupId === g.id).length} profiles
                  </p>
                </div>
                <button onClick={() => deleteGroup(g.id)} className="hover:opacity-70">
                  <Trash2 size={14} style={{ color: "var(--muted)" }} />
                </button>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="p-4 text-sm" style={{ color: "var(--muted)" }}>No groups yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
