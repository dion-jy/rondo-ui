import type { CronStats } from "../hooks/useSupabase";

interface StatsProps {
  stats: CronStats;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function Stats({ stats }: StatsProps) {
  const items: { label: string; value: string; color?: string; muted?: boolean }[] = [
    { label: "Active", value: `${stats.activeJobs}/${stats.totalJobs}`, color: "text-emerald-400" },
    { label: "Success", value: `${stats.successRate.toFixed(0)}%`, color: stats.successRate >= 90 ? "text-emerald-400" : stats.successRate >= 70 ? "text-accent-brass" : "text-rose-400" },
    { label: "Running", value: String(stats.runningNow), color: stats.runningNow > 0 ? "text-cyan-400" : "text-gray-500" },
    { label: "Runs", value: String(stats.totalRuns), muted: true },
    { label: "Tokens", value: formatTokens(stats.totalTokens), muted: true },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((it) => (
        <div
          key={it.label}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
            it.muted
              ? "text-gray-600"
              : "bg-surface-card/40 border border-border"
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider text-gray-600">{it.label}</span>
          <span className={`font-semibold tabular-nums ${it.muted ? "text-gray-500" : it.color ?? "text-gray-200"}`}>
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}
