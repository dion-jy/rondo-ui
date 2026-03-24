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

/* ── Mobile detail drawer ── */
function LogDetailDrawer({ event, onClose }: { event: UnifiedEvent; onClose: () => void }) {
  const isCron = event.source === "cron";
  const run = isCron ? (event as CronEvent).meta.run : null;
  const session = !isCron ? (event as AcpEvent).meta.session : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-surface-card border-t border-border rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        <div className="px-4 pb-6 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotClass(event.status)}`} />
                <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isCron ? "text-gray-600 bg-surface-raised" : "text-accent/70 bg-accent/10"
                }`}>
                  {event.source}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-100 break-words">
                {event.title}
              </h3>
              <p className="text-[11px] text-gray-600 mt-0.5 tabular-nums">
                {event.updatedAt ? formatTime(event.updatedAt) : "\u2014"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-surface-hover transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-600">Duration</p>
              <p className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                {isCron ? formatDuration(run!.duration_ms) : (session!.duration ?? "\u2014")}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-600">Tokens</p>
              <p className="text-sm font-semibold text-gray-200 mt-0.5 tabular-nums">
                {isCron
                  ? (run!.input_tokens != null || run!.output_tokens != null
                    ? `${formatTokens(run!.input_tokens)}/${formatTokens(run!.output_tokens)}`
                    : "\u2014")
                  : formatTokens(session!.tokens)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-center">
              <p className="text-[9px] uppercase tracking-wider text-gray-600">Model</p>
              <p className="text-sm font-semibold text-gray-200 mt-0.5 truncate tabular-nums">
                {(isCron ? run!.model : session!.model) ?? "\u2014"}
              </p>
            </div>
          </div>

          {/* Summary */}
          {(isCron ? run!.summary : session!.summary) && (
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">Summary</p>
              <p className="text-[13px] text-gray-300 whitespace-pre-wrap leading-relaxed break-words">
                {isCron ? run!.summary : session!.summary}
              </p>
            </div>
          )}

          {/* Error (cron only) */}
          {isCron && run!.error && (
            <div className="rounded-lg border border-error/15 bg-error/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-error/80 mb-1.5">Error</p>
              <p className="text-[13px] text-error/80 whitespace-pre-wrap break-all leading-relaxed">
                {run!.error}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-1 border-t border-border">
            {isCron && run!.provider && <span>Provider: <span className="text-gray-400">{run!.provider}</span></span>}
            {isCron && run!.delivered != null && (
              <span className={run!.delivered ? "text-success/70" : "text-error/70"}>
                {run!.delivered ? "Delivered" : "Not delivered"}
              </span>
            )}
            {!isCron && session!.agent && <span>Agent: <span className="text-gray-400">{session!.agent}</span></span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExecutionLog({ historyEvents, selectedJobId }: ExecutionLogProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drawerEvent, setDrawerEvent] = useState<UnifiedEvent | null>(null);

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
    <div className="min-w-0">
      {/* Header with filter tabs and counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Execution Log</h2>
          <span className="text-[10px] text-gray-600 tabular-nums">{entries.length} entries</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
          {/* Source filter: All / Cron / ACP */}
          <div className="flex gap-0.5 rounded-lg border border-border bg-surface-card/60 p-0.5 flex-shrink-0">
            {([
              { key: "all" as SourceFilter, label: "All" },
              { key: "cron" as SourceFilter, label: "Cron", count: cronCount },
              { key: "acp" as SourceFilter, label: "ACP", count: acpCount },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setSourceFilter(f.key)}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
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
          <div className="flex gap-0.5 rounded-lg border border-border bg-surface-card/60 p-0.5 flex-shrink-0">
            {([
              { key: "all" as StatusFilter, label: "All" },
              { key: "ok" as StatusFilter, label: "Success", count: successCount },
              { key: "error" as StatusFilter, label: "Error", count: errorCount },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 text-[11px] rounded-md transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
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
                  {/* ── Desktop row (md+) ── */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors hidden md:block ${
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
                        <span className="text-gray-700 text-[10px] flex-shrink-0 w-20 truncate">{run.model}</span>
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

                  {/* ── Mobile card (< md) ── */}
                  <button
                    onClick={() => setDrawerEvent(event)}
                    className={`w-full text-left px-3 py-2.5 transition-colors md:hidden ${
                      i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    } hover:bg-surface-hover active:bg-surface-hover`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${statusDotClass(event.status)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-600 bg-surface-raised rounded px-1.5 py-0.5">cron</span>
                          <span className="text-gray-600 text-[10px] tabular-nums">{formatDuration(run.duration_ms)}</span>
                          <span className="text-gray-700 text-[10px] tabular-nums ml-auto">{formatTime(event.updatedAt)}</span>
                        </div>
                        <p className="text-gray-200 font-medium text-[13px] leading-snug line-clamp-2 break-words">
                          {event.title}
                        </p>
                      </div>
                      <svg
                        className="w-3 h-3 text-gray-700 flex-shrink-0 mt-1.5"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Desktop expanded detail (md+) */}
                  {isExpanded && (
                    <div className="px-3 pb-3 animate-fade-in hidden md:block">
                      <div className="ml-4 p-3 bg-surface-raised/40 rounded-lg border border-border text-xs space-y-2.5">
                        {run.summary && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Summary</p>
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed break-words">
                              {run.summary.length > 500
                                ? run.summary.slice(0, 500) + "\u2026"
                                : run.summary}
                            </p>
                          </div>
                        )}
                        {run.error && (
                          <div className="rounded-md bg-error/10 border border-error/10 p-2">
                            <p className="text-[10px] uppercase tracking-wider text-error/80 mb-1">Error</p>
                            <p className="text-error/80 leading-relaxed break-all">{run.error}</p>
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
                  {/* ── Desktop row (md+) ── */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className={`w-full text-left px-3 py-2.5 transition-colors hidden md:block ${
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
                        <span className="text-gray-700 text-[10px] flex-shrink-0 w-20 truncate">{session.model}</span>
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

                  {/* ── Mobile card (< md) ── */}
                  <button
                    onClick={() => setDrawerEvent(event)}
                    className={`w-full text-left px-3 py-2.5 transition-colors md:hidden ${
                      i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                    } hover:bg-surface-hover active:bg-surface-hover`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${statusDotClass(event.status)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-medium uppercase tracking-wider text-accent/70 bg-accent/10 rounded px-1.5 py-0.5">acp</span>
                          <span className="text-gray-600 text-[10px] tabular-nums">{session.duration ?? "\u2014"}</span>
                          <span className="text-gray-700 text-[10px] tabular-nums ml-auto">{event.updatedAt ? formatTime(event.updatedAt) : "\u2014"}</span>
                        </div>
                        <p className="text-gray-200 font-medium text-[13px] leading-snug line-clamp-2 break-words">
                          {event.title}
                        </p>
                      </div>
                      <svg
                        className="w-3 h-3 text-gray-700 flex-shrink-0 mt-1.5"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Desktop expanded detail (md+) */}
                  {isExpanded && (
                    <div className="px-3 pb-3 animate-fade-in hidden md:block">
                      <div className="ml-4 p-3 bg-surface-raised/40 rounded-lg border border-border text-xs space-y-2.5">
                        {session.summary && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Summary</p>
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed break-words">
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

      {/* Mobile detail drawer */}
      {drawerEvent && (
        <LogDetailDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />
      )}
    </div>
  );
}
