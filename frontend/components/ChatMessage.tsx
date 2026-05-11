import { AgentBadge } from "@/components/AgentBadge";
import { cn } from "@/lib/utils";
import { Bot, User, ArrowRightLeft, Smile, Meh, Frown, AlertTriangle } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  agentType?: string;
  confidence?: number;
  handoffFrom?: string;
  handoffTo?: string;
  sentiment?: string;
  satisfaction?: number;
  isStreaming?: boolean;
}

const sentimentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  positive: Smile,
  neutral: Meh,
  negative: Frown,
  frustrated: AlertTriangle,
};

const sentimentColors: Record<string, string> = {
  positive: "text-emerald-400",
  neutral: "text-zinc-500",
  negative: "text-amber-400",
  frustrated: "text-red-400",
};

const agentBorderColors: Record<string, string> = {
  SALES: "border-l-blue-500/30",
  SUPPORT: "border-l-emerald-500/30",
  CUSTOMER_CARE: "border-l-amber-500/30",
  GENERAL: "border-l-zinc-600/30",
};

const agentBgColors: Record<string, string> = {
  SALES: "bg-blue-500/5",
  SUPPORT: "bg-emerald-500/5",
  CUSTOMER_CARE: "bg-amber-500/5",
  GENERAL: "bg-zinc-800/30",
};

export function ChatMessage({
  role,
  content,
  agentType,
  confidence,
  handoffFrom,
  handoffTo,
  sentiment,
  satisfaction,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";
  const SentimentIcon = sentiment ? sentimentIcons[sentiment] : null;

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5",
          isUser
            ? "bg-blue-600 text-white"
            : agentType
              ? cn(
                  "border",
                  agentType === "SALES" && "border-blue-500/30 bg-blue-500/10 text-blue-400",
                  agentType === "SUPPORT" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                  agentType === "CUSTOMER_CARE" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
                  agentType === "GENERAL" && "border-zinc-600/30 bg-zinc-800 text-zinc-400"
                )
              : "bg-zinc-800 border border-zinc-700 text-zinc-400"
        )}
      >
        {isUser ? (
          <User className="size-3.5" />
        ) : (
          <Bot className="size-3.5" />
        )}
      </div>

      {/* Content */}
      <div className={cn("space-y-1.5 max-w-[82%]", isUser && "items-end")}>
        {/* Handoff indicator */}
        {handoffFrom && handoffTo && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/30 text-[10px] text-zinc-400">
            <ArrowRightLeft className="size-2.5" />
            <span>Transferred from</span>
            <AgentBadge type={handoffFrom} className="text-[9px] px-1.5 py-0" />
            <span>to</span>
            <AgentBadge type={handoffTo} className="text-[9px] px-1.5 py-0" />
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed border-l-2",
            isUser
              ? "bg-blue-600 text-white rounded-tr-md border-l-transparent"
              : cn(
                  "border border-zinc-700/40 rounded-tl-md text-zinc-200",
                  agentType ? agentBgColors[agentType] || "bg-zinc-800/40" : "bg-zinc-800/40",
                  agentType ? agentBorderColors[agentType] || "border-l-zinc-600/30" : "border-l-zinc-600/30"
                )
          )}
        >
          {content || (isStreaming ? (
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <span className="inline-block w-1.5 h-4 bg-zinc-500 rounded-full animate-pulse" />
            </span>
          ) : null)}
          {isStreaming && content && (
            <span className="inline-block w-1.5 h-4 bg-zinc-400 rounded-full animate-pulse ml-0.5 align-middle" />
          )}
        </div>

        {/* Meta: agent badge + confidence */}
        {!isUser && agentType && (
          <div className="flex items-center gap-2.5 pl-0.5">
            <AgentBadge type={agentType} />
            {confidence !== undefined && (
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      confidence >= 0.9 ? "bg-emerald-500" :
                      confidence >= 0.7 ? "bg-blue-500" :
                      confidence >= 0.5 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sentiment indicator on user messages */}
        {isUser && SentimentIcon && (
          <div className="flex items-center gap-1.5 justify-end pr-0.5">
            <SentimentIcon className={cn("size-3", sentimentColors[sentiment || "neutral"] || "text-zinc-500")} />
            <span className={cn("text-[10px] capitalize", sentimentColors[sentiment || "neutral"] || "text-zinc-500")}>
              {sentiment}
              {satisfaction !== undefined && ` · ${(satisfaction * 100).toFixed(0)}%`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
