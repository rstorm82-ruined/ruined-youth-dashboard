"use client";

import { useEffect, useState } from "react";

const ZONES = [
  { label: "ET",  tz: "America/New_York",    city: "New York"   },
  { label: "CT",  tz: "America/Chicago",     city: "Chicago"    },
  { label: "MT",  tz: "America/Denver",      city: "Denver"     },
  { label: "PT",  tz: "America/Los_Angeles", city: "LA"         },
];

function getTime(tz: string) {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getDay(tz: string) {
  return new Date().toLocaleDateString("en-US", {
    timeZone: tz,
    weekday: "short",
  });
}

// Is it a "good" posting hour in this tz? (roughly 8am-10pm)
function isActiveHour(tz: string) {
  const hour = parseInt(
    new Date().toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    })
  );
  return hour >= 8 && hour < 22;
}

export default function WorldClock() {
  const [, setTick] = useState(0);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="px-3 py-3 border-t" style={{ borderColor: "var(--border)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-2"
        style={{ color: "var(--muted)" }}>
        🇺🇸 USA / 🇨🇦 Canada
      </p>
      <div className="space-y-1">
        {ZONES.map(({ label, tz, city }) => {
          const active = isActiveHour(tz);
          return (
            <div key={label}
              className="flex items-center justify-between px-2 py-1 rounded"
              style={{ background: active ? "rgba(229,255,0,0.05)" : "transparent" }}>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: active ? "var(--accent)" : "var(--border)" }}
                />
                <span className="text-xs font-bold" style={{ color: active ? "var(--foreground)" : "var(--muted)" }}>
                  {label}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{city}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold"
                  style={{ color: active ? "var(--accent)" : "var(--muted)" }}>
                  {getTime(tz)}
                </span>
                <span className="text-xs ml-1" style={{ color: "var(--muted)" }}>
                  {getDay(tz)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
