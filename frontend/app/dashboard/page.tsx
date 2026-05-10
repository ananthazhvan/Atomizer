"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { AgentBadge } from "@/components/AgentBadge";
import { api } from "@/lib/api";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Users,
} from "lucide-react";

interface ConversationRow {
  id: string;
  message: string;
  agent_type: string;
  confidence: number;
  status: string;
  time: string;
}

const mockConversations: ConversationRow[] = [
  {
    id: "1",
    message: "How much does the enterprise plan cost for a team of 50?",
    agent_type: "SALES",
    confidence: 0.95,
    status: "Resolved",
    time: "2m ago",
  },
  {
    id: "2",
    message: "The export button isn't working in the reports section",
    agent_type: "SUPPORT",
    confidence: 0.88,
    status: "Pending",
    time: "8m ago",
  },
  {
    id: "3",
    message: "I was charged twice this month, need a refund immediately",
    agent_type: "CUSTOMER_CARE",
    confidence: 0.92,
    status: "Escalated",
    time: "14m ago",
  },
  {
    id: "4",
    message: "Do you offer custom integrations with Salesforce?",
    agent_type: "SALES",
    confidence: 0.91,
    status: "Resolved",
    time: "23m ago",
  },
  {
    id: "5",
    message: "My app keeps crashing when I upload large images",
    agent_type: "SUPPORT",
    confidence: 0.87,
    status: "Pending",
    time: "31m ago",
  },
];

const statusStyles: Record<string, string> = {
  Resolved: "text-emerald-400 bg-emerald-500/10",
  Pending: "text-amber-400 bg-amber-500/10",
  Escalated: "text-red-400 bg-red-500/10",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
          value="1,284"
          trend="up"
          trendValue="+12.5%"
          icon={MessageSquare}
          loading={loading}
        />
        <StatCard
          label="Avg Response"
          value="1.8s"
          trend="down"
          trendValue="-0.3s"
          icon={Clock}
          loading={loading}
        />
        <StatCard
          label="Resolution Rate"
          value="94.2%"
          trend="up"
          trendValue="+2.1%"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          label="Active Now"
          value="23"
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
                  {mockConversations.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-foreground max-w-[320px] truncate">
                        {row.message}
                      </td>
                      <td className="px-5 py-3">
                        <AgentBadge type={row.agent_type} />
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {(row.confidence * 100).toFixed(0)}%
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[row.status] || "text-zinc-400 bg-zinc-500/10"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {row.time}
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
