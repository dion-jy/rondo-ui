import { useEffect } from "react";
import type { CronRun } from "../types";

interface RunDetailModalProps {
  run: CronRun;
  jobName?: string;
  onClose: () => void;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "\u2014";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function formatTokens(n: number | null): string {
  if (n == null) return "\u2014";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const STATUS_STYLES: Record<string, { chip: string; dot: string; bar: string; label: string }> = {
  ok: { chip: "bg-success/10 text-success border-success/20", dot: "bg-success", bar: "bg-success", label: "Success" },
  error: { chip: "bg-error/10 text-error border-error/20", dot: "bg-error", bar: "bg-error", label: "Error" },
  running: { chip: "bg-info/10 text-info border-info/20", dot: "bg-info animate-pulse", bar: "bg-info", label: "Running" },
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] ?? { chip: "bg-gray-500/10 text-gray-400 border-gray-500/20", dot: "bg-gray-400", bar: "bg-gray-500", label: status };
}

export function RunDetailModal({ run, jobName, onClose }: RunDetailModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const ts = new Date(run.timestamp);
  const style = getStatusStyle(run.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-xl border border-border bg-surface-card shadow-2xl shadow-black/50 animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status accent bar */}
        <div className={`h-0.5 ${style.bar}`} />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-100 truncate">
              {jobName ?? run.job_id.slice(0, 12)}
            </h3>
            <p className="text-[11px] text-gray-600 mt-0.5 tabular-nums">
              {ts.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              {" \u00B7 "}
              {ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${style.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-surface-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-2.5">
            <MetricCard label="Duration" value={formatDuration(run.duration_ms)} />
            <MetricCard label="Tokens" value={formatTokens(run.total_tokens)} />
            <MetricCard label="Model" value={run.model ?? "\u2014"} />
          </div>

          {/* Token breakdown */}
          {(run.input_tokens != null || run.output_tokens != null) && (
            <div className="flex gap-4 text-[11px] text-gray-600 px-0.5">
              <span>In: <span className="text-gray-400 tabular-nums">{formatTokens(run.input_tokens)}</span></span>
              <span>Out: <span className="text-gray-400 tabular-nums">{formatTokens(run.output_tokens)}</span></span>
              {run.provider && <span>via <span className="text-gray-400">{run.provider}</span></span>}
            </div>
          )}

          {/* Summary */}
          {run.summary && (
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">Summary</p>
              <p className="text-[13px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                {run.summary}
              </p>
            </div>
          )}

          {/* Error */}
          {run.error && (
            <div className="rounded-lg border border-error/15 bg-error/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-error/80 mb-1.5">Error</p>
              <p className="text-[13px] text-error/80 whitespace-pre-wrap break-all leading-relaxed">
                {run.error}
              </p>
            </div>
          )}

          {/* Meta footer */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-1 border-t border-border">
            {run.action && <span>{run.action}</span>}
            {run.delivered != null && (
              <span className={run.delivered ? "text-success/70" : "text-error/70"}>
                {run.delivered ? "Delivered" : "Not delivered"}
              </span>
            )}
            {run.delivery_status && <span>{run.delivery_status}</span>}
            <span className="ml-auto font-mono text-gray-700">{run.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-center">
      <p className="text-[9px] uppercase tracking-wider text-gray-600">{label}</p>
      <p className="text-sm font-semibold text-gray-200 mt-0.5 truncate tabular-nums">{value}</p>
    </div>
  );
}
