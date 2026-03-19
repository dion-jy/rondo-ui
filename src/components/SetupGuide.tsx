import { useState, useCallback } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium rounded bg-surface-raised/80 text-gray-400 hover:text-gray-200 hover:bg-surface-raised transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-lg border border-border bg-surface/80 overflow-hidden">
      {language && (
        <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-600 border-b border-border bg-surface-card/50">
          {language}
        </div>
      )}
      <CopyButton text={code} />
      <pre className="p-3 pr-16 overflow-x-auto text-[13px] leading-relaxed font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-bold shrink-0" style={{
      background: "rgb(var(--rondo-iris-rgb) / 0.15)",
      color: "var(--rondo-iris-light)",
      border: "1px solid rgb(var(--rondo-iris-rgb) / 0.3)",
    }}>
      {n}
    </span>
  );
}

const SQL_SCHEMA = `-- Rondo: Supabase Schema
-- Run this in your Supabase SQL Editor

-- cron_jobs
CREATE TABLE IF NOT EXISTS cron_jobs (
  id                TEXT NOT NULL,
  instance_id       TEXT NOT NULL,
  user_id           TEXT,
  name              TEXT NOT NULL,
  agent_id          TEXT,
  enabled           BOOLEAN NOT NULL DEFAULT true,
  schedule_kind     TEXT,
  schedule_every_ms BIGINT,
  schedule_expr     TEXT,
  schedule_at       TEXT,
  session_target    TEXT,
  wake_mode         TEXT,
  delete_after_run  BOOLEAN NOT NULL DEFAULT false,
  delivery_mode     TEXT,
  delivery_channel  TEXT,
  payload_model     TEXT,
  payload_thinking  TEXT,
  timeout_seconds   INTEGER,
  next_run_at       TIMESTAMPTZ,
  last_run_at       TIMESTAMPTZ,
  last_status       TEXT,
  last_duration_ms  INTEGER,
  last_error        TEXT,
  consecutive_errors INTEGER NOT NULL DEFAULT 0,
  is_running        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_cron_jobs_instance ON cron_jobs (instance_id);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_user ON cron_jobs (user_id);

-- cron_runs
CREATE TABLE IF NOT EXISTS cron_runs (
  id                TEXT NOT NULL,
  instance_id       TEXT NOT NULL,
  user_id           TEXT,
  job_id            TEXT NOT NULL,
  timestamp         TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL,
  action            TEXT,
  summary           TEXT,
  error             TEXT,
  duration_ms       INTEGER,
  model             TEXT,
  provider          TEXT,
  session_id        TEXT,
  delivered         BOOLEAN,
  delivery_status   TEXT,
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  total_tokens      INTEGER,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_instance ON cron_runs (instance_id);
CREATE INDEX IF NOT EXISTS idx_cron_runs_job ON cron_runs (instance_id, job_id);
CREATE INDEX IF NOT EXISTS idx_cron_runs_timestamp ON cron_runs (instance_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cron_runs_user ON cron_runs (user_id);

-- acp_sessions
CREATE TABLE IF NOT EXISTS acp_sessions (
  id                TEXT PRIMARY KEY,
  user_id           TEXT,
  agent_id          TEXT,
  status            TEXT NOT NULL DEFAULT 'running',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at          TIMESTAMPTZ,
  model             TEXT,
  input_tokens      INTEGER,
  output_tokens     INTEGER,
  total_tokens      INTEGER,
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acp_sessions_user ON acp_sessions (user_id);

-- RLS
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE acp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to cron_jobs" ON cron_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cron_runs" ON cron_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to acp_sessions" ON acp_sessions FOR ALL USING (true) WITH CHECK (true);`;

const PLUGIN_CONFIG = `{
  "extensions": {
    "rondo": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseKey": "your-anon-key",
      "syncIntervalMs": 30000,
      "userId": "your-unique-user-id"
    }
  }
}`;

