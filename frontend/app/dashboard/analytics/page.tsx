"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AgentBadge } from "@/components/AgentBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { api, AgentBreakdown } from "@/lib/api";

const fallbackDaily = [
  { day: "Mon", conversations: 145 },
  { day: "Tue", conversations: 198 },
  { day: "Wed", conversations: 172 },
  { day: "Thu", conversations: 215 },
  { day: "Fri", conversations: 189 },
  { day: "Sat", conversations: 98 },
  { day: "Sun", conversations: 67 },
];

const fallbackPie = [
  { name: "Sales", value: 480, color: "#3b82f6" },
  { name: "Support", value: 385, color: "#10b981" },
  { name: "Customer Care", value: 220, color: "#f59e0b" },
  { name: "General", value: 199, color: "#71717a" },
];

const fallbackBreakdown: AgentBreakdown[] = [
  { agent_type: "SALES", count: 480, avg_confidence: 0.93, resolution_rate: 91 },
  { agent_type: "SUPPORT", count: 385, avg_confidence: 0.87, resolution_rate: 84 },
  { agent_type: "CUSTOMER_CARE", count: 220, avg_confidence: 0.9, resolution_rate: 78 },
  { agent_type: "GENERAL", count: 199, avg_confidence: 0.96, resolution_rate: 99 },
];

const AGENT_COLORS: Record<string, string> = {
  SALES: "#3b82f6",
  SUPPORT: "#10b981",
  CUSTOMER_CARE: "#f59e0b",
  GENERAL: "#71717a",
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [breakdown, setBreakdown] = useState<AgentBreakdown[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAgentBreakdown("demo", period);
      setBreakdown(data);
    } catch {
      setBreakdown(fallbackBreakdown);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pieData = breakdown.map((b) => ({
    name: b.agent_type === "CUSTOMER_CARE" ? "Customer Care" : b.agent_type.charAt(0) + b.agent_type.slice(1).toLowerCase(),
    value: b.count,
    color: AGENT_COLORS[b.agent_type] || "#71717a",
  }));

  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversation trends and agent performance.
          </p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="7d" className="text-xs">
              7 days
            </TabsTrigger>
            <TabsTrigger value="30d" className="text-xs">
              30 days
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-10">
        {loading ? (
          <>
            <Skeleton className="h-80 rounded-xl bg-muted" />
            <Skeleton className="h-80 rounded-xl bg-muted" />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Conversations Over Time
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fallbackDaily}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="#71717a"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#e4e4e7",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="conversations"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Distribution by Agent
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.length > 0 ? pieData : fallbackPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(pieData.length > 0 ? pieData : fallbackPie).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#e4e4e7",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                {(pieData.length > 0 ? pieData : fallbackPie).map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Agent Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resolution Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {[...Array(4)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <Skeleton className="h-4 w-20 bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                : breakdown.length === 0
                ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-sm text-muted-foreground">No agent activity for this period.</p>
                      </td>
                    </tr>
                  )
                : breakdown.map((agent) => (
                    <tr
                      key={agent.agent_type}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <AgentBadge type={agent.agent_type} />
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-foreground">
                        {agent.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-foreground">
                        {(agent.avg_confidence * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-foreground">
                        {agent.resolution_rate.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
