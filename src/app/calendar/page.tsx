"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Post {
  id: number;
  content: string;
  status: string;
  scheduledAt: string | null;
  profileIds: number[];
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/posts/queue?status=scheduled&limit=200")
      .then((r) => r.json())
      .then(setPosts);
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  function postsForDay(day: number) {
    return posts.filter((p) => {
      if (!p.scheduledAt) return false;
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const monthName = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft size={16} /></button>
          <span className="text-sm font-medium w-40 text-center">{monthName}</span>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="surface p-4">
        <div className="grid grid-cols-7 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-xs text-center py-2 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
            const dayPosts = postsForDay(day);
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;

            return (
              <div key={day} className="min-h-[80px] p-1.5 rounded"
                style={{
                  background: isToday ? "rgba(229,255,0,0.05)" : "transparent",
                  border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                }}>
                <span className="text-xs font-medium block mb-1"
                  style={{ color: isToday ? "var(--accent)" : "var(--muted)" }}>
                  {day}
                </span>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map((p) => (
                    <Link key={p.id} href="/queue"
                      className="block text-xs truncate px-1 py-0.5 rounded"
                      style={{ background: "var(--border)", color: "var(--foreground)" }}
                      title={p.content}>
                      {p.content.slice(0, 20)}…
                    </Link>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>+{dayPosts.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
