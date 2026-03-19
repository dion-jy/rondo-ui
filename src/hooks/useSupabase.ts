import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";
import type { CronJob, CronRun, ACPSession } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

// ── useJobs ──

export function useJobs(refreshIntervalMs = 30_000) {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    const client = getClient();
    if (!client) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await client
        .from("cron_jobs")
        .select("*")
        .order("name");

      if (err) throw err;
      setJobs(data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    timerRef.current = setInterval(fetchJobs, refreshIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchJobs, refreshIntervalMs]);

  return { jobs, loading, error, refetch: fetchJobs };
}

// ── useRuns ──

export function useRuns(jobId?: string, limit = 50) {
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    const client = getClient();
    if (!client) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    try {
      let query = client
        .from("cron_runs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (jobId) {
        query = query.eq("job_id", jobId);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setRuns(data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [jobId, limit]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return { runs, loading, error, refetch: fetchRuns };
}

// ── useStats ──

export interface CronStats {
  totalJobs: number;
  activeJobs: number;
  totalRuns: number;
  successRate: number;
  totalTokens: number;
  runningNow: number;
}

export function useStats(jobs: CronJob[], runs: CronRun[]): CronStats {
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.enabled).length;
  const totalRuns = runs.length;
  const successfulRuns = runs.filter((r) => r.status === "ok").length;
  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
  const totalTokens = runs.reduce((acc, r) => acc + (r.total_tokens ?? 0), 0);
  const runningNow = jobs.filter((j) => j.is_running).length;

  return { totalJobs, activeJobs, totalRuns, successRate, totalTokens, runningNow };
}

// ── useSessions ──

const FAST_POLL_MS = 10_000;
const SLOW_POLL_MS = 30_000;

export function useSessions(refreshIntervalMs = SLOW_POLL_MS) {
  const [sessions, setSessions] = useState<ACPSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIntervalRef = useRef(refreshIntervalMs);

  const fetchSessions = useCallback(async () => {
    const client = getClient();
    if (!client) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await client
        .from("acp_sessions")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (err) throw err;

      const mapped: ACPSession[] = (data ?? []).map((row: any) => ({
        key: row.key,
        label: row.label ?? undefined,
        agent: row.agent ?? undefined,
        model: row.model ?? undefined,
        status: row.status ?? undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
        startedAt: row.started_at ? new Date(row.started_at).getTime() : undefined,
        summary: row.summary ?? undefined,
        tokens: row.tokens ?? undefined,
        duration: row.duration_ms
          ? formatDuration(row.duration_ms)
          : undefined,
      }));

      setSessions(mapped);
      setError(null);

      // Adaptive polling: faster when sessions are running
      const hasRunning = mapped.some(
        (s) => s.status === "running" || s.status === "active"
      );
      const desiredInterval = hasRunning ? FAST_POLL_MS : refreshIntervalMs;
      if (desiredInterval !== currentIntervalRef.current) {
        currentIntervalRef.current = desiredInterval;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(fetchSessions, desiredInterval);
      }
    } catch (err) {
      setSessions([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [refreshIntervalMs]);

  useEffect(() => {
    fetchSessions();
    timerRef.current = setInterval(fetchSessions, refreshIntervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchSessions, refreshIntervalMs]);

  return { sessions, loading, error, refetch: fetchSessions };
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function isConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
