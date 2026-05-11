"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Loader2, ArrowRightLeft } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const defaultResponses: Record<string, { response: string; agent_type: string; confidence: number }> = {
  sales: {
    response:
      "Thanks for your interest! I'd be happy to tell you about our plans and help find the right fit for your needs. What specific features are you looking for?",
    agent_type: "SALES",
    confidence: 0.92,
  },
  support: {
    response:
      "I understand you're experiencing an issue. Let me help diagnose the problem. Could you tell me more about what's happening and when it started?",
    agent_type: "SUPPORT",
    confidence: 0.89,
  },
  care: {
    response:
      "I'm sorry to hear about your experience. I want to make this right for you. Let me look into this and find the best resolution for your situation.",
    agent_type: "CUSTOMER_CARE",
    confidence: 0.94,
  },
};

const greetings = ["hi", "hello", "hey", "good morning", "good afternoon"];
const salesKeywords = ["price", "plan", "cost", "buy", "purchase", "upgrade", "demo", "trial", "feature", "enterprise"];
const supportKeywords = ["crash", "error", "bug", "broken", "not working", "help", "issue", "problem", "fail"];
const careKeywords = ["refund", "charge", "billing", "cancel", "complaint", "angry", "money back", "charged"];

function simulateResponse(message: string) {
  const msg = message.toLowerCase();

  if (greetings.some((g) => msg.includes(g))) {
    return {
      response: "Hello! How can I help you today? I'm here to assist with any questions about our products, support issues, or account matters.",
      agent_type: "GENERAL",
      confidence: 0.98,
    };
  }
  if (careKeywords.some((k) => msg.includes(k))) return defaultResponses.care;
  if (supportKeywords.some((k) => msg.includes(k))) return defaultResponses.support;
  if (salesKeywords.some((k) => msg.includes(k))) return defaultResponses.sales;

  return defaultResponses.sales;
}

const agentLabels: Record<string, string> = {
  SALES: "Sales Agent",
  SUPPORT: "Support Agent",
  CUSTOMER_CARE: "Customer Care Agent",
  GENERAL: "Assistant",
};

const agentColors: Record<string, string> = {
  SALES: "text-blue-400",
  SUPPORT: "text-emerald-400",
  CUSTOMER_CARE: "text-amber-400",
  GENERAL: "text-zinc-400",
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentType?: string;
  confidence?: number;
  handoffFrom?: string;
  handoffTo?: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingAgent, setStreamingAgent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sessionId = useRef(
    typeof window !== "undefined"
      ? localStorage.getItem("atomizer_session") || crypto.randomUUID()
      : ""
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("atomizer_session", sessionId.current);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    // Try streaming first, fall back to non-streaming
    try {
      let agentType = "";
      let confidence = 0;
      const assistantId = crypto.randomUUID();
      let streamedContent = "";
      let agentReceived = false;

      abortRef.current = api.chatStream(
        "demo",
        text,
        sessionId.current,
        // onAgent
        (type, conf) => {
          agentType = type;
          confidence = conf;
          setStreamingAgent(type);
          if (!agentReceived) {
            setMessages((p) => [
              ...p,
              {
                id: assistantId,
                role: "assistant",
                content: "",
                agentType: type,
                confidence: conf,
              },
            ]);
            agentReceived = true;
          }
        },
        // onChunk
        (chunkText) => {
          streamedContent += chunkText;
          setMessages((p) =>
            p.map((m) =>
              m.id === assistantId
                ? { ...m, content: streamedContent }
                : m
            )
          );
        },
        // onDone
        (conf, status) => {
          setStreamingAgent(null);
          setMessages((p) =>
            p.map((m) =>
              m.id === assistantId
                ? { ...m, content: streamedContent, confidence: conf }
                : m
            )
          );
        },
        // onError
        () => {
          setStreamingAgent(null);
          // Fallback handled by catch
        }
      );
    } catch {
      // Fall back to non-streaming
      try {
        const data = await api.chat("demo", text, sessionId.current);
        setMessages((p) => [
          ...p,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.response,
            agentType: data.agent_type,
            confidence: data.confidence,
            handoffFrom: data.handoff_from ?? undefined,
            handoffTo: data.handoff_to ?? undefined,
          },
        ]);
      } catch {
        const fallback = simulateResponse(text);
        setMessages((p) => [
          ...p,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fallback.response,
            agentType: fallback.agent_type,
            confidence: fallback.confidence,
          },
        ]);
        toast.error("Backend unavailable. Using offline responses.");
      }
    } finally {
      setLoading(false);
      setStreamingAgent(null);
    }
  }, [input, loading]);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700/50 text-zinc-300 shadow-2xl transition-all hover:scale-105 hover:border-zinc-600 hover:text-white hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
        >
          <MessageSquare className="size-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex w-[400px] h-[580px] flex-col rounded-2xl border border-zinc-800 bg-[#0d0d10] shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/50 px-4 py-3 bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <MessageSquare className="size-4" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Atomizer AI</p>
                <div className="flex items-center gap-1.5">
                  {streamingAgent ? (
                    <>
                      <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className={cn("text-[10px]", agentColors[streamingAgent] || "text-zinc-400")}>
                        {agentLabels[streamingAgent] || streamingAgent} is typing...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-zinc-500">Online</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/10 mb-4">
                  <MessageSquare className="size-6 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-300 mb-1">How can we help?</p>
                <p className="text-xs text-zinc-600 max-w-[260px]">
                  Ask about pricing, get support, or resolve account issues — our AI agents are ready.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                agentType={m.agentType}
                confidence={m.confidence}
                handoffFrom={m.handoffFrom}
                handoffTo={m.handoffTo}
                isStreaming={!!streamingAgent && m.role === "assistant" && m === messages[messages.length - 1]}
              />
            ))}
            {loading && !streamingAgent && (
              <div className="flex items-center gap-3 pl-2 animate-fade-in">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
                  <Loader2 className="size-3.5 text-zinc-400 animate-spin" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">Thinking</span>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-1 rounded-full bg-zinc-600 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800/50 p-3 bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-500/80 focus:ring-1 focus:ring-zinc-500/30 transition-all"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl transition-all shrink-0",
                  input.trim() && !loading
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
