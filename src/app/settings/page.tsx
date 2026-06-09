"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Profile { id: number; name: string; platform: string; zernioAccountId: string; groupId: number | null; avatarUrl: string | null; }
interface Group { id: number; name: string; description: string | null; }
interface ZernioAccount {
  _id: string;
  displayName: string;
  username: string;
  platform: string;
  profilePicture: string;
  isActive: boolean;
  platformStatus: string;
  profileId: { _id: string; name: string };
}

const PLATFORM_MAP: Record<string, string> = {
  twitter: "twitter",
  tiktok: "tiktok",
  instagram: "instagram",
  facebook: "facebook",
  youtube: "youtube",
  threads: "threads",
};

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [zernioAccounts, setZernioAccounts] = useState<ZernioAccount[]>([]);
  const [loadingZernio, setLoadingZernio] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [tab, setTab] = useState<"import" | "profiles" | "groups">("import");

  async function load() {
    const [p, g] = await Promise.all([
      fetch("/api/profiles").then((r) => r.json()),
      fetch("/api/profiles/groups").then((r) => r.json()),
    ]);
    setProfiles(p);
    setGroups(g);
  }

  async function loadZernio() {
    setLoadingZernio(true);
    try {
      const accounts = await fetch("/api/zernio/accounts").then((r) => r.json());
      setZernioAccounts(accounts);
    } catch {
      toast.error("Failed to load Zernio accounts");
    } finally {
      setLoadingZernio(false);
    }
  }

  useEffect(() => {
    load();
    loadZernio();
  }, []);

  const importedIds = new Set(profiles.map((p) => p.zernioAccountId));

  async function importAccount(account: ZernioAccount) {
    if (importedIds.has(account._id)) return;
    setImporting(account._id);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: account.displayName || account.username,
          platform: PLATFORM_MAP[account.platform] ?? "twitter",
          zernioAccountId: account._id,
          avatarUrl: account.profilePicture,
        }),
      });
      if (res.ok) {
        toast.success(`Imported @${account.username}`);
        load();
      } else toast.error("Import failed");
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(null);
    }
  }

  async function importAll() {
    const toImport = zernioAccounts.filter((a) => !importedIds.has(a._id) && a.isActive);
    for (const account of toImport) {
      await importAccount(account);
    }
  }

  async function deleteProfile(id: number) {
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    toast.success("Removed");
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
    padding: "7px 10px",
    fontSize: 13,
    width: "100%",
  };

  // Group zernio accounts by profile name
  const byProfile = zernioAccounts.reduce<Record<string, ZernioAccount[]>>((acc, a) => {
    const key = a.profileId?.name ?? "Ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex gap-2 mb-6">
        {(["import", "profiles", "groups"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="text-sm px-4 py-2 rounded capitalize"
            style={{
              background: tab === t ? "var(--accent)" : "var(--surface)",
              color: tab === t ? "#000" : "var(--foreground)",
              border: "1px solid var(--border)",
            }}>
            {t === "import" ? "Import from Zernio" : t}
          </button>
        ))}
      </div>

      {tab === "import" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {zernioAccounts.length} accounts found in Zernio · {importedIds.size} already imported
            </p>
            <div className="flex gap-2">
              <button onClick={loadZernio} disabled={loadingZernio}
                className="btn-ghost flex items-center gap-2 text-sm">
                <RefreshCw size={13} className={loadingZernio ? "animate-spin" : ""} />
                Refresh
              </button>
              <button onClick={importAll} className="btn-primary text-sm">
                Import All Active
              </button>
            </div>
          </div>

          {Object.entries(byProfile).map(([profileName, accounts]) => (
            <div key={profileName} className="surface p-4 mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--accent)" }}>
                {profileName}
              </p>
              <div className="space-y-2">
                {accounts.map((account) => {
                  const alreadyImported = importedIds.has(account._id);
                  const isLoading = importing === account._id;
                  return (
                    <div key={account._id} className="flex items-center gap-3 py-2 border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}>
                      <img src={account.profilePicture} alt=""
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">@{account.username}</p>
                        <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>
                          {account.platform} ·{" "}
                          <span style={{ color: account.isActive && account.platformStatus === "active" ? "#4ade80" : "#f87171" }}>
                            {account.isActive && account.platformStatus === "active" ? "active" : "needs reconnection"}
                          </span>
                        </p>
                      </div>
                      {alreadyImported ? (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "#4ade80" }}>
                          <CheckCircle size={12} /> Imported
                        </span>
                      ) : (
                        <button
                          onClick={() => importAccount(account)}
                          disabled={isLoading}
                          className="text-xs px-3 py-1.5 rounded transition-colors"
                          style={{ background: "var(--accent)", color: "#000", fontWeight: 600 }}>
                          {isLoading ? "..." : "Import"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "profiles" && (
        <div>
          <div className="surface">
            {profiles.length === 0 ? (
              <p className="p-4 text-sm" style={{ color: "var(--muted)" }}>
                No profiles yet. Use the Import tab to add from Zernio.
              </p>
            ) : (
              profiles.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < profiles.length - 1 ? "1px solid var(--border)" : "none" }}>
                  {p.avatarUrl && (
                    <img src={p.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>
                      {p.platform} · {p.zernioAccountId}
                    </p>
                  </div>
                  {groups.length > 0 && (
                    <select
                      defaultValue={p.groupId ?? ""}
                      onChange={async (e) => {
                        await fetch(`/api/profiles/${p.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ groupId: e.target.value ? parseInt(e.target.value) : null }),
                        });
                        load();
                      }}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "var(--border)", border: "none", color: "var(--foreground)" }}>
                      <option value="">No group</option>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  )}
                  <button onClick={() => deleteProfile(p.id)} className="hover:opacity-70 flex-shrink-0">
                    <Trash2 size={14} style={{ color: "var(--muted)" }} />
                  </button>
                </div>
              ))
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
              <input style={inputStyle} placeholder="Group name (e.g. Ruined Youth)"
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
              <div key={g.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < groups.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {profiles.filter((p) => p.groupId === g.id).length} profiles
                    {g.description && ` · ${g.description}`}
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
