import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";
import type { CronJob, CronRun } from "../types";

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
  const timerRef = useRef<ReturnType<typeof setInterval>>();

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
    return () => clearInterval(timerRef.current);
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

export function isConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}
