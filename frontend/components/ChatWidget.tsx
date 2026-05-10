"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { api, ChatResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const defaultResponses: Record<string, ChatResponse> = {
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

function simulateResponse(message: string): ChatResponse {
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentType?: string;
  confidence?: number;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    } finally {
      setLoading(false);
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
        <div className="fixed bottom-5 right-5 z-50 flex w-[380px] h-[540px] flex-col rounded-2xl border border-zinc-800 bg-[#0d0d10] shadow-2xl overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-900">
                <MessageSquare className="size-3.5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Atomizer AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-500">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800/50 mb-3">
                  <MessageSquare className="size-5 text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-zinc-400 mb-1">How can we help?</p>
                <p className="text-xs text-zinc-600 max-w-[240px]">
                  Ask about pricing, get support, or resolve account issues.
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
              />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-zinc-500 pl-10">
                <Loader2 className="size-3.5 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-3">
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
                className="flex-1 rounded-lg border border-zinc-700/50 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition-all",
                  input.trim() && !loading
                    ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
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
