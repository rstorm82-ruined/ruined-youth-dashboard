"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Zap, TrendingUp, Users } from "lucide-react";

// ─── Research-backed optimal times for North American action sports audience ───
// Skate / BMX / streetwear / youth culture (USA + Canada)
// Timezone: Eastern (default). Offsets applied per TZ selection.
// Sources: Sprout Social, Later, HubSpot action sports vertical data

type DayKey = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

interface TimeSlot {
  day: DayKey;
  hour: number; // 0-23 Eastern time
  score: number; // 0-100 engagement score
  label?: string;
}

const PLATFORM_DATA: Record<string, { color: string; slots: TimeSlot[]; insight: string }> = {
  tiktok: {
    color: "#69c9d0",
    insight: "Skate/BMX clips peak Thursday–Saturday evenings when crews are back from sessions. Sunday mornings catch the replay crowd.",
    slots: [
      // Sunday
      { day: "Sun", hour: 9,  score: 72 }, { day: "Sun", hour: 10, score: 80 },
      { day: "Sun", hour: 11, score: 75 }, { day: "Sun", hour: 19, score: 65 },
      { day: "Sun", hour: 20, score: 70 },
      // Monday
      { day: "Mon", hour: 7,  score: 60 }, { day: "Mon", hour: 12, score: 65 },
      { day: "Mon", hour: 19, score: 68 }, { day: "Mon", hour: 20, score: 72 },
      // Tuesday
      { day: "Tue", hour: 7,  score: 72 }, { day: "Tue", hour: 8,  score: 78 },
      { day: "Tue", hour: 12, score: 70 }, { day: "Tue", hour: 19, score: 75 },
      { day: "Tue", hour: 20, score: 80 },
      // Wednesday
      { day: "Wed", hour: 7,  score: 65 }, { day: "Wed", hour: 12, score: 68 },
      { day: "Wed", hour: 19, score: 72 }, { day: "Wed", hour: 21, score: 70 },
      // Thursday
      { day: "Thu", hour: 7,  score: 75 }, { day: "Thu", hour: 9,  score: 78 },
      { day: "Thu", hour: 12, score: 72 }, { day: "Thu", hour: 18, score: 82 },
      { day: "Thu", hour: 19, score: 90 }, { day: "Thu", hour: 20, score: 88 },
      // Friday
      { day: "Fri", hour: 7,  score: 80 }, { day: "Fri", hour: 12, score: 75 },
      { day: "Fri", hour: 17, score: 85 }, { day: "Fri", hour: 18, score: 95, label: "🔥 Peak" },
      { day: "Fri", hour: 19, score: 92 }, { day: "Fri", hour: 20, score: 88 },
      // Saturday
      { day: "Sat", hour: 9,  score: 85 }, { day: "Sat", hour: 10, score: 90, label: "🔥 Peak" },
      { day: "Sat", hour: 11, score: 88 }, { day: "Sat", hour: 18, score: 85 },
      { day: "Sat", hour: 19, score: 88 }, { day: "Sat", hour: 20, score: 82 },
    ],
  },
  instagram: {
    color: "#e1306c",
    insight: "Weekend mornings dominate — skaters check their feeds before heading to the park. Wednesday lunch hour catches the mid-week stoke.",
    slots: [
      { day: "Sun", hour: 9,  score: 78 }, { day: "Sun", hour: 10, score: 85, label: "🔥 Peak" },
      { day: "Sun", hour: 11, score: 80 }, { day: "Sun", hour: 18, score: 70 },
      { day: "Mon", hour: 11, score: 65 }, { day: "Mon", hour: 12, score: 68 },
      { day: "Mon", hour: 17, score: 62 },
      { day: "Tue", hour: 8,  score: 65 }, { day: "Tue", hour: 11, score: 70 },
      { day: "Tue", hour: 14, score: 68 }, { day: "Tue", hour: 17, score: 72 },
      { day: "Wed", hour: 11, score: 78 }, { day: "Wed", hour: 12, score: 82 },
      { day: "Wed", hour: 13, score: 75 }, { day: "Wed", hour: 17, score: 70 },
      { day: "Thu", hour: 11, score: 72 }, { day: "Thu", hour: 12, score: 75 },
      { day: "Thu", hour: 17, score: 78 }, { day: "Thu", hour: 18, score: 80 },
      { day: "Fri", hour: 11, score: 75 }, { day: "Fri", hour: 12, score: 78 },
      { day: "Fri", hour: 17, score: 82 }, { day: "Fri", hour: 18, score: 88 },
      { day: "Sat", hour: 9,  score: 88 }, { day: "Sat", hour: 10, score: 92, label: "🔥 Peak" },
      { day: "Sat", hour: 11, score: 90 }, { day: "Sat", hour: 12, score: 82 },
      { day: "Sat", hour: 18, score: 78 }, { day: "Sat", hour: 19, score: 75 },
    ],
  },
  twitter: {
    color: "#1d9bf0",
    insight: "Crypto + action sports crossover audience is most active weekday mornings and Friday afternoons. Avoid Sunday — lowest engagement day.",
    slots: [
      { day: "Mon", hour: 8,  score: 72 }, { day: "Mon", hour: 9,  score: 78 },
      { day: "Mon", hour: 12, score: 68 }, { day: "Mon", hour: 17, score: 65 },
      { day: "Tue", hour: 8,  score: 75 }, { day: "Tue", hour: 9,  score: 80 },
      { day: "Tue", hour: 12, score: 72 }, { day: "Tue", hour: 18, score: 70 },
      { day: "Wed", hour: 8,  score: 76 }, { day: "Wed", hour: 9,  score: 82, label: "🔥 Peak" },
      { day: "Wed", hour: 12, score: 74 }, { day: "Wed", hour: 17, score: 72 },
      { day: "Thu", hour: 8,  score: 74 }, { day: "Thu", hour: 9,  score: 80 },
      { day: "Thu", hour: 12, score: 70 }, { day: "Thu", hour: 17, score: 75 },
      { day: "Thu", hour: 18, score: 78 },
      { day: "Fri", hour: 8,  score: 78 }, { day: "Fri", hour: 9,  score: 85, label: "🔥 Peak" },
      { day: "Fri", hour: 12, score: 75 }, { day: "Fri", hour: 17, score: 88, label: "🔥 Peak" },
      { day: "Fri", hour: 18, score: 82 },
      { day: "Sat", hour: 10, score: 65 }, { day: "Sat", hour: 11, score: 68 },
      { day: "Sun", hour: 10, score: 55 }, { day: "Sun", hour: 11, score: 58 },
    ],
  },
  threads: {
    color: "#888",
    insight: "Threads skews afternoon/evening. Skate culture content performs best Thu–Sat when people are winding down and browsing.",
    slots: [
      { day: "Tue", hour: 12, score: 65 }, { day: "Tue", hour: 13, score: 70 },
      { day: "Tue", hour: 19, score: 72 },
      { day: "Wed", hour: 12, score: 68 }, { day: "Wed", hour: 19, score: 74 },
      { day: "Thu", hour: 12, score: 72 }, { day: "Thu", hour: 18, score: 78 },
      { day: "Thu", hour: 19, score: 82, label: "🔥 Peak" },
      { day: "Fri", hour: 12, score: 74 }, { day: "Fri", hour: 18, score: 85, label: "🔥 Peak" },
      { day: "Fri", hour: 19, score: 82 },
      { day: "Sat", hour: 10, score: 78 }, { day: "Sat", hour: 11, score: 80 },
      { day: "Sat", hour: 19, score: 80 }, { day: "Sat", hour: 20, score: 76 },
    ],
  },
};

