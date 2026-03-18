import { useMemo } from "react";
import { useSessions } from "../hooks/useSupabase";


function statusDot(status?: string) {
  if (status === "active" || status === "running") return "bg-emerald-400 animate-pulse";
  if (status === "error") return "bg-rose-400";
  if (status === "done") return "bg-accent/60";
  return "bg-gray-600";
}

function statusLabel(status?: string) {
  if (status === "active" || status === "running") return "Running";
  if (status === "error") return "Error";
  if (status === "done") return "Done";
  return "Idle";
}

function timeAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ACPSessions() {
  // Build marker: supabase-sessions-v2
  const { sessions, loading, error } = useSessions();

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [sessions]
  );

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">ACP Sessions</h2>
        {sorted.length > 0 && (
          <span className="text-[10px] font-medium text-gray-500 bg-surface-raised rounded-full px-2 py-0.5">{sorted.length}</span>
        )}
      </div>

      {(error || (!loading && sorted.length === 0)) && (
        <div className="flex items-center gap-3 py-6 px-2">
          <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400">{error ? "Connection error" : "No sessions"}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{error ?? "Agent sessions will show here when running"}</p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.slice(0, 8).map((s) => (
          <div key={s.key} className="rounded-lg border border-border bg-surface/40 px-3 py-2 hover:bg-surface-hover transition-colors cursor-default">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(s.status)}`} />
                <span className="truncate text-sm text-gray-200 font-medium">{s.label ?? s.key}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-gray-600">{statusLabel(s.status)}</span>
                {s.agent && (
                  <span className="text-[9px] text-gray-700 bg-surface-raised rounded px-1.5 py-0.5">{s.agent}</span>
                )}
              </div>
            </div>
            {s.updatedAt && (
              <p className="mt-1 pl-3.5 text-[10px] text-gray-600 tabular-nums">{timeAgo(s.updatedAt)}</p>
            )}
          </div>
        ))}
        {sorted.length > 8 && (
          <p className="text-[10px] text-gray-600 text-center pt-1">+{sorted.length - 8} more</p>
        )}
      </div>
    </div>
  );
}
