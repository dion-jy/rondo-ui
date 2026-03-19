import { useMemo, useState } from "react";
import type { CronRun, CronJob, ACPSession } from "../types";

interface ExecutionLogProps {
  runs: CronRun[];
  jobs: CronJob[];
  sessions: ACPSession[];
  selectedJobId: string | null;
}

type LogEntry =
  | { kind: "cron"; run: CronRun; timestamp: number }
  | { kind: "acp"; session: ACPSession; timestamp: number };

function formatDuration(ms: number | null): string {
  if (ms == null) return "\u2014";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function formatTime(epochOrStr: string | number): string {
  const d = typeof epochOrStr === "number" ? new Date(epochOrStr) : new Date(epochOrStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTokens(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type Filter = "all" | "ok" | "error";

export function ExecutionLog({ runs, jobs, sessions, selectedJobId }: ExecutionLogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const jobNameMap = useMemo(() => new Map(jobs.map((j) => [j.id, j.name])), [jobs]);

  // Merge cron runs and completed ACP sessions into a unified log
  const entries: LogEntry[] = useMemo(() => {
    const cronEntries: LogEntry[] = runs
      .filter((r) => !selectedJobId || r.job_id === selectedJobId)
      .filter((r) => filter === "all" || r.status === filter)
      .map((r) => ({ kind: "cron" as const, run: r, timestamp: new Date(r.timestamp).getTime() }));

    // Only include completed (done/error) sessions — active ones are in the ACP panel
    const sessionEntries: LogEntry[] = (!selectedJobId ? sessions : [])
      .filter((s) => s.status === "done" || s.status === "error")
      .filter((s) => {
        if (filter === "ok") return s.status === "done";
        if (filter === "error") return s.status === "error";
        return true;
      })
      .map((s) => ({ kind: "acp" as const, session: s, timestamp: s.updatedAt ?? s.startedAt ?? 0 }));

    return [...cronEntries, ...sessionEntries].sort((a, b) => b.timestamp - a.timestamp);
  }, [runs, sessions, selectedJobId, filter]);

  const errorCount = runs.filter((r) => r.status === "error").length
    + sessions.filter((s) => s.status === "error").length;
  const successCount = runs.filter((r) => r.status === "ok").length
    + sessions.filter((s) => s.status === "done").length;

  return (
    <div>
      {/* Header with filter tabs and counts */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Execution Log</h2>
          <span className="text-[10px] text-gray-600 tabular-nums">{entries.length} entries</span>
        </div>
        <div className="flex gap-0.5 rounded-lg border border-border bg-surface-card/60 p-0.5">
          {([
            { key: "all" as Filter, label: "All" },
            { key: "ok" as Filter, label: "Success", count: successCount },
            { key: "error" as Filter, label: "Error", count: errorCount },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                filter === f.key
                  ? "tab-active"
                  : "text-gray-500 hover:text-gray-300 hover:bg-surface-hover"
              }`}
            >
              {f.label}
              {f.count != null && f.count > 0 && (
                <span className={`text-[9px] rounded-full px-1.5 py-px ${
                  filter === f.key ? "bg-accent/20 text-accent" : "bg-surface-raised text-gray-600"
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-gray-600 py-12 text-sm">
          <p>No entries to display</p>
          <p className="text-[10px] text-gray-700 mt-1">
            {filter !== "all" ? "Try switching to \"All\" filter" : "Runs and sessions will appear after the first execution"}
          </p>
        </div>
      ) : (
        <div className="space-y-px max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface-card/30">
          {entries.map((entry, i) => {
            if (entry.kind === "cron") {
              const run = entry.run;
              const isExpanded = expandedId === run.id;
              return (
                <div key={run.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : run.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isExpanded ? "bg-surface-hover" : i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    } hover:bg-surface-hover`}
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      {/* Status indicator */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          run.status === "ok" ? "bg-success" : run.status === "running" ? "bg-info animate-pulse" : "bg-error"
                        }`}
                      />
                      {/* Job name */}
                      <span className="text-gray-200 truncate font-medium min-w-0 flex-1 text-[13px]">
                        {jobNameMap.get(run.job_id) ?? run.job_id.slice(0, 8)}
                      </span>
                      {/* Type badge */}
                      <span className="text-[9px] font-medium uppercase tracking-wider text-gray-600 bg-surface-raised rounded px-1.5 py-0.5 flex-shrink-0">cron</span>
                      {/* Duration */}
                      <span className="text-gray-600 text-[11px] tabular-nums flex-shrink-0 w-12 text-right">{formatDuration(run.duration_ms)}</span>
                      {/* Model — desktop only */}
                      {run.model && (
                        <span className="text-gray-700 text-[10px] hidden md:inline flex-shrink-0 w-20 truncate">{run.model}</span>
                      )}
                      {/* Time */}
                      <span className="text-gray-600 text-[11px] whitespace-nowrap tabular-nums flex-shrink-0">
                        {formatTime(run.timestamp)}
                      </span>
                      {/* Expand indicator */}
                      <svg
                        className={`w-3 h-3 text-gray-700 transition-transform duration-150 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 animate-fade-in">
                      <div className="ml-4 p-3 bg-surface-raised/40 rounded-lg border border-border text-xs space-y-2.5">
                        {run.summary && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Summary</p>
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {run.summary.length > 500
                                ? run.summary.slice(0, 500) + "\u2026"
                                : run.summary}
                            </p>
                          </div>
                        )}
                        {run.error && (
                          <div className="rounded-md bg-error/10 border border-error/10 p-2">
                            <p className="text-[10px] uppercase tracking-wider text-error/80 mb-1">Error</p>
                            <p className="text-error/80 leading-relaxed">{run.error}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 pt-0.5">
                          {run.provider && (
                            <span>Provider: <span className="text-gray-400">{run.provider}</span></span>
                          )}
                          {(run.input_tokens != null || run.output_tokens != null) && (
                            <span>
                              Tokens: <span className="text-gray-400 tabular-nums">{formatTokens(run.input_tokens)} in / {formatTokens(run.output_tokens)} out</span>
                            </span>
                          )}
                          {run.delivered != null && (
                            <span>Delivered: <span className={run.delivered ? "text-success" : "text-error"}>{run.delivered ? "Yes" : "No"}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              // ACP session entry
              const session = entry.session;
              const entryId = `acp-${session.key}`;
              const isExpanded = expandedId === entryId;
              return (
                <div key={entryId}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entryId)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isExpanded ? "bg-surface-hover" : i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    } hover:bg-surface-hover`}
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      {/* Status indicator */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          session.status === "done" ? "bg-success" : "bg-error"
                        }`}
                      />
                      {/* Session name */}
                      <span className="text-gray-200 truncate font-medium min-w-0 flex-1 text-[13px]">
                        {session.label ?? session.key}
                      </span>
                      {/* Type badge */}
                      <span className="text-[9px] font-medium uppercase tracking-wider text-accent/70 bg-accent/10 rounded px-1.5 py-0.5 flex-shrink-0">acp</span>
                      {/* Duration */}
                      <span className="text-gray-600 text-[11px] tabular-nums flex-shrink-0 w-12 text-right">{session.duration ?? "\u2014"}</span>
                      {/* Model — desktop only */}
                      {session.model && (
                        <span className="text-gray-700 text-[10px] hidden md:inline flex-shrink-0 w-20 truncate">{session.model}</span>
                      )}
                      {/* Time */}
                      <span className="text-gray-600 text-[11px] whitespace-nowrap tabular-nums flex-shrink-0">
                        {session.updatedAt ? formatTime(session.updatedAt) : "\u2014"}
                      </span>
                      {/* Expand indicator */}
                      <svg
                        className={`w-3 h-3 text-gray-700 transition-transform duration-150 flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 animate-fade-in">
                      <div className="ml-4 p-3 bg-surface-raised/40 rounded-lg border border-border text-xs space-y-2.5">
                        {session.summary && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Summary</p>
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {session.summary.length > 500
                                ? session.summary.slice(0, 500) + "\u2026"
                                : session.summary}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600 pt-0.5">
                          {session.agent && (
                            <span>Agent: <span className="text-gray-400">{session.agent}</span></span>
                          )}
                          {session.tokens != null && (
                            <span>Tokens: <span className="text-gray-400 tabular-nums">{formatTokens(session.tokens)}</span></span>
                          )}
                          {session.duration && (
                            <span>Duration: <span className="text-gray-400">{session.duration}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
