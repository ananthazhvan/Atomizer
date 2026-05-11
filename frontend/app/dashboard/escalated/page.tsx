"use client";

import { useEffect, useState, useCallback } from "react";
import { AgentBadge } from "@/components/AgentBadge";
import { api, EscalatedConversation } from "@/lib/api";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

const statusStyles: Record<string, string> = {
  escalated: "text-red-400 bg-red-500/10",
  pending_human: "text-amber-400 bg-amber-500/10",
};

export default function EscalatedPage() {
  const [loading, setLoading] = useState(true);
  const [escalated, setEscalated] = useState<EscalatedConversation[]>([]);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getEscalated("demo", 20);
      setEscalated(data);
      setError("");
    } catch {
      setError("Failed to load escalated conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async (id: string) => {
    try {
      await api.updateConversationStatus(id, "resolved");
      setEscalated((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to update conversation status.");
    }
  };

  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Escalated Conversations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversations flagged for human review by the supervisor agent.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : escalated.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-3">
            <CheckCircle2 className="size-5 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-zinc-400">All clear</p>
          <p className="mt-1 text-xs text-zinc-600 max-w-[260px] mx-auto">
            No escalated conversations waiting for review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {escalated.length} conversation{escalated.length !== 1 ? "s" : ""} need
              {escalated.length === 1 ? "s" : ""} attention
            </span>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-muted transition-colors"
            >
              <RefreshCw className="size-3" />
              Refresh
            </button>
          </div>

          {escalated.map((conv) => (
            <div
              key={conv.id}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-red-500/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="size-3.5 text-red-400" />
                    <AgentBadge type={conv.agent_type} />
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[conv.status] || "text-zinc-400 bg-zinc-500/10"}`}
                    >
                      {conv.status === "pending_human" ? "Pending Human" : "Escalated"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground truncate">
                    {conv.first_message}
                  </p>
                  {conv.escalation_reason && (
                    <p className="mt-1.5 text-xs text-red-400/80 line-clamp-2">
                      Reason: {conv.escalation_reason}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Escalated{" "}
                    {new Date(conv.escalated_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => handleResolve(conv.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
                >
                  <CheckCircle2 className="size-3" />
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
