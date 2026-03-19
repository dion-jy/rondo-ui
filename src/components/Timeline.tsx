import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CronRun, CronJob, ACPSession } from "../types";
import { RunDetailModal } from "./RunDetailModal";

interface TimelineProps {
  runs: CronRun[];
  jobs: CronJob[];
  sessions: ACPSession[];
}

type EventBox = {
  run: CronRun;
  startMs: number;
  endMs: number;
  visualEndMs: number;
  col: number;
  colCount: number;
};

type SessionBox = {
  session: ACPSession;
  startMs: number;
  endMs: number;
};

const MIN_HOUR_HEIGHT = 32;
const MAX_HOUR_HEIGHT = 120;
const DEFAULT_HOUR_HEIGHT = 56;
const ZOOM_STEP = 8;
const STORAGE_KEY = "rondo-timeline-zoom";
const LAYER_KEY = "rondo-timeline-layers";
const DAY_MS = 24 * 3600_000;

function getInitialZoom(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const v = Number(saved);
      if (v >= MIN_HOUR_HEIGHT && v <= MAX_HOUR_HEIGHT) return v;
    }
  } catch { /* noop */ }
  return DEFAULT_HOUR_HEIGHT;
}

function getInitialLayers(): { cron: boolean; sessions: boolean } {
  try {
    const saved = localStorage.getItem(LAYER_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* noop */ }
  return { cron: true, sessions: true };
}

function evClass(status: string) {
  if (status === "ok") return "ev-ok";
  if (status === "error") return "ev-error";
  if (status === "running") return "ev-running";
  if (status === "scheduled") return "ev-scheduled";
  return "ev-default";
}

function sessionStatusColor(status?: string) {
  if (status === "scheduled") return "session-bar-scheduled";
  if (status === "running" || status === "active") return "session-bar-running";
  if (status === "error") return "session-bar-error";
  if (status === "done") return "session-bar-done";
  return "session-bar-idle";
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function formatTimeShort(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Generate projected future runs for enabled cron jobs within a time window.
 * Returns synthetic CronRun objects with status="scheduled".
 */
function generateScheduledRuns(jobs: CronJob[], dayStartMs: number, dayEndMs: number): CronRun[] {
  const now = Date.now();
  // Only show future projections
  if (dayEndMs <= now) return [];

  const projections: CronRun[] = [];

  for (const job of jobs) {
    if (!job.enabled) continue;

    let intervalMs = 0;
    if (job.schedule_kind === "every" && job.schedule_every_ms) {
      intervalMs = job.schedule_every_ms;
    } else if (job.schedule_kind === "cron" && job.schedule_expr) {
      // Simple heuristic for common cron patterns
      const parts = (job.schedule_expr || "").split(/\s+/);
      if (parts.length >= 5) {
        const minPart = parts[0];
        if (minPart.startsWith("*/")) {
          intervalMs = parseInt(minPart.slice(2)) * 60_000;
        } else {
          // Hourly-ish default for standard cron
          intervalMs = 60 * 60_000;
        }
      }
    }

    if (intervalMs <= 0) continue;

    // Start from next_run_at or last_run_at + interval
    let cursor = 0;
    if (job.next_run_at) {
      cursor = new Date(job.next_run_at).getTime();
    } else if (job.last_run_at) {
      cursor = new Date(job.last_run_at).getTime() + intervalMs;
    } else {
      continue;
    }

    // Walk forward until past dayEndMs, max 50 per job
    let count = 0;
    while (cursor < dayEndMs && count < 50) {
      if (cursor >= Math.max(dayStartMs, now)) {
        const avgDuration = job.last_duration_ms ?? 30_000;
        projections.push({
          id: `scheduled-${job.id}-${cursor}`,
          instance_id: "",
          job_id: job.id,
          timestamp: new Date(cursor + avgDuration).toISOString(),
          status: "scheduled",
          action: job.name,
          summary: null,
          error: null,
          duration_ms: avgDuration,
          model: job.payload_model,
          provider: null,
          session_id: null,
          delivered: null,
          delivery_status: null,
          input_tokens: null,
          output_tokens: null,
          total_tokens: null,
          synced_at: "",
        });
        count++;
      }
      cursor += intervalMs;
    }
  }

  return projections;
}

/**
 * Generate projected future ACP sessions for cron jobs with session_target="isolated".
 */
function generateScheduledSessions(jobs: CronJob[], dayStartMs: number, dayEndMs: number): SessionBox[] {
  const now = Date.now();
  if (dayEndMs <= now) return [];

  const projections: SessionBox[] = [];

  for (const job of jobs) {
    if (!job.enabled || job.session_target !== "isolated") continue;

    let intervalMs = 0;
    if (job.schedule_kind === "every" && job.schedule_every_ms) {
      intervalMs = job.schedule_every_ms;
    } else if (job.schedule_kind === "cron" && job.schedule_expr) {
      const parts = (job.schedule_expr || "").split(/\s+/);
      if (parts.length >= 5) {
        const minPart = parts[0];
        if (minPart.startsWith("*/")) {
          intervalMs = parseInt(minPart.slice(2)) * 60_000;
        } else {
          intervalMs = 60 * 60_000;
        }
      }
    }

    if (intervalMs <= 0) continue;

    let cursor = 0;
    if (job.next_run_at) {
      cursor = new Date(job.next_run_at).getTime();
    } else if (job.last_run_at) {
      cursor = new Date(job.last_run_at).getTime() + intervalMs;
    } else {
      continue;
    }

    let count = 0;
    while (cursor < dayEndMs && count < 20) {
      if (cursor >= Math.max(dayStartMs, now)) {
        const estDuration = job.last_duration_ms ?? 60_000;
        projections.push({
          session: {
            key: `scheduled-acp-${job.id}-${cursor}`,
            label: job.name,
            status: "scheduled",
            startedAt: cursor,
            updatedAt: cursor + estDuration,
          },
          startMs: cursor,
          endMs: cursor + estDuration,
        });
        count++;
      }
      cursor += intervalMs;
    }
  }

  return projections;
}

function layoutOverlaps(dayRuns: CronRun[], dayStartMs: number): EventBox[] {
  if (dayRuns.length === 0) return [];

  // Minimum visual height is 18px; at default hourHeight (~80px),
  // that's about 13.5 minutes. Use 15min as collision minimum so
  // visually overlapping events get side-by-side layout.
  const MIN_VISUAL_MS = 15 * 60_000;

  const items = dayRuns
    .map((run) => {
      const endMs = new Date(run.timestamp).getTime();
      const dur = Math.max(run.duration_ms ?? 60_000, 30_000);
      const startMs = Math.max(dayStartMs, endMs - dur);
      // For collision detection, extend endMs to match minimum visual height
      const visualEndMs = Math.max(endMs, startMs + MIN_VISUAL_MS);
      return { run, startMs, endMs, visualEndMs };
    })
    .sort((a, b) => a.startMs - b.startMs);

  // 1. Build collision groups (connected components of overlapping events)
  const groups: (typeof items)[] = [];
  let currentGroup: typeof items = [items[0]];
  let groupEnd = items[0].visualEndMs;

  for (let i = 1; i < items.length; i++) {
    if (items[i].startMs <= groupEnd) {
      // Overlaps with current group (includes same-time events)
      currentGroup.push(items[i]);
      groupEnd = Math.max(groupEnd, items[i].visualEndMs);
    } else {
      groups.push(currentGroup);
      currentGroup = [items[i]];
      groupEnd = items[i].endMs;
    }
  }
  groups.push(currentGroup);

  // 2. Within each group, assign columns greedily
  const out: EventBox[] = [];

  for (const group of groups) {
    const active: { visualEndMs: number; col: number }[] = [];
    let maxCol = 0;

    const assigned: { item: typeof items[0]; col: number }[] = [];

    for (const it of group) {
      // Expire events whose visual extent ended before this one starts
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].visualEndMs < it.startMs) active.splice(i, 1);
      }

      let col = 0;
      while (active.some((a) => a.col === col)) col++;
      active.push({ visualEndMs: it.visualEndMs, col });
      maxCol = Math.max(maxCol, col);

      assigned.push({ item: it, col });
    }

    // All events in the group share the same colCount
    const colCount = maxCol + 1;
    for (const { item, col } of assigned) {
      out.push({ ...item, col, colCount });
    }
  }

  return out;
}

