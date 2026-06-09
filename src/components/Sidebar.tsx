"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PenSquare,
  Calendar,
  Inbox,
  BarChart2,
  Clock,
  FileText,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/profiles", icon: Users, label: "Profiles" },
  { href: "/compose", icon: PenSquare, label: "Compose" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/queue", icon: Clock, label: "Queue" },
  { href: "/inbox", icon: Inbox, label: "Inbox" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/templates", icon: FileText, label: "Templates" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <Zap size={18} style={{ color: "var(--accent)" }} />
        <span className="font-bold text-sm tracking-wide">RUINED YOUTH</span>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors",
                active
                  ? "font-medium"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              style={active ? { color: "var(--accent)" } : {}}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t text-xs text-[var(--muted)]" style={{ borderColor: "var(--border)" }}>
        HQ Dashboard
      </div>
    </aside>
  );
}