export function SetupGuide({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-accent transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">Setup Guide</h1>
          <p className="text-sm text-gray-500 mt-1">
            Get Rondo running with your OpenClaw instance in a few steps.
          </p>
        </div>

        {/* Step 1 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={1} />
            <h2 className="text-base font-semibold text-gray-200">Install the Rondo Plugin</h2>
          </div>
          <div className="pl-10 space-y-3">
            <p className="text-sm text-gray-400">Install the plugin package:</p>
            <CodeBlock language="bash" code="npm install @openclaw/rondo" />
            <p className="text-sm text-gray-400">
              Then add <code className="text-accent/80 text-[13px] font-mono bg-surface-raised/50 px-1.5 py-0.5 rounded">rondo</code> to
              your <code className="text-accent/80 text-[13px] font-mono bg-surface-raised/50 px-1.5 py-0.5 rounded">openclaw.json</code> extensions
              array.
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={2} />
            <h2 className="text-base font-semibold text-gray-200">Supabase Setup</h2>
          </div>
          <div className="pl-10 space-y-3">
            <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>Create a new <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Supabase project</a></li>
              <li>Open the SQL Editor and run the schema below</li>
              <li>Go to Settings &rarr; API to get your <strong className="text-gray-300">Project URL</strong> and <strong className="text-gray-300">anon key</strong></li>
            </ol>
            <CodeBlock language="sql" code={SQL_SCHEMA} />
          </div>
        </section>

        {/* Step 3 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={3} />
            <h2 className="text-base font-semibold text-gray-200">Plugin Config</h2>
          </div>
          <div className="pl-10 space-y-3">
            <p className="text-sm text-gray-400">
              Add the Rondo config to your <code className="text-accent/80 text-[13px] font-mono bg-surface-raised/50 px-1.5 py-0.5 rounded">openclaw.json</code>:
            </p>
            <CodeBlock language="json" code={PLUGIN_CONFIG} />
            <div className="text-[12px] text-gray-500 space-y-1">
              <p><strong className="text-gray-400">supabaseUrl</strong> &mdash; your Supabase project URL</p>
              <p><strong className="text-gray-400">supabaseKey</strong> &mdash; your Supabase anon key</p>
              <p><strong className="text-gray-400">syncIntervalMs</strong> &mdash; sync frequency in ms (default: 300000)</p>
              <p><strong className="text-gray-400">userId</strong> &mdash; optional unique ID to tag your data for multi-user setups</p>
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={4} />
            <h2 className="text-base font-semibold text-gray-200">Deploy Rondo UI</h2>
          </div>
          <div className="pl-10 space-y-3">
            <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>Fork the <strong className="text-gray-300">rondo-ui</strong> repo</li>
              <li>Import the repo on <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Vercel</a></li>
              <li>Set environment variables in Vercel project settings:</li>
            </ol>
            <CodeBlock language="bash" code={`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`} />
            <p className="text-sm text-gray-400">Deploy and your dashboard is live.</p>
          </div>
        </section>

        {/* Step 5 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={5} />
            <h2 className="text-base font-semibold text-gray-200">Google SSO (Optional)</h2>
          </div>
          <div className="pl-10 space-y-3">
            <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>In Supabase dashboard, go to <strong className="text-gray-300">Auth &rarr; Providers &rarr; Google</strong></li>
              <li>Create OAuth credentials in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Cloud Console</a></li>
              <li>Add your Client ID and Secret to Supabase</li>
              <li>Set the redirect URL from Supabase in your Google OAuth config</li>
            </ol>
          </div>
        </section>

        {/* Step 6 */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={6} />
            <h2 className="text-base font-semibold text-gray-200">Verify</h2>
          </div>
          <div className="pl-10 space-y-3">
            <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
              <li>Restart the OpenClaw gateway</li>
              <li>Check sync logs for successful data push</li>
              <li>Open Rondo UI and confirm your cron jobs appear</li>
            </ol>
            <div className="rounded-lg border border-border bg-surface-card/30 p-3 text-[12px] text-gray-500">
              <strong className="text-gray-400">Troubleshooting:</strong> If data doesn't appear, check that your Supabase URL and key are correct
              in both <code className="font-mono text-accent/60">openclaw.json</code> (plugin) and Vercel env vars (UI).
              The plugin syncs on the configured interval — trigger a manual sync from the dashboard header to test immediately.
            </div>
          </div>
        </section>

        <div className="h-8" />
      </div>
    </div>
  );
}
