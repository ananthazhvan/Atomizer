"use client";

import { useState, useEffect } from "react";
import { useProject } from "@/components/ProjectContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface AgentToggle {
  key: string;
  label: string;
  description: string;
}

const agentToggles: AgentToggle[] = [
  { key: "sales", label: "Sales Agent", description: "Handles pricing, product questions, and purchase intent" },
  { key: "support", label: "Support Agent", description: "Technical troubleshooting and how-to guidance" },
  { key: "customer_care", label: "Customer Care Agent", description: "Complaints, refunds, billing, and account issues" },
];

export default function SettingsPage() {
  const { projectId, currentProject, loading: projectLoading } = useProject();

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [model, setModel] = useState("deepseek-chat");
  const [temperature, setTemperature] = useState("0.3");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentProject) {
      const s = currentProject.settings;
      setBusinessName((s?.business_name as string) || "");
      setIndustry((s?.industry as string) || "");
      setToggles((s?.agent_toggles as Record<string, boolean>) || { sales: true, support: true, customer_care: true });
      setModel((s?.model as string) || "deepseek-chat");
      setTemperature(String(s?.temperature ?? 0.3));
    }
  }, [currentProject]);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateProject(projectId, {
        settings: {
          business_name: businessName,
          industry,
          agent_toggles: toggles,
          model,
          temperature: parseFloat(temperature) || 0.3,
        },
      } as never);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="px-8 py-8 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-2 bg-muted" />
        <Skeleton className="h-4 w-72 mb-8 bg-muted" />
        <Skeleton className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure {currentProject?.name || "project"} settings and agent behavior.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="text-xs">
          {saving ? (
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          ) : (
            <Save className="size-3.5 mr-1.5" />
          )}
          Save
        </Button>
      </div>

      <div className="space-y-8">
        {/* Business Info */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Business Information</h3>
          <p className="text-xs text-muted-foreground mb-4">Used by agents to personalise responses.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Business Name</label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. CloudSync"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Industry</label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. SaaS, E-commerce, Fintech"
              />
            </div>
          </div>
        </section>

        {/* Agent Toggles */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Agent Routing</h3>
          <p className="text-xs text-muted-foreground mb-4">Enable or disable individual agents for this project.</p>
          <div className="space-y-3">
            {agentToggles.map((agent) => (
              <div
                key={agent.key}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="pr-4">
                  <p className="text-sm font-medium text-foreground">{agent.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                </div>
                <button
                  onClick={() => setToggles((prev) => ({ ...prev, [agent.key]: !prev[agent.key] }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    toggles[agent.key] ? "bg-blue-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 rounded-full bg-white transition-transform ${
                      toggles[agent.key] ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Model Config */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Model Configuration</h3>
          <p className="text-xs text-muted-foreground mb-4">Control the LLM parameters used by all agents.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Model</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="deepseek-chat"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Temperature</label>
              <Input
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="0.3"
              />
            </div>
          </div>
        </section>

        {/* API Info (read-only) */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Environment</h3>
          <p className="text-xs text-muted-foreground mb-4">Connection details (read-only).</p>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Anthropic API</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Routing via API key · Model: {model}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Connected
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
