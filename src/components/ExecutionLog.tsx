import { useMemo, useState } from "react";
import type { UnifiedEvent, CronEvent, AcpEvent } from "../lib/events";
import { statusDotClass } from "../lib/events";

interface ExecutionLogProps {
  historyEvents: UnifiedEvent[];
  selectedJobId: string | null;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "\u2014";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function formatTime(epoch: number): string {
  const d = new Date(epoch);
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

type StatusFilter = "all" | "ok" | "error";
type SourceFilter = "all" | "cron" | "acp";

export function ExecutionLog({ historyEvents, selectedJobId }: ExecutionLogProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const entries = useMemo(() => {
    return historyEvents.filter((e) => {
      // Source filter
      if (sourceFilter !== "all" && e.source !== sourceFilter) return false;

      // Job filter — only applies to cron events
      if (selectedJobId && e.source === "cron") {
        if ((e as CronEvent).meta.run.job_id !== selectedJobId) return false;
      }
      // When a specific job is selected, still show ACP events (no silent dropping)

      // Status filter
      if (statusFilter === "ok" && e.status !== "done") return false;
      if (statusFilter === "error" && e.status !== "error") return false;

      return true;
    });
  }, [historyEvents, selectedJobId, statusFilter, sourceFilter]);

  const errorCount = historyEvents.filter((e) => e.status === "error").length;
  const successCount = historyEvents.filter((e) => e.status === "done").length;
  const cronCount = historyEvents.filter((e) => e.source === "cron").length;
  const acpCount = historyEvents.filter((e) => e.source === "acp").length;

  return (
    <div>
      {/* Header with filter tabs and counts */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Execution Log</h2>
          <span className="text-[10px] text-gray-600 tabular-nums">{entries.length} entries</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Source filter: All / Cron / ACP */}
          <div className="flex gap-0.5 rounded-lg border border-border bg-surface-card/60 p-0.5">
            {([
              { key: "all" as SourceFilter, label: "All" },
              { key: "cron" as SourceFilter, label: "Cron", count: cronCount },
              { key: "acp" as SourceFilter, label: "ACP", count: acpCount },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setSourceFilter(f.key)}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  sourceFilter === f.key
                    ? "tab-active"
                    : "text-gray-500 hover:text-gray-300 hover:bg-surface-hover"
                }`}
              >
                {f.label}
                {f.count != null && f.count > 0 && (
                  <span className={`text-[9px] rounded-full px-1.5 py-px ${
                    sourceFilter === f.key ? "bg-accent/20 text-accent" : "bg-surface-raised text-gray-600"
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Status filter: All / Success / Error */}
          <div className="flex gap-0.5 rounded-lg border border-border bg-surface-card/60 p-0.5">
            {([
              { key: "all" as StatusFilter, label: "All" },
              { key: "ok" as StatusFilter, label: "Success", count: successCount },
              { key: "error" as StatusFilter, label: "Error", count: errorCount },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  statusFilter === f.key
                    ? "tab-active"
                    : "text-gray-500 hover:text-gray-300 hover:bg-surface-hover"
                }`}
              >
                {f.label}
                {f.count != null && f.count > 0 && (
                  <span className={`text-[9px] rounded-full px-1.5 py-px ${
                    statusFilter === f.key ? "bg-accent/20 text-accent" : "bg-surface-raised text-gray-600"
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-gray-600 py-12 text-sm">
          <p>No entries to display</p>
          <p className="text-[10px] text-gray-700 mt-1">
            {statusFilter !== "all" || sourceFilter !== "all" ? "Try switching filters" : "Runs and sessions will appear after the first execution"}
          </p>
        </div>
      ) : (
        <div className="space-y-px max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface-card/30">
          {entries.map((event, i) => {
            const isExpanded = expandedId === event.id;

            if (event.source === "cron") {
              const run = (event as CronEvent).meta.run;
              return (
                <div key={event.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isExpanded ? "bg-surface-hover" : i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    } hover:bg-surface-hover`}
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotClass(event.status)}`} />
                      <span className="text-gray-200 truncate font-medium min-w-0 flex-1 text-[13px]">
                        {event.title}
                      </span>
                      <span className="text-[9px] font-medium uppercase tracking-wider text-gray-600 bg-surface-raised rounded px-1.5 py-0.5 flex-shrink-0">cron</span>
                      <span className="text-gray-600 text-[11px] tabular-nums flex-shrink-0 w-12 text-right">{formatDuration(run.duration_ms)}</span>
                      {run.model && (
                        <span className="text-gray-700 text-[10px] hidden md:inline flex-shrink-0 w-20 truncate">{run.model}</span>
                      )}
                      <span className="text-gray-600 text-[11px] whitespace-nowrap tabular-nums flex-shrink-0">
                        {formatTime(event.updatedAt)}
                      </span>
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
              const session = (event as AcpEvent).meta.session;
              return (
                <div key={event.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isExpanded ? "bg-surface-hover" : i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    } hover:bg-surface-hover`}
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotClass(event.status)}`} />
                      <span className="text-gray-200 truncate font-medium min-w-0 flex-1 text-[13px]">
                        {event.title}
                      </span>
                      <span className="text-[9px] font-medium uppercase tracking-wider text-accent/70 bg-accent/10 rounded px-1.5 py-0.5 flex-shrink-0">acp</span>
                      <span className="text-gray-600 text-[11px] tabular-nums flex-shrink-0 w-12 text-right">{session.duration ?? "\u2014"}</span>
                      {session.model && (
                        <span className="text-gray-700 text-[10px] hidden md:inline flex-shrink-0 w-20 truncate">{session.model}</span>
                      )}
                      <span className="text-gray-600 text-[11px] whitespace-nowrap tabular-nums flex-shrink-0">
                        {event.updatedAt ? formatTime(event.updatedAt) : "\u2014"}
                      </span>
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