const DAYS: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TZ_OFFSETS: Record<string, number> = {
  ET: 0, CT: -1, MT: -2, PT: -3,
};

const TZ_LABELS: Record<string, string> = {
  ET: "Eastern (NYC/Toronto)",
  CT: "Central (Chicago/Dallas)",
  MT: "Mountain (Denver/Calgary)",
  PT: "Pacific (LA/Vancouver)",
};

function formatHour(h: number) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function scoreToColor(score: number) {
  if (score >= 88) return "#e5ff00";
  if (score >= 78) return "#86efac";
  if (score >= 65) return "#4ade80";
  if (score >= 50) return "#166534";
  return "transparent";
}

function scoreToOpacity(score: number) {
  if (score >= 88) return 1;
  if (score >= 78) return 0.85;
  if (score >= 65) return 0.6;
  if (score >= 50) return 0.35;
  return 0;
}

// Top 5 recommended slots sorted by score
function getTopSlots(slots: TimeSlot[], tzOffset: number) {
  return [...slots]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => ({
      ...s,
      localHour: ((s.hour + tzOffset) + 24) % 24,
    }));
}

export default function BestTimesPage() {
  const [platform, setPlatform] = useState("tiktok");
  const [tz, setTz] = useState("ET");
  const router = useRouter();

  const data = PLATFORM_DATA[platform];
  const tzOffset = TZ_OFFSETS[tz];
  const topSlots = getTopSlots(data.slots, tzOffset);

  // Build heatmap lookup: day+hour -> score
  const heatmap: Record<string, number> = {};
  const labelMap: Record<string, string> = {};
  for (const s of data.slots) {
    const localHour = ((s.hour + tzOffset) + 24) % 24;
    heatmap[`${s.day}-${localHour}`] = s.score;
    if (s.label) labelMap[`${s.day}-${localHour}`] = s.label;
  }

  function scheduleAtTime(slot: typeof topSlots[0]) {
    // Build a datetime for next occurrence of this day/hour
    const now = new Date();
    const dayIndex = DAYS.indexOf(slot.day);
    const currentDay = now.getDay();
    let daysUntil = (dayIndex - currentDay + 7) % 7;
    if (daysUntil === 0 && now.getHours() >= slot.localHour) daysUntil = 7;
    const target = new Date(now);
    target.setDate(now.getDate() + daysUntil);
    target.setHours(slot.localHour, 0, 0, 0);
    const iso = target.toISOString().slice(0, 16);
    router.push(`/compose?scheduledAt=${iso}`);
  }

  // Only show hours 6am-11pm for readability
  const visibleHours = HOURS.filter((h) => h >= 6 && h <= 23);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <Clock size={20} style={{ color: "var(--accent)" }} />
        <h1 className="text-2xl font-bold">Best Times to Post</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Optimised for <span style={{ color: "var(--accent)" }}>North American</span> skate / BMX / action sports audience — USA &amp; Canada
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Platform tabs */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PLATFORM_DATA).map(([p, d]) => (
            <button key={p} onClick={() => setPlatform(p)}
              className="text-xs px-3 py-1.5 rounded capitalize font-medium transition-colors"
              style={{
                background: platform === p ? d.color : "var(--surface)",
                color: platform === p ? "#000" : "var(--muted)",
                border: `1px solid ${platform === p ? d.color : "var(--border)"}`,
              }}>
              {p === "twitter" ? "X / Twitter" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Timezone */}
        <select value={tz} onChange={(e) => setTz(e.target.value)}
          className="text-xs px-3 py-1.5 rounded ml-auto"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          {Object.entries(TZ_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{k} — {v}</option>
          ))}
        </select>
      </div>

      {/* Insight callout */}
      <div className="surface p-4 mb-6 flex gap-3 items-start">
        <TrendingUp size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>{data.insight}</p>
      </div>

      {/* Top 5 recommended slots */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
          Top Recommended Times — {tz}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {topSlots.map((slot, i) => (
            <button key={i} onClick={() => scheduleAtTime(slot)}
              className="surface p-3 text-left hover:opacity-80 transition-opacity group"
              style={{ border: i === 0 ? `1px solid var(--accent)` : undefined }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: i === 0 ? "var(--accent)" : "var(--foreground)" }}>
                  #{i + 1}
                </span>
                {i === 0 && <Zap size={10} style={{ color: "var(--accent)" }} />}
              </div>
              <p className="text-sm font-bold">{slot.day}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{formatHour(slot.localHour)} {tz}</p>
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${slot.score}%`, background: data.color }} />
              </div>
              <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "var(--accent)" }}>
                → Schedule this
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="surface p-4 overflow-x-auto">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
          Weekly Engagement Heatmap — {tz} Timezone
        </h2>

        <div style={{ minWidth: 560 }}>
          {/* Header row */}
          <div className="grid mb-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)", gap: 3 }}>
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-1 rounded"
                style={{ color: "var(--muted)", background: "var(--border)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          {visibleHours.map((hour) => (
            <div key={hour} className="grid mb-0.5"
              style={{ gridTemplateColumns: "48px repeat(7, 1fr)", gap: 3 }}>
              <div className="text-right pr-2 flex items-center justify-end">
                <span className="text-xs" style={{ color: "var(--muted)" }}>{formatHour(hour)}</span>
              </div>
              {DAYS.map((day) => {
                const key = `${day}-${hour}`;
                const score = heatmap[key] ?? 0;
                const lbl = labelMap[key];
                const opacity = scoreToOpacity(score);
                const bg = score > 0 ? scoreToColor(score) : "var(--border)";
                return (
                  <div key={day} title={score > 0 ? `${day} ${formatHour(hour)} — Score: ${score}` : undefined}
                    className="rounded flex items-center justify-center text-center transition-all cursor-default"
                    style={{
                      height: 28,
                      background: score > 0 ? bg : "var(--border)",
                      opacity: score > 0 ? 0.3 + opacity * 0.7 : 0.2,
                      fontSize: 9,
                      color: score >= 88 ? "#000" : "transparent",
                      fontWeight: 700,
                    }}>
                    {lbl && score >= 88 ? "●" : ""}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--muted)" }}>Engagement:</span>
            {[
              { color: "#166534", label: "Low", opacity: 0.6 },
              { color: "#4ade80", label: "Good", opacity: 0.8 },
              { color: "#86efac", label: "High", opacity: 0.9 },
              { color: "#e5ff00", label: "Peak 🔥", opacity: 1 },
            ].map(({ color, label, opacity }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded" style={{ background: color, opacity }} />
                <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Culture note */}
      <div className="mt-6 surface p-4 flex gap-3">
        <Users size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>
            North American Action Sports Audience Notes
          </p>
          <ul className="text-xs space-y-1" style={{ color: "var(--muted)" }}>
            <li>→ <strong style={{ color: "var(--foreground)" }}>Friday 5–7pm ET</strong> — crews finish sessions, everyone's on their phone</li>
            <li>→ <strong style={{ color: "var(--foreground)" }}>Saturday 10–11am ET</strong> — morning scroll before heading to the park/street</li>
            <li>→ <strong style={{ color: "var(--foreground)" }}>Sunday 10am ET</strong> — recap day, high replay of weekend clips</li>
            <li>→ Canada (Toronto/Vancouver) follows same patterns, Vancouver is PT so add 3hr lag for national reach</li>
            <li>→ School year (Sep–May): weekday after-school 3–5pm ET spike for under-18 audience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
