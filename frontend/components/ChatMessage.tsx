import { AgentBadge } from "@/components/AgentBadge";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  agentType?: string;
  confidence?: number;
}

export function ChatMessage({ role, content, agentType, confidence }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-blue-600" : "bg-zinc-800 border border-zinc-700"
        )}
      >
        {isUser ? (
          <User className="size-3.5 text-white" />
        ) : (
          <Bot className="size-3.5 text-zinc-300" />
        )}
      </div>

      <div className={cn("space-y-1.5 max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 rounded-tl-sm"
          )}
        >
          {content}
        </div>
        {!isUser && agentType && (
          <div className="flex items-center gap-2">
            <AgentBadge type={agentType} />
            {confidence !== undefined && (
              <span className="text-[10px] text-zinc-600 font-mono">
                {(confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
