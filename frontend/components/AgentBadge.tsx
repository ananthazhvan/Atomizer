import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  SALES: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SUPPORT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CUSTOMER_CARE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  GENERAL: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function AgentBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variants[type] || variants.GENERAL,
        className
      )}
    >
      {type.replace("_", " ")}
    </span>
  );
}
