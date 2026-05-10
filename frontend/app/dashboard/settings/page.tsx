export default function SettingsPage() {
  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your agents and project settings.
        </p>
      </div>

      <div className="space-y-8">
        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Agent Configuration
          </h3>
          <div className="space-y-4">
            {[
              { name: "Sales Agent", model: "deepseek-v4-flash", temp: "0.3" },
              { name: "Support Agent", model: "deepseek-v4-flash", temp: "0.3" },
              { name: "Customer Care Agent", model: "deepseek-v4-flash", temp: "0.3" },
            ].map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Model: {agent.model} · Temperature: {agent.temp}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Active
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            API Connection
          </h3>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Anthropic API
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Routing through DeepSeek · https://api.deepseek.com/anthropic
                </p>
              </div>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
