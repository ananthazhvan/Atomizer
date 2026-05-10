"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Settings,
  MessageSquare,
  Atom,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: Database },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/widget", label: "Chat Widget", icon: MessageSquare },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-900">
          <Atom className="size-4" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-sm tracking-tight text-zinc-100">
          Atomizer
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 transition-colors",
                  active ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-zinc-600">Phase 1 — Prototype</p>
      </div>
    </aside>
  );
}
