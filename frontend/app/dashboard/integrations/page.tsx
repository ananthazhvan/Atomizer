"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  FileText,
  MessageSquare,
  LayoutDashboard,
  BarChart3,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Capability {
  id: string;
  name: string;
  description: string;
  status: string;
  sync_frequency?: string;
  webhook?: string;
  embed_method?: string;
}

interface SyncLog {
  id: string;
  type: string;
  status: string;
  timestamp: string;
  documents_synced?: number;
  records_imported?: number;
  templates_synced?: number;
  error?: string;
}

interface FlowZintStatus {
  status: string;
  endpoint: string;
  workspace_id: string;
  connected_since: string;
  last_sync: string;
  capabilities: Capability[];
}

const typeLabels: Record<string, string> = {
  project_vault: "Project Vault",
  client_roster: "Client Roster",
  whatsapp_template: "WhatsApp Templates",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  project_vault: FileText,
  client_roster: ArrowRightLeft,
  whatsapp_template: MessageSquare,
};

const capIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  project_vault: FileText,
  whatsapp_onboarding: MessageSquare,
  client_dashboard: LayoutDashboard,
  analytics_export: BarChart3,
};

export default function IntegrationsPage() {
  const [status, setStatus] = useState<FlowZintStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const [statusRes, logsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/integrations/flowzint/status`),
        fetch(`${BASE_URL}/api/integrations/flowzint/sync-logs?limit=10`),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            FlowZint connector and external service integrations.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Plug className="size-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">FlowZint Platform</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Purpose-built connector for the FlowZint ecosystem.
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-6 w-24 bg-muted" />
          ) : status ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                status.status === "connected"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  status.status === "connected" ? "bg-emerald-500" : "bg-red-500"
                )}
              />
              {status.status === "connected" ? "Connected" : status.status}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              <XCircle className="size-3" />
              Disconnected
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg bg-muted" />
            ))}
          </div>
        ) : status ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Workspace
              </p>
              <p className="text-sm font-mono font-medium text-foreground">
                {status.workspace_id}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Endpoint
              </p>
              <p className="text-sm font-mono font-medium text-foreground truncate">
                {status.endpoint}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Connected Since
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date(status.connected_since).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Last Sync
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date(status.last_sync).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Capabilities */}
      <div className="mb-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Integration Capabilities
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-24 rounded-xl bg-muted"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : status ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {status.capabilities.map((cap) => {
              const Icon = capIcons[cap.id] || Zap;
              return (
                <div
                  key={cap.id}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-zinc-700/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                      <Icon className="size-4 text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {cap.name}
                        </p>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                            cap.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          )}
                        >
                          {cap.status === "active" ? "Active" : "Configured"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {cap.description}
                      </p>
                      {cap.sync_frequency && (
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <Clock className="size-2.5" />
                          {cap.sync_frequency}
                        </div>
                      )}
                      {cap.webhook && (
                        <code className="mt-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
                          {cap.webhook}
                        </code>
                      )}
                      {cap.embed_method && (
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Embed: {cap.embed_method}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Sync Logs */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Sync Activity
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-12 rounded-lg bg-muted"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800/50 mx-auto mb-3">
              <RefreshCw className="size-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No sync activity</p>
            <p className="mt-1 text-xs text-zinc-600">
              Sync logs will appear here once the connector starts running.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const TypeIcon = typeIcons[log.type] || RefreshCw;
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="size-3.5 text-zinc-500" />
                            <span className="text-sm text-foreground">
                              {typeLabels[log.type] || log.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              log.status === "success"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : log.status === "partial"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                            )}
                          >
                            {log.status === "success" ? (
                              <CheckCircle2 className="size-3" />
                            ) : log.status === "partial" ? (
                              <AlertTriangle className="size-3" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-muted-foreground">
                            {log.documents_synced !== undefined &&
                              `${log.documents_synced} docs synced`}
                            {log.records_imported !== undefined &&
                              `${log.records_imported} records imported`}
                            {log.templates_synced !== undefined &&
                              `${log.templates_synced} templates synced`}
                            {log.error && (
                              <span className="text-red-400 ml-2">{log.error}</span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Architecture Note */}
      <div className="mt-8 rounded-xl border border-blue-500/10 bg-blue-500/5 p-5">
        <div className="flex items-start gap-3">
          <ExternalLink className="size-4 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-300 mb-1">
              Built for FlowZint
            </p>
            <p className="text-xs text-blue-400/70 leading-relaxed">
              Atomizer is architected to plug directly into FlowZint's Project Vault
              (document sync → knowledge base), WhatsApp onboarding pipeline (message
              routing → agents), and client dashboard (embedded chat widget). The
              connector uses FlowZint-standard authentication patterns and is ready
              for production integration when API credentials are provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
