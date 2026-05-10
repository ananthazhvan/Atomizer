import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: React.ElementType;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  trend = "neutral",
  trendValue,
  icon: Icon,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-3 w-20 bg-muted" />
        <Skeleton className="h-8 w-16 bg-muted" />
        <Skeleton className="h-3 w-24 bg-muted" />
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-zinc-700/50 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-muted-foreground group-hover:text-zinc-400 transition-colors" />
      </div>
      <div className="font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      {trendValue && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {trend === "up" ? (
            <TrendingUp className="size-3 text-emerald-500" />
          ) : trend === "down" ? (
            <TrendingDown className="size-3 text-red-500" />
          ) : (
            <Minus className="size-3 text-zinc-500" />
          )}
          <span
            className={cn(
              "font-medium",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-zinc-500"
            )}
          >
            {trendValue}
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  );
}
