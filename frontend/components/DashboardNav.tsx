"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Settings,
  MessageSquare,
  AlertTriangle,
  Atom,
  ChevronDown,
  Folder,
  Plus,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/ProjectContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/escalated", label: "Escalated", icon: AlertTriangle },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: Database },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/widget", label: "Chat Widget", icon: MessageSquare },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { projectId, setProjectId, projects, currentProject, loading, refreshProjects } = useProject();
  const [projectOpen, setProjectOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const project = await api.createProject({ name: newName.trim(), description: newDesc.trim() });
      await refreshProjects();
      setProjectId(project.id);
      setNewProjectOpen(false);
      setNewName("");
      setNewDesc("");
      toast.success(`Project "${project.name}" created`);
    } catch {
      toast.error("Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="fixed top-0 left-0 z-40 flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-900">
            <Atom className="size-4" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">
            Atomizer
          </span>
        </Link>
      </div>

      {/* Project Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <button
          onClick={() => setProjectOpen(!projectOpen)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-sidebar-accent/60 transition-colors"
        >
          <Folder className="size-3.5 text-zinc-500 shrink-0" />
          <span className="truncate text-xs flex-1 text-left">
            {loading ? "Loading..." : currentProject?.name || "Select Project"}
          </span>
          <ChevronDown className={cn("size-3 text-zinc-500 transition-transform", projectOpen && "rotate-180")} />
        </button>
        {projectOpen && (
          <div className="mt-1 space-y-0.5">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => { setProjectId(p.id); setProjectOpen(false); }}
                className={cn(
                  "w-full text-left px-2 py-1 rounded text-xs transition-colors truncate",
                  p.id === projectId
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-sidebar-accent/40"
                )}
              >
                {p.name}
              </button>
            ))}
            <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
              <DialogTrigger>
                <button className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-600 hover:text-zinc-300 hover:bg-sidebar-accent/40 transition-colors">
                  <Plus className="size-3" />
                  New project
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Project name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createProject(); }}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") createProject(); }}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={createProject}
                    disabled={!newName.trim() || creating}
                    className="text-xs"
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
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
        <p className="text-xs text-zinc-600">Phase 2 — Platform</p>
      </div>
    </aside>
  );
}
