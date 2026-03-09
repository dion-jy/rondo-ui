import { useState } from "react";
import type { CronRun, CronJob } from "../types";

interface ExecutionLogProps {
  runs: CronRun[];
  jobs: CronJob[];
  selectedJobId: string | null;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString();
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTokens(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type Filter = "all" | "ok" | "error";

export function ExecutionLog({ runs, jobs, selectedJobId }: ExecutionLogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = runs
    .filter((r) => !selectedJobId || r.job_id === selectedJobId)
    .filter((r) => filter === "all" || r.status === filter);

  const jobNameMap = new Map(jobs.map((j) => [j.id, j.name]));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">📜 Execution Log</h2>
        <div className="flex gap-1">
          {(["all", "ok", "error"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                filter === f
                  ? "bg-accent text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "All" : f === "ok" ? "✓ Success" : "✗ Error"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No runs to display</div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {filtered.map((run) => (
            <div key={run.id}>
              <button
                onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      run.status === "ok" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <span className="text-gray-300 truncate flex-1">
                    {jobNameMap.get(run.job_id) ?? run.job_id.slice(0, 8)}
                  </span>
                  <span className="text-gray-500 text-xs">{formatDuration(run.duration_ms)}</span>
                  {run.model && (
                    <span className="text-gray-600 text-xs">{run.model}</span>
                  )}
                  <span className="text-gray-600 text-xs whitespace-nowrap">
                    {formatTime(run.timestamp)}
                  </span>
                  {run.total_tokens != null && (
                    <span className="text-purple-400/60 text-xs">
                      {formatTokens(run.total_tokens)} tok
                    </span>
                  )}
                </div>
              </button>

              {expandedId === run.id && (
                <div className="mx-3 mb-2 p-3 bg-gray-900/50 rounded-lg text-xs space-y-2">
                  {run.summary && (
                    <div>
                      <span className="text-gray-500">Summary: </span>
                      <span className="text-gray-300 whitespace-pre-wrap">
                        {run.summary.length > 500
                          ? run.summary.slice(0, 500) + "…"
                          : run.summary}
                      </span>
                    </div>
                  )}
                  {run.error && (
                    <div className="text-red-300">
                      <span className="text-gray-500">Error: </span>
                      {run.error}
                    </div>
                  )}
                  <div className="flex gap-4 text-gray-600">
                    <span>Provider: {run.provider ?? "—"}</span>
                    <span>
                      Tokens: {formatTokens(run.input_tokens)} in / {formatTokens(run.output_tokens)} out
                    </span>
                    <span>Delivered: {run.delivered != null ? (run.delivered ? "✓" : "✗") : "—"}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
