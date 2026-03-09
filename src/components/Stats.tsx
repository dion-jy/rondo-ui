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
  const cards = [
    {
      label: "Active Jobs",
      value: `${stats.activeJobs}/${stats.totalJobs}`,
      color: "text-indigo-400",
      icon: "📋",
    },
    {
      label: "Success Rate",
      value: `${stats.successRate.toFixed(0)}%`,
      color: stats.successRate >= 80 ? "text-emerald-400" : "text-amber-400",
      icon: "✅",
    },
    {
      label: "Total Runs",
      value: String(stats.totalRuns),
      color: "text-blue-400",
      icon: "🔄",
    },
    {
      label: "Tokens Used",
      value: formatTokens(stats.totalTokens),
      color: "text-purple-400",
      icon: "🪙",
    },
    {
      label: "Running Now",
      value: String(stats.runningNow),
      color: stats.runningNow > 0 ? "text-cyan-400" : "text-gray-500",
      icon: "⚡",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card">
          <div className="flex items-center gap-2 mb-2">
            <span>{card.icon}</span>
            <span className="stat-label">{card.label}</span>
          </div>
          <div className={`stat-value ${card.color}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
