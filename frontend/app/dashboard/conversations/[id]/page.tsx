"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ConversationDetail } from "@/lib/api";
import { AgentBadge } from "@/components/AgentBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, User, CheckCircle2, AlertTriangle, Clock, Smile, Meh, Frown, AlertTriangle as Frustrated } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const sentimentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  positive: Smile,
  neutral: Meh,
  negative: Frown,
  frustrated: Frustrated,
};

const sentimentColors: Record<string, string> = {
  positive: "text-emerald-400",
  neutral: "text-zinc-500",
  negative: "text-amber-400",
  frustrated: "text-red-400",
};

const statusStyles: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "text-blue-400 bg-blue-500/10" },
  resolved: { label: "Resolved", className: "text-emerald-400 bg-emerald-500/10" },
  escalated: { label: "Escalated", className: "text-red-400 bg-red-500/10" },
  pending_human: { label: "Pending Human", className: "text-amber-400 bg-amber-500/10" },
};

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getConversation(id);
        setConversation(data);
      } catch {
        toast.error("Failed to load conversation");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.updateConversationStatus(id, status);
      setConversation((prev) => prev ? { ...prev, status } : prev);
      toast.success(`Conversation marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6 bg-muted" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-muted" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="px-8 py-8 max-w-4xl">
        <p className="text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  const status = conversation.status;
  const statusInfo = statusStyles[status] || statusStyles.active;

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Conversation
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{id}</p>
        </div>
        <div className="flex items-center gap-2">
          {status !== "resolved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("resolved")}
              disabled={updating}
              className="text-xs h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <CheckCircle2 className="size-3 mr-1.5" />
              Resolve
            </Button>
          )}
          {status !== "escalated" && status !== "pending_human" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("escalated")}
              disabled={updating}
              className="text-xs h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <AlertTriangle className="size-3 mr-1.5" />
              Escalate
            </Button>
          )}
        </div>
      </div>

      {/* Status banner */}
      <div className={cn("rounded-lg px-4 py-2.5 mb-6 flex items-center gap-2.5 text-xs font-medium", statusInfo.className)}>
        <span className={cn("size-2 rounded-full", status === "active" ? "bg-blue-500" : status === "resolved" ? "bg-emerald-500" : status === "escalated" ? "bg-red-500" : "bg-amber-500")} />
        {statusInfo.label}
        {conversation.escalation_reason && (
          <span className="text-zinc-400 ml-2">— {conversation.escalation_reason}</span>
        )}
        <span className="ml-auto text-zinc-600">
          {new Date(conversation.created_at).toLocaleString()}
        </span>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {conversation.messages.map((msg) => {
          const isUser = msg.role === "user";
          const SentimentIcon = msg.sentiment ? sentimentIcons[msg.sentiment] : null;

          return (
            <div
              key={msg.id}
              className={cn("flex gap-3", isUser && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5",
                  isUser
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-700/50 bg-zinc-800 text-zinc-400"
                )}
              >
                {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              </div>

              <div className={cn("space-y-1.5 max-w-[75%]", isUser && "items-end")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed border-l-2",
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-md border-l-transparent"
                      : "bg-card border border-border rounded-tl-md text-zinc-200"
                  )}
                >
                  {msg.content}
                </div>

                {/* Meta */}
                <div className={cn("flex items-center gap-2.5", isUser ? "justify-end pr-1" : "pl-0.5")}>
                  {!isUser && msg.agent_type && (
                    <AgentBadge type={msg.agent_type} />
                  )}
                  {!isUser && msg.confidence !== null && msg.confidence !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            msg.confidence >= 0.9 ? "bg-emerald-500" :
                            msg.confidence >= 0.7 ? "bg-blue-500" :
                            msg.confidence >= 0.5 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${msg.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {(msg.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {isUser && SentimentIcon && (
                    <div className="flex items-center gap-1">
                      <SentimentIcon className={cn("size-3", sentimentColors[msg.sentiment || "neutral"])} />
                      <span className={cn("text-[10px] capitalize", sentimentColors[msg.sentiment || "neutral"])}>
                        {msg.sentiment}
                        {msg.satisfaction !== null && msg.satisfaction !== undefined && ` · ${(msg.satisfaction * 100).toFixed(0)}%`}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] text-zinc-700 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
