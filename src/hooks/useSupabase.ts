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

function parseDurationToMs(dur?: string): number {
  if (!dur) return 0;
  let ms = 0;
  const h = dur.match(/(\d+)\s*h/);
  const m = dur.match(/(\d+)\s*m(?:in)?/);
  const s = dur.match(/(\d+)\s*s/);
  if (h) ms += Number(h[1]) * 3_600_000;
  if (m) ms += Number(m[1]) * 60_000;
  if (s) ms += Number(s[1]) * 1_000;
  return ms;
}

export function useSessions(refreshIntervalMs = 30_000) {
  const [sessions, setSessions] = useState<ACPSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.includes("application/json")) {
        throw new Error("sessions_api_unavailable");
      }
      const data = await res.json();
      const raw: ACPSession[] = Array.isArray(data) ? data : data.sessions ?? [];

      // Compute startedAt from updatedAt - duration if missing
      const enriched = raw.map((s) => {
        if (s.startedAt) return s;
        const durMs = parseDurationToMs(s.duration);
        const updated = s.updatedAt ?? Date.now();
        return { ...s, startedAt: durMs > 0 ? updated - durMs : updated };
      });

      setSessions(enriched);
      setError(null);
    } catch {
      setSessions([]);
      setError("sessions_api_unavailable");
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const t = setInterval(fetchSessions, refreshIntervalMs);
    return () => clearInterval(t);
  }, [fetchSessions, refreshIntervalMs]);

  return { sessions, error };
}

export function isConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
