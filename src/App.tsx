import { useState } from "react";
import { useJobs, useRuns, useStats, isConfigured } from "./hooks/useSupabase";
import { Stats } from "./components/Stats";
import { JobList } from "./components/JobList";
import { Timeline } from "./components/Timeline";
import { ExecutionLog } from "./components/ExecutionLog";

export function App() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();
  const { runs, loading: runsLoading, error: runsError } = useRuns(undefined, 200);
  const stats = useStats(jobs, runs);

  if (!isConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">🎵 Rondo</h1>
          <p className="text-gray-400 mb-4">
            Supabase not configured. Set{" "}
            <code className="text-accent">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-accent">VITE_SUPABASE_ANON_KEY</code> in your
            environment.
          </p>
          <p className="text-xs text-gray-600">
            See{" "}
            <a
              href="https://github.com/dion-jy/rondo"
              className="text-accent hover:underline"
            >
              rondo plugin docs
            </a>{" "}
            for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  const loading = jobsLoading || runsLoading;
  const error = jobsError || runsError;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">🎵 Rondo</h1>
            <span className="text-xs text-gray-500">Cron Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-gray-500 animate-pulse">
                Syncing...
              </span>
            )}
            {error && (
              <span className="text-xs text-red-400" title={error}>
                ⚠ Error
              </span>
            )}
            <span className="text-xs text-gray-600">
              {jobs.length} jobs · {runs.length} runs
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats row */}
        <Stats stats={stats} />

        {/* Timeline */}
        <Timeline runs={runs} jobs={jobs} />

        {/* Two-column layout: Jobs + Execution Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">🎯 Jobs</h2>
            <JobList
              jobs={jobs}
              selectedJobId={selectedJobId}
              onSelect={setSelectedJobId}
            />
          </div>
          <ExecutionLog
            runs={runs}
            jobs={jobs}
            selectedJobId={selectedJobId}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-3 text-center text-xs text-gray-600">
        Rondo — powered by{" "}
        <a href="https://openclaw.ai" className="text-accent hover:underline">
          OpenClaw
        </a>
      </footer>
    </div>
  );
}
