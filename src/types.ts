// ── Supabase row types (matching rondo plugin schema) ──

export interface CronJob {
  id: string;
  instance_id: string;
  name: string;
  agent_id: string | null;
  enabled: boolean;
  schedule_kind: string | null;
  schedule_every_ms: number | null;
  schedule_expr: string | null;
  schedule_at: string | null;
  session_target: string | null;
  wake_mode: string | null;
  delete_after_run: boolean;
  delivery_mode: string | null;
  delivery_channel: string | null;
  payload_model: string | null;
  payload_thinking: string | null;
  timeout_seconds: number | null;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  last_duration_ms: number | null;
  last_error: string | null;
  consecutive_errors: number;
  is_running: boolean;
  created_at: string | null;
  updated_at: string | null;
  synced_at: string;
  plugin_version?: string | null;
}

export interface CronRun {
  id: string;
  instance_id: string;
  job_id: string;
  timestamp: string;
  status: string;
  action: string | null;
  summary: string | null;
  error: string | null;
  duration_ms: number | null;
  model: string | null;
  provider: string | null;
  session_id: string | null;
  delivered: boolean | null;
  delivery_status: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  synced_at: string;
}

// ── ACP Session (from /api/sessions or ~/.openclaw/sessions.json) ──

export interface ACPSession {
  key: string;
  label?: string;
  agent?: string;
  model?: string;
  status?: string;          // running | idle | done | error
  updatedAt?: number;        // epoch ms
  startedAt?: number;        // epoch ms (computed if missing)
  summary?: string;
  tokens?: number;
  duration?: string;         // human-readable e.g. "2h 15m"
}
