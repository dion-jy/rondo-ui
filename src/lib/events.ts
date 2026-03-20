/**
 * Unified Event Model for Rondo UI.
 *
 * All surfaces (ACP panel, Execution Log, Calendar/Timeline) consume
 * events through a single normalizer pipeline so that sessions never
 * silently disappear between views.
 */

import type { CronJob, CronRun, ACPSession } from "../types";

// ── Normalized status ──

export type EventStatus = "running" | "done" | "error" | "idle" | "scheduled";

// ── Discriminated union events ──

export interface CronEvent {
  id: string;
  source: "cron";
  title: string;
  status: EventStatus;
  startedAt: number;   // epoch ms
  endedAt: number;     // epoch ms
  updatedAt: number;
  meta: {
    run: CronRun;
    jobName: string;
  };
}

export interface AcpEvent {
  id: string;
  source: "acp";
  title: string;
  status: EventStatus;
  startedAt: number;
  endedAt: number;     // for running: Date.now()
  updatedAt: number;
  meta: {
    session: ACPSession;
  };
}

export type UnifiedEvent = CronEvent | AcpEvent;

// ── Status helpers (centralized) ──

export function statusDotClass(status: EventStatus): string {
  switch (status) {
    case "running": return "bg-success animate-pulse";
    case "done": return "bg-success";
    case "error": return "bg-error";
    case "scheduled": return "bg-info";
    case "idle":
    default: return "bg-gray-600";
  }
}

export function statusLabel(status: EventStatus): string {
  switch (status) {
    case "running": return "Running";
    case "done": return "Done";
    case "error": return "Error";
    case "scheduled": return "Scheduled";
    case "idle":
    default: return "Idle";
  }
}

export function cronEvClass(status: EventStatus): string {
  switch (status) {
    case "done": return "ev-ok";
    case "error": return "ev-error";
    case "running": return "ev-running";
    case "scheduled": return "ev-scheduled";
    default: return "ev-default";
  }
}

export function sessionBarClass(status: EventStatus): string {
  switch (status) {
    case "running": return "session-bar-running";
    case "error": return "session-bar-error";
    case "done": return "session-bar-done";
    case "scheduled": return "session-bar-scheduled";
    case "idle":
    default: return "session-bar-idle";
  }
}

// ── Normalizer ──

function normalizeCronStatus(raw: string): EventStatus {
  if (raw === "ok") return "done";
  if (raw === "error") return "error";
  if (raw === "running") return "running";
  if (raw === "scheduled") return "scheduled";
  return "idle";
}

function normalizeAcpStatus(raw?: string): EventStatus {
  if (!raw) return "idle";
  const s = raw.toLowerCase();
  if (s === "running" || s === "active") return "running";
  if (s === "done" || s === "completed") return "done";
  if (s === "error") return "error";
  return "idle";
}

export interface NormalizedEvents {
  /** Currently running events (for ACP panel + live indicators) */
  liveEvents: UnifiedEvent[];
  /** Completed/error/idle events for the execution log */
  historyEvents: UnifiedEvent[];
  /** All events with time intervals for the calendar */
  calendarEvents: UnifiedEvent[];
}

export function normalizeEvents(
  jobs: CronJob[],
  runs: CronRun[],
  sessions: ACPSession[],
): NormalizedEvents {
  const jobNameMap = new Map(jobs.map((j) => [j.id, j.name]));
  const nowMs = Date.now();

  // ── Cron events ──
  const cronEvents: CronEvent[] = runs.map((run) => {
    const endMs = new Date(run.timestamp).getTime();
    const dur = Math.max(run.duration_ms ?? 60_000, 1_000);
    const startMs = endMs - dur;
    const status = normalizeCronStatus(run.status);

    return {
      id: `cron-${run.id}`,
      source: "cron",
      title: jobNameMap.get(run.job_id) ?? run.job_id.slice(0, 8),
      status,
      startedAt: startMs,
      endedAt: endMs,
      updatedAt: endMs,
      meta: { run, jobName: jobNameMap.get(run.job_id) ?? run.job_id.slice(0, 8) },
    };
  });

  // ── ACP events ──
  const acpEvents: AcpEvent[] = sessions.map((s) => {
    const status = normalizeAcpStatus(s.status);
    const startMs = s.startedAt ?? s.updatedAt ?? 0;
    const endMs = status === "running" ? nowMs : (s.updatedAt ?? startMs);

    return {
      id: `acp-${s.key}`,
      source: "acp",
      title: s.label ?? s.key,
      status,
      startedAt: startMs,
      endedAt: endMs,
      updatedAt: s.updatedAt ?? startMs,
      meta: { session: s },
    };
  });

  const allEvents: UnifiedEvent[] = [...cronEvents, ...acpEvents];

  const liveEvents = allEvents
    .filter((e) => e.status === "running")
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const historyEvents = allEvents
    .filter((e) => e.status !== "running" && e.status !== "scheduled")
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // Calendar gets everything (including running, for live bars)
  const calendarEvents = allEvents
    .sort((a, b) => a.startedAt - b.startedAt);

  return { liveEvents, historyEvents, calendarEvents };
}
