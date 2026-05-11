"use client";

import { ChatWidget } from "@/components/ChatWidget";
import { ProjectProvider } from "@/components/ProjectContext";

export default function WidgetDemoPage() {
  return (
    <ProjectProvider>
    <div className="min-h-screen bg-[#0a0a0c]">
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      <header className="relative z-10 border-b border-zinc-800/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-900">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <span className="font-semibold text-base tracking-tight text-zinc-100">
              CloudSync
            </span>
          </div>
          <nav className="ml-auto flex items-center gap-6">
            {["Product", "Pricing", "Docs", "Contact"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {item}
              </a>
            ))}
            <a
              href="#"
              className="inline-flex items-center rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-20">
        <section className="mb-20">
          <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-tight text-zinc-100">
            Cloud infrastructure that{" "}
            <span className="text-blue-500">scales with you</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-400">
            Deploy, manage, and scale your applications across any cloud provider
            with a single unified platform.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <a
              href="#"
              className="inline-flex items-center rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="#"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              View documentation →
            </a>
          </div>
        </section>

        <section className="mb-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Auto-scaling",
              desc: "Infrastructure that automatically adjusts to traffic demands in real-time.",
              price: "From $29/mo",
            },
            {
              title: "Multi-cloud",
              desc: "Deploy across AWS, GCP, and Azure with a single configuration.",
              price: "From $59/mo",
            },
            {
              title: "Enterprise",
              desc: "Dedicated infrastructure with SLA, SSO, and 24/7 priority support.",
              price: "From $99/mo",
            },
          ].map((plan) => (
            <div
              key={plan.title}
              className="rounded-xl border border-zinc-800/50 bg-[#0d0d10] p-6 transition-all hover:border-zinc-700/50"
            >
              <h3 className="text-sm font-semibold text-zinc-200 mb-2">
                {plan.title}
              </h3>
              <p className="text-sm text-zinc-500 mb-4">{plan.desc}</p>
              <p className="text-lg font-semibold text-zinc-100">{plan.price}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800/50 bg-[#0d0d10] p-10 text-center">
          <h3 className="text-xl font-semibold text-zinc-200 mb-2">
            Ready to get started?
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            Join thousands of teams already using CloudSync.
          </p>
          <a
            href="#"
            className="inline-flex items-center rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            Contact Sales
          </a>
        </section>
      </main>

      <footer className="relative z-10 border-t border-zinc-800/50 py-8 text-center">
        <p className="text-xs text-zinc-600">© 2026 CloudSync. All rights reserved.</p>
      </footer>

      <ChatWidget />
    </div>
    </ProjectProvider>
  );
}
