"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { AgentBadge } from "@/components/AgentBadge";
import { useProject } from "@/components/ProjectContext";
import { api, ConversationSummary, AnalyticsOverview } from "@/lib/api";
import { MessageSquare, Clock, CheckCircle2, Users } from "lucide-react";

const fallbackStats = {
  total_conversations: 1284,
  avg_response_time: 1.8,
  resolution_rate: 94.2,
  active_sessions: 23,
};

const fallbackConversations: ConversationSummary[] = [
  { id: "1", message: "How much does the enterprise plan cost for a team of 50?", agent_type: "SALES", confidence: 0.95, status: "Resolved", time: "2m ago" },
  { id: "2", message: "The export button isn't working in the reports section", agent_type: "SUPPORT", confidence: 0.88, status: "Pending", time: "8m ago" },
  { id: "3", message: "I was charged twice this month, need a refund immediately", agent_type: "CUSTOMER_CARE", confidence: 0.92, status: "Escalated", time: "14m ago" },
  { id: "4", message: "Do you offer custom integrations with Salesforce?", agent_type: "SALES", confidence: 0.91, status: "Resolved", time: "23m ago" },
  { id: "5", message: "My app keeps crashing when I upload large images", agent_type: "SUPPORT", confidence: 0.87, status: "Pending", time: "31m ago" },
];

const statusStyles: Record<string, string> = {
  Resolved: "text-emerald-400 bg-emerald-500/10",
  Pending: "text-amber-400 bg-amber-500/10",
  Escalated: "text-red-400 bg-red-500/10",
};

export default function DashboardPage() {
  const { projectId } = useProject();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsOverview>(fallbackStats);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [overview, convs] = await Promise.all([
        api.getOverview(projectId, "7d"),
        api.getConversations(projectId, 10),
      ]);
      setStats(overview);
      setConversations(convs);
    } catch {
      setStats(fallbackStats);
      setConversations(fallbackConversations);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your AI agent performance at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard
          label="Conversations"
          value={stats.total_conversations.toLocaleString()}
          trend="up"
          trendValue="+12.5%"
          icon={MessageSquare}
          loading={loading}
        />
        <StatCard
          label="Avg Response"
          value={`${stats.avg_response_time}s`}
          trend="down"
          trendValue="-0.3s"
          icon={Clock}
          loading={loading}
        />
        <StatCard
          label="Resolution Rate"
          value={`${stats.resolution_rate}%`}
          trend="up"
          trendValue="+2.1%"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          label="Active Now"
          value={String(stats.active_sessions)}
          trend="up"
          trendValue="+8"
          icon={Users}
          loading={loading}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Conversations
          </h2>
          <span className="text-xs text-muted-foreground">Last 30 minutes</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-muted animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800/50 mx-auto mb-3">
              <MessageSquare className="size-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No conversations yet</p>
            <p className="mt-1 text-xs text-zinc-600 max-w-[260px] mx-auto">
              Add the chat widget to your website to start receiving messages.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td colSpan={5} className="p-0">
                        <Link
                          href={`/dashboard/conversations/${row.id}`}
                          className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                          style={{ gridTemplateColumns: "1fr 100px 90px 100px 70px" }}
                        >
                          <span className="text-sm text-foreground max-w-[320px] truncate block">
                            {row.message}
                          </span>
                          <span className="block">
                            <AgentBadge type={row.agent_type} />
                          </span>
                          <span className="font-mono text-xs text-muted-foreground block">
                            {(row.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="block">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[row.status] || "text-zinc-400 bg-zinc-500/10"}`}
                            >
                              {row.status}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            {row.time}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