type SessionBoxExt = SessionBox & {
  clampedTop: boolean;
  clampedBottom: boolean;
  isLong: boolean; // >4h
};

function getSessionTimeRange(session: ACPSession, dayStartMs: number, dayEndMs: number): SessionBoxExt | null {
  const startMs = session.startedAt ?? session.updatedAt ?? 0;
  if (startMs === 0) return null;

  let endMs: number;
  if (session.status === "running" || session.status === "active") {
    endMs = Date.now();
  } else {
    endMs = session.updatedAt ?? startMs;
  }

  const clampedStart = Math.max(startMs, dayStartMs);
  const clampedEnd = Math.min(endMs, dayEndMs);
  if (clampedStart >= clampedEnd) return null;

  return {
    session,
    startMs: clampedStart,
    endMs: clampedEnd,
    clampedTop: startMs < dayStartMs,
    clampedBottom: endMs > dayEndMs,
    isLong: (clampedEnd - clampedStart) > 4 * 3600_000,
  };
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// ── Session Detail Overlay ──

function SessionDetailOverlay({ session, onClose }: { session: ACPSession; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusBadge = (s?: string) => {
    if (s === "running" || s === "active") return "badge-running";
    if (s === "error") return "badge-error";
    if (s === "done") return "badge-ok";
    return "badge-disabled";
  };

  const statusLabel = (s?: string) => {
    if (s === "running" || s === "active") return "Running";
    if (s === "error") return "Error";
    if (s === "done") return "Done";
    return "Idle";
  };

  const barColor = (s?: string) => {
    if (s === "running" || s === "active") return "bg-accent";
    if (s === "error") return "bg-rose-500";
    if (s === "done") return "bg-accent";
    return "bg-gray-600";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-surface-card shadow-2xl animate-slide-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Status accent bar */}
        <div className={`h-0.5 ${barColor(session.status)}`} />

        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-100 truncate">{session.label ?? session.key}</h3>
              <span className="text-[10px] text-gray-600 uppercase tracking-wide">ACP Session</span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-surface-hover transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${statusBadge(session.status)}`}>{statusLabel(session.status)}</span>
            {session.agent && <span className="text-[10px] text-gray-500 bg-surface-raised rounded px-1.5 py-0.5">{session.agent}</span>}
            {session.model && <span className="text-[10px] text-gray-500 bg-surface-raised rounded px-1.5 py-0.5">{session.model}</span>}
          </div>

          {session.summary && (
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Summary</p>
              <p className="text-[13px] text-gray-300 leading-relaxed">{session.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {session.duration && (
              <div className="rounded-lg border border-border bg-surface/40 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-gray-600">Duration</p>
                <p className="text-sm text-gray-200 font-medium mt-0.5">{session.duration}</p>
              </div>
            )}
            {session.tokens != null && (
              <div className="rounded-lg border border-border bg-surface/40 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-gray-600">Tokens</p>
                <p className="text-sm text-gray-200 font-medium tabular-nums mt-0.5">{session.tokens.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Time info — compact footer */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 pt-1 border-t border-border">
            {session.startedAt && (
              <span>Started: <span className="text-gray-400 tabular-nums">{new Date(session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></span>
            )}
            {session.updatedAt && (
              <span>Updated: <span className="text-gray-400 tabular-nums">{new Date(session.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></span>
            )}
            <span className="ml-auto font-mono text-gray-700">{session.key.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Layer Toggle (compact) ──

function LayerToggle({
  layers,
  onToggle,
  sessionCount,
}: {
  layers: { cron: boolean; sessions: boolean };
  onToggle: (layer: "cron" | "sessions") => void;
  sessionCount: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onToggle("cron")}
        className={`flex items-center gap-1 px-2 py-1 text-[10px] transition-colors ${
          layers.cron ? "bg-accent/15 text-accent" : "text-gray-600 hover:text-gray-400"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${layers.cron ? "bg-accent" : "bg-gray-700"}`} />
        Cron
      </button>
      <button
        onClick={() => onToggle("sessions")}
        className={`flex items-center gap-1 px-2 py-1 text-[10px] transition-colors ${
          layers.sessions ? "bg-accent-aqua/15 text-accent-aqua" : "text-gray-600 hover:text-gray-400"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${layers.sessions ? "bg-accent-aqua" : "bg-gray-700"}`} />
        Sessions
        {sessionCount > 0 && layers.sessions && (
          <span className="ml-0.5 bg-accent/20 text-accent-brass rounded-full px-1 text-[9px]">{sessionCount}</span>
        )}
      </button>
    </div>
  );
}

// ── Main Timeline ──

export function Timeline({ runs, jobs, sessions }: TimelineProps) {
  const [offset, setOffset] = useState<1 | 3 | 5>(1);
  const [hourHeight, setHourHeight] = useState(getInitialZoom);
  const [selectedRun, setSelectedRun] = useState<CronRun | null>(null);
  const [selectedSession, setSelectedSession] = useState<ACPSession | null>(null);
  const [layers, setLayers] = useState(getInitialLayers);
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  const jobNameMap = useMemo(() => new Map(jobs.map((j) => [j.id, j.name])), [jobs]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(hourHeight)); } catch { /* noop */ }
  }, [hourHeight]);

  useEffect(() => {
    try { localStorage.setItem(LAYER_KEY, JSON.stringify(layers)); } catch { /* noop */ }
  }, [layers]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Scroll to current hour on mount
  useEffect(() => {
    if (scrollRef.current) {
      const nowH = new Date().getHours();
      const targetTop = Math.max(0, (nowH - 1) * hourHeight);
      scrollRef.current.scrollTop = targetTop;
    }
  }, []);

  const toggleLayer = useCallback((layer: "cron" | "sessions") => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const zoomIn = useCallback(() => setHourHeight((h) => Math.min(MAX_HOUR_HEIGHT, h + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setHourHeight((h) => Math.max(MIN_HOUR_HEIGHT, h - ZOOM_STEP)), []);

  // Keyboard shortcuts: +/- zoom, 1/3/5 day range
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture if a modal is open or user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (selectedRun || selectedSession) return;

      switch (e.key) {
        case "=":
        case "+": zoomIn(); break;
        case "-": zoomOut(); break;
        case "1": setOffset(1); break;
        case "3": setOffset(3); break;
        case "5": setOffset(5); break;
        case "t":
        case "T": {
          // Scroll to now
          if (scrollRef.current) {
            const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
            const targetTop = currentHour * hourHeight - scrollRef.current.clientHeight / 3;
            scrollRef.current.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
          }
          break;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomIn, zoomOut, selectedRun, selectedSession, hourHeight]);

  const totalDays = 2 * offset + 1;

  const rangeStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    return d;
  }, [offset]);

  const dayColumns = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [rangeStart, totalDays]);

  const rangeEnd = useMemo(() => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + totalDays);
    return d;
  }, [rangeStart, totalDays]);

  const visibleRuns = useMemo(
    () => runs.filter((r) => {
      const ts = new Date(r.timestamp);
      return ts >= rangeStart && ts < rangeEnd;
    }),
    [runs, rangeStart, rangeEnd]
  );

  const visibleSessions = useMemo(
    () => sessions.filter((s) => {
      const start = s.startedAt ?? s.updatedAt ?? 0;
      const end = (s.status === "running" || s.status === "active") ? Date.now() : (s.updatedAt ?? start);
      return end >= rangeStart.getTime() && start < rangeEnd.getTime();
    }),
    [sessions, rangeStart, rangeEnd]
  );

  const totalHeight = 24 * hourHeight;
  const zoomPct = Math.round(((hourHeight - MIN_HOUR_HEIGHT) / (MAX_HOUR_HEIGHT - MIN_HOUR_HEIGHT)) * 100);

  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowTop = nowHour * hourHeight;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Toolbar — flat, edge-to-edge ── */}
      <div className="flex items-center justify-between gap-2 px-3 md:px-6 py-1.5 md:py-2 border-b border-white/[0.04] overflow-x-auto shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          {/* Status legend — desktop only */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-gray-600">
            {layers.cron && (
              <>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded ev-ok" />OK</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded ev-error" />Err</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded ev-running" />Run</span>
              </>
            )}
            {layers.sessions && (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded session-legend-swatch" />Sess</span>
            )}
          </div>

          <LayerToggle layers={layers} onToggle={toggleLayer} sessionCount={visibleSessions.length} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Jump to now */}
          <button
            onClick={() => {
              if (scrollRef.current) {
                const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
                const targetTop = currentHour * hourHeight - scrollRef.current.clientHeight / 3;
                scrollRef.current.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
              }
            }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-600 hover:text-accent-aqua hover:bg-accent-aqua/10 transition-colors"
            title="Jump to now (T)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-aqua" />
            Now
          </button>

          {/* Zoom */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={zoomOut}
              disabled={hourHeight <= MIN_HOUR_HEIGHT}
              className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.04] active:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono transition-colors"
              title="Zoom out (−)"
            >{"\u2212"}</button>
            <input
              type="range"
              min={MIN_HOUR_HEIGHT}
              max={MAX_HOUR_HEIGHT}
              step={ZOOM_STEP}
              value={hourHeight}
              onChange={(e) => setHourHeight(Number(e.target.value))}
              className="w-14 md:w-16 h-1 cursor-pointer"
              title={`Zoom: ${zoomPct}%`}
            />
            <button
              onClick={zoomIn}
              disabled={hourHeight >= MAX_HOUR_HEIGHT}
              className="w-8 h-8 md:w-7 md:h-7 flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.04] active:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono transition-colors"
              title="Zoom in (+)"
            >+</button>
          </div>

          {/* Day range — flat selector */}
          <div className="flex items-center bg-white/[0.02] p-0.5">
            {([1, 3, 5] as const).map((d) => (
              <button
                key={d}
                onClick={() => setOffset(d)}
                className={`px-2.5 py-1 text-[11px] font-medium transition-all ${
                  offset === d
                    ? "bg-accent/12 text-accent"
                    : "text-gray-600 hover:text-gray-300 active:text-white"
                }`}
              >
                {"\u00B1"}{d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar grid — fills remaining viewport ── */}
      <div ref={scrollRef} className="overflow-auto flex-1 min-h-0">
        <div className="min-w-[600px]">
          {/* ── Day strip header ── */}
          <div className="sticky top-0 z-20 flex border-b border-white/[0.04] bg-surface/95 backdrop-blur-lg">
            {/* Time corner */}
            <div className="sticky left-0 self-start z-40 w-10 shrink-0 border-r border-white/[0.04] bg-surface/95 px-1 py-2 text-[9px] text-gray-700 font-medium text-center select-none">
              HR
            </div>
            {/* Day chips */}
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${dayColumns.length}, minmax(100px,1fr))` }}>
              {dayColumns.map((day) => {
                const today = isToday(day);
                const weekday = day.toLocaleDateString(undefined, { weekday: "short" });
                const dateNum = day.getDate();
                return (
                  <div
                    key={day.toISOString()}
                    className="border-r border-white/[0.04] px-2 py-1.5 flex items-center gap-1.5"
                  >
                    <span className={`text-[11px] font-medium ${today ? "text-accent" : "text-gray-600"}`}>
                      {weekday}
                    </span>
                    <span
                      className={
                        today
                          ? "today-chip"
                          : "text-[11px] text-gray-400 font-semibold"
                      }
                    >
                      {dateNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Grid body ── */}
          <div className="relative flex" style={{ height: totalHeight }}>
            {/* Sticky time axis */}
            <div className="sticky left-0 self-start z-30 w-10 shrink-0 border-r border-white/[0.04] bg-surface/95">
              {Array.from({ length: 25 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 w-10 -translate-y-1/2 text-[9px] text-gray-700 text-right pr-1.5 select-none tabular-nums"
                  style={{ top: i * hourHeight }}
                >
                  {String(i % 24).padStart(2, "0")}
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="relative flex-1" style={{ display: "grid", gridTemplateColumns: `repeat(${dayColumns.length}, minmax(100px,1fr))` }}>
              {dayColumns.map((day) => {
                const dayStartMs = day.getTime();
                const dayEndMs = dayStartMs + DAY_MS;
                const today = isToday(day);

                const realSessionBoxes: SessionBoxExt[] = layers.sessions
                  ? visibleSessions
                      .map((s) => getSessionTimeRange(s, dayStartMs, dayEndMs))
                      .filter((b): b is SessionBoxExt => b !== null)
                      .filter((b) => b.endMs - b.startMs >= 30_000) // filter failed spawns (<30s)
                  : [];
                const scheduledSessionBoxes: SessionBoxExt[] = layers.sessions
                  ? generateScheduledSessions(jobs, dayStartMs, dayEndMs).map((sb) => ({
                      ...sb, clampedTop: false, clampedBottom: false, isLong: false,
                    }))
                  : [];
                const sessionBoxes = [...realSessionBoxes, ...scheduledSessionBoxes];

                const dayRuns = layers.cron
                  ? visibleRuns.filter((r) => {
                      const ts = new Date(r.timestamp).getTime();
                      return ts >= dayStartMs && ts < dayEndMs;
                    })
                  : [];
                const scheduledRuns = layers.cron
                  ? generateScheduledRuns(jobs, dayStartMs, dayEndMs)
                  : [];
                const allDayRuns = [...dayRuns, ...scheduledRuns];
                const hasActivity = sessionBoxes.length > 0 || allDayRuns.length > 0;
                const events = layoutOverlaps(allDayRuns, dayStartMs);

                return (
                  <div key={day.toISOString()} className={`relative border-r border-white/[0.03] ${today ? "today-column" : ""}`}>
                    {/* Hour gridlines */}
                    {Array.from({ length: 25 }, (_, i) => (
                      <div key={i} className="absolute left-0 right-0 border-t border-white/[0.025]" style={{ top: i * hourHeight }} />
                    ))}

                    {/* Current time indicator on today */}
                    {today && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: `${nowTop}px` }}
                      >
                        <div className="relative flex items-center">
                          <span className="w-2 h-2 rounded-full bg-accent-aqua -ml-1 shadow-[0_0_8px_rgba(51,209,198,0.6)]" />
                          <div className="flex-1 h-[1.5px] bg-accent-aqua/60" />
                          <span className="text-[9px] text-accent-aqua font-medium tabular-nums ml-0.5 mr-1 whitespace-nowrap">
                            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Session bars (background) */}
                    {sessionBoxes.map((sb) => {
                      const top = ((sb.startMs - dayStartMs) / DAY_MS) * totalHeight;
                      const height = Math.max(((sb.endMs - sb.startMs) / DAY_MS) * totalHeight, 6);
                      const showLabel = height >= 18;
                      const isRunning = sb.session.status === "running" || sb.session.status === "active";
                      const isScheduled = sb.session.status === "scheduled";
                      const timeRange = `${formatTimeShort(sb.startMs)} – ${formatTimeShort(sb.endMs)}`;

                      return (
                        <button
                          key={sb.session.key}
                          onClick={() => !isScheduled && setSelectedSession(sb.session)}
                          className={`absolute ${isScheduled ? "cursor-default" : "cursor-pointer"} transition-all duration-150 hover:brightness-125 ${sessionStatusColor(sb.session.status)}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: 0,
                            width: "28%",
                            zIndex: 1,
                          }}
                          title={`${sb.session.label ?? sb.session.key} · ${sb.session.status ?? "unknown"}\n${timeRange}${sb.session.duration ? ` · ${sb.session.duration}` : ""}${sb.session.agent ? `\n${sb.session.agent}` : ""}${isScheduled ? " (projected)" : ""}`}
                        >
                          {/* Continuation arrow at top (session started before this day) */}
                          {sb.clampedTop && (
                            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] text-white/60 leading-none">▴</span>
                          )}
                          {showLabel && (
                            <span className={`block px-1.5 text-[9px] leading-tight font-medium truncate drop-shadow-sm ${isScheduled ? "text-accent-aqua/70" : "text-white/90"} ${sb.clampedTop ? "mt-2" : ""}`}>
                              {isRunning && <span className="inline-block w-1 h-1 rounded-full bg-accent-aqua animate-pulse mr-1 align-middle" />}
                              {isScheduled && "⏱ "}
                              {sb.session.label ?? sb.session.key}
                            </span>
                          )}
                          {/* Long session fade gradient */}
                          {sb.isLong && height > 60 && (
                            <span className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent rounded-b-sm pointer-events-none" />
                          )}
                          {/* Continuation arrow at bottom (session extends past this day) */}
                          {sb.clampedBottom && (
                            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-white/60 leading-none">▾</span>
                          )}
                        </button>
                      );
                    })}

                    {/* ── Cron event cards ── */}
                    {events.map((e) => {
                      const top = ((e.startMs - dayStartMs) / DAY_MS) * totalHeight;
                      const height = Math.max(((e.endMs - e.startMs) / DAY_MS) * totalHeight, 18);
                      const laneWidth = 70; // cron events use right 70% of column
                      const laneOffset = 30; // start after session lane
                      const width = laneWidth / e.colCount;
                      const left = laneOffset + e.col * width;
                      const label = jobNameMap.get(e.run.job_id) ?? e.run.action ?? "";
                      const dur = formatDuration(e.run.duration_ms);
                      const showTitle = height >= 12;
                      const showMeta = height >= 38;
                      const showDuration = height >= 52;
                      const showDot = !showTitle && height >= 6;

                      return (
                        <button
                          key={e.run.id}
                          onClick={() => setSelectedRun(e.run)}
                          className={`timeline-bar ${evClass(e.run.status)} group`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `calc(${left}% + 2px)`,
                            width: `calc(${width}% - 4px)`,
                            zIndex: 2,
                            padding: showTitle ? "1px 4px" : undefined,
                          }}
                          title={`${e.run.status} \u00B7 ${new Date(e.run.timestamp).toLocaleString()}\n${e.run.summary ?? ""}`}
                        >
                          {showTitle && (
                            <span className="block text-[9px] leading-none text-white font-semibold truncate overflow-hidden whitespace-nowrap">
                              {label}
                            </span>
                          )}
                          {showMeta && (
                            <span className="block text-[9px] leading-tight text-white/60 truncate mt-0.5">
                              {e.run.status}{e.run.model ? ` \u00B7 ${e.run.model}` : ""}
                            </span>
                          )}
                          {showDuration && (
                            <span className="absolute bottom-1 left-1.5 text-[9px] text-white/50 font-medium tabular-nums">
                              {dur}
                            </span>
                          )}
                          {showDot && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-white/70 ring-2 ring-white/20" />
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* No activity placeholder */}
                    {!hasActivity && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-gray-700 italic">No activity</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedRun && (
        <RunDetailModal
          run={selectedRun}
          jobName={jobNameMap.get(selectedRun.job_id)}
          onClose={() => setSelectedRun(null)}
        />
      )}

      {selectedSession && (
        <SessionDetailOverlay
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
