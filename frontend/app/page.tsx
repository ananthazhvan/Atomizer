"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Atom, MessageSquare, BarChart3, Database, Zap } from "lucide-react";

const fadeIn = "animate-fade-in";

export default function LandingPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      <header className="relative z-10 border-b border-zinc-800/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-900">
              <Atom className="size-4" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-base tracking-tight text-zinc-100">
              Atomizer
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/widget"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-200"
            >
              Dashboard
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pt-28 pb-20">
        <div className={visible ? fadeIn : "opacity-0"}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-700/50 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400">
            <Zap className="size-3 text-amber-500" />
            Powered by AI Agents
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-zinc-100 sm:text-6xl">
            Every customer message,{" "}
            <span className="text-blue-500">intelligently routed</span> to the right
            AI agent.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Atomizer classifies incoming messages and routes them to specialized AI
            agents — Sales, Support, and Customer Care — each backed by your
            knowledge base. One platform, zero confusion.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/widget"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-200"
            >
              Try the Demo
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700/50 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:text-zinc-100"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: MessageSquare,
              title: "Smart Routing",
              desc: "Messages classified by intent — sales, support, or customer care — and routed to the right specialist agent.",
            },
            {
              icon: Database,
              title: "Knowledge Base",
              desc: "Upload documents and your agents reference them automatically for accurate, context-aware responses.",
            },
            {
              icon: BarChart3,
              title: "Actionable Analytics",
              desc: "Track conversation volume, agent performance, and resolution rates from a real-time dashboard.",
            },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800/50 bg-[#0d0d10] p-6 transition-all hover:border-zinc-700/50 hover:shadow-[0_0_25px_-8px_rgba(255,255,255,0.03)]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-zinc-800/50">
                <Icon className="size-5 text-zinc-300" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-200">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-zinc-800/50 py-8 text-center">
        <p className="text-xs text-zinc-600">Atomizer — Phase 1 Prototype</p>
      </footer>
    </div>
  );
}
