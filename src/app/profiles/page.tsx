"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, AlertTriangle, CheckCircle } from "lucide-react";

interface Profile {
  id: number;
  name: string;
  platform: string;
  healthStatus: string;
  lastPostedAt: string | null;
  groupId: number | null;
  avatarUrl: string | null;
}

interface Group {
  id: number;
  name: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e1306c",
  tiktok: "#69c9d0",
  twitter: "#1d9bf0",
  facebook: "#1877f2",
  youtube: "#ff0000",
  threads: "#000",
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/profiles").then((r) => r.json()),
      fetch("/api/profiles/groups").then((r) => r.json()),
    ]).then(([p, g]) => {
      setProfiles(p);
      setGroups(g);
      setLoading(false);
    });
  }, []);

  const filtered = profiles.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup === "all" || String(p.groupId) === filterGroup;
    const matchPlatform = filterPlatform === "all" || p.platform === filterPlatform;
    return matchSearch && matchGroup && matchPlatform;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Profiles</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {profiles.length} accounts connected
          </p>
        </div>
        <Link href="/settings" className="btn-primary flex items-center gap-2">
          <Plus size={14} />
          Add Profile
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="text-sm px-3 py-2 rounded-md"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={String(g.id)}>{g.name}</option>
          ))}
        </select>
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="text-sm px-3 py-2 rounded-md"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          <option value="all">All Platforms</option>
          {["instagram", "tiktok", "twitter", "facebook", "youtube", "threads"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "var(--muted)" }}>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((profile) => (
            <Link key={profile.id} href={`/profiles/${profile.id}`}
              className="surface p-4 hover:border-white/20 transition-colors block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: PLATFORM_COLORS[profile.platform] ?? "#333" }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{profile.name}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>{profile.platform}</p>
                </div>
                {profile.healthStatus === "healthy" ? (
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                )}
              </div>
              {profile.lastPostedAt && (
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Last post: {new Date(profile.lastPostedAt).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm col-span-3" style={{ color: "var(--muted)" }}>No profiles found.</p>
          )}
        </div>
      )}
    </div>
  );
}
