import { useState } from "react";
import { useJobs, useRuns, useStats, useSessions, isConfigured } from "./hooks/useSupabase";
import { Stats } from "./components/Stats";
import { Timeline } from "./components/Timeline";
import { ExecutionLog } from "./components/ExecutionLog";
import { JobList } from "./components/JobList";
import { ACPSessions } from "./components/ACPSessions";

function RondoLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <circle cx="14" cy="14" r="13" stroke="url(#logo-grad)" strokeWidth="2" fill="none" opacity="0.5" />
        <circle cx="11" cy="18" r="4.5" fill="url(#logo-grad)" />
        <rect x="15" y="5" width="2.2" height="14" rx="1.1" fill="url(#logo-grad)" />
        <path d="M15 5 C15 5, 22 4, 21 9 C20 13, 17 11, 17.2 9" fill="url(#logo-grad)" opacity="0.7" />
        <defs>
          <linearGradient id="logo-grad" x1="4" y1="4" x2="24" y2="24">
            <stop stopColor="#9B8FFF" />
            <stop offset="1" stopColor="#5E50CC" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col">
        <span className="text-[15px] font-semibold tracking-tight text-gray-100 leading-none">Rondo</span>
        <span className="text-[10px] tracking-widest text-gray-600 uppercase mt-0.5">Cron Dashboard</span>
      </div>
    </div>
  );
}

export function App() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "jobs">("calendar");
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs();
  const { runs, loading: runsLoading, error: runsError } = useRuns(undefined, 200);
  const { sessions } = useSessions();
  const stats = useStats(jobs, runs);

  if (!isConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <RondoLogo />
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Connect to your database to start monitoring cron jobs.
          </p>
          <div className="text-left rounded-lg border border-border bg-surface-card p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">Required environment variables</p>
            <code className="block text-xs text-accent/80 bg-surface-raised/50 rounded px-2 py-1.5 font-mono">VITE_SUPABASE_URL</code>
            <code className="block text-xs text-accent/80 bg-surface-raised/50 rounded px-2 py-1.5 font-mono">VITE_SUPABASE_ANON_KEY</code>
          </div>
        </div>
      </div>
    );
  }

  const loading = jobsLoading || runsLoading;
  const error = jobsError || runsError;

  return (
    <div className="h-screen flex flex-col pb-14 md:pb-0 overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-surface z-30 shrink-0">
        <div className="flex items-center justify-between px-4 md:px-6 py-2">
          <RondoLogo />
          <div className="hidden md:flex items-center gap-3">
            <div className="seg-control">
              <button
                onClick={() => setActiveTab("calendar")}
                className={activeTab === "calendar" ? "seg-btn-active" : "seg-btn"}
              >
                Calendar
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={activeTab === "jobs" ? "seg-btn-active" : "seg-btn"}
              >
                Jobs
              </button>
            </div>
            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Syncing
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1.5 text-xs text-rose-400/80">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Sync issue
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {loading && runs.length === 0 ? (
          <div className="flex-1 flex flex-col gap-4 p-6 animate-fade-in">
            <div className="flex gap-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="skeleton h-8 flex-1" />
              ))}
            </div>
            <div className="flex-1 flex gap-3">
              <div className="skeleton w-10 h-full" />
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="skeleton flex-1 h-full" />
              ))}
            </div>
          </div>
        ) : activeTab === "calendar" ? (
          <Timeline runs={runs} jobs={jobs} sessions={sessions} />
        ) : (
          <div className="px-4 md:px-6 py-5 space-y-5 max-w-[1400px] mx-auto overflow-auto flex-1">
            {/* Stats summary */}
            <Stats stats={stats} />

            {/* Job list + ACP Sessions side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Cron Jobs</h2>
                <JobList jobs={jobs} selectedJobId={selectedJobId} onSelect={setSelectedJobId} />
              </div>
              <div>
                <ACPSessions />
              </div>
            </div>

            {/* Execution log below */}
            <div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Execution Log</h2>
              <ExecutionLog runs={runs} jobs={jobs} selectedJobId={selectedJobId} />
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border bg-surface/95 backdrop-blur-lg">
        <div className="flex">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              activeTab === "calendar" ? "text-accent" : "text-gray-600"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              activeTab === "jobs" ? "text-accent" : "text-gray-600"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Jobs
          </button>
        </div>
      </nav>
    </div>
  );
}
