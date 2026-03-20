import { useState, useCallback, useRef, useEffect } from "react";
import { useJobs, useRuns, useStats, useSessions, useDeviceLinked, isConfigured } from "./hooks/useSupabase";
import { useAuth } from "./hooks/useAuth";
import { Login } from "./components/Login";
import { Stats } from "./components/Stats";
import { Timeline } from "./components/Timeline";
import { ExecutionLog } from "./components/ExecutionLog";
import { JobList } from "./components/JobList";
import { ACPSessions } from "./components/ACPSessions";
import { Settings } from "./components/Settings";
import { SetupGuide } from "./components/SetupGuide";

function RondoLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <defs>
          <linearGradient id="logo-grad" x1="16" y1="28" x2="16" y2="4" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: "var(--rondo-iris-dim)" }} />
            <stop offset="0.5" style={{ stopColor: "var(--rondo-iris)" }} />
            <stop offset="1" style={{ stopColor: "var(--rondo-iris-light)" }} />
          </linearGradient>
        </defs>
        <ellipse cx="9.5" cy="23.5" rx="4.2" ry="3.2" transform="rotate(-15 9.5 23.5)" fill="url(#logo-grad)" />
        <ellipse cx="22.5" cy="21.5" rx="4.2" ry="3.2" transform="rotate(-15 22.5 21.5)" fill="url(#logo-grad)" />
        <rect x="12.5" y="5" width="2.2" height="19" rx="1.1" fill="url(#logo-grad)" />
        <rect x="25.5" y="3" width="2.2" height="19" rx="1.1" fill="url(#logo-grad)" />
        <rect x="12.5" y="4" width="15.2" height="2.8" rx="1.2" fill="url(#logo-grad)" />
        <rect x="12.5" y="9.5" width="15.2" height="2.8" rx="1.2" fill="url(#logo-grad)" />
      </svg>
      <div className="flex flex-col">
        <span className="text-[15px] font-semibold tracking-tight text-gray-100 leading-none">Rondo</span>
        <span className="text-[10px] tracking-widest text-gray-600 uppercase mt-0.5">Cron Dashboard</span>
      </div>
    </div>
  );
}

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || "http://192.168.0.130:18789";
const GATEWAY_TOKEN = import.meta.env.VITE_GATEWAY_TOKEN || "rondo-sync-2026";

function SyncButton({ onSynced }: { onSynced?: () => void }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handleSync = useCallback(async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      await fetch(`${GATEWAY_URL}/hooks/wake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({ text: "rondo sync trigger", mode: "now" }),
      });
    } catch {
      // fire-and-forget — gateway may not respond with CORS
    }
    // Wait 2s for sync to complete, then refetch
    setTimeout(() => {
      setState("done");
      onSynced?.();
      setTimeout(() => setState("idle"), 1500);
    }, 2000);
  }, [state, onSynced]);

  return (
    <button
      onClick={handleSync}
      disabled={state === "loading"}
      className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-gray-500 hover:text-accent hover:bg-accent/5 rounded-md transition-all disabled:opacity-50"
      title="Trigger gateway sync"
    >
      {state === "loading" ? (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : state === "done" ? (
        <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
      )}
      {state === "done" ? "Synced!" : "Sync"}
    </button>
  );
}

function AccountMenu({ email, avatarUrl, onSignOut, onSetup, onTheme }: { email: string; avatarUrl?: string; onSignOut: () => void; onSetup?: () => void; onTheme?: () => void }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-[11px] font-bold uppercase overflow-hidden"
        title={email}
      >
        {avatarUrl && !imgError ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} referrerPolicy="no-referrer" />
        ) : (
          email[0]
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg border border-border bg-surface-card shadow-xl z-50 py-1.5 animate-fade-in">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Signed in as</p>
            <p className="text-[12px] text-gray-300 truncate mt-0.5">{email}</p>
          </div>
          {onSetup && (
            <button
              onClick={() => { setOpen(false); onSetup(); }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 1115 0v7.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015.5 19.5V12z" />
              </svg>
              Sync Setup
            </button>
          )}
          {onTheme && (
            <button
              onClick={() => { setOpen(false); onTheme(); }}
              className="w-full text-left px-3 py-2 text-[12px] text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 1118.998 2.25a.75.75 0 01.824 1.079 7.5 7.5 0 001.928 11.673.75.75 0 01.0 0z" />
              </svg>
              Theme
            </button>
          )}
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="w-full text-left px-3 py-2 text-[12px] text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "jobs">("calendar");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState<"dashboard" | "setup">(() =>
    window.location.hash === "#/setup" ? "setup" : "dashboard"
  );

  // Sync hash with page state
  useEffect(() => {
    const onHashChange = () => {
      setPage(window.location.hash === "#/setup" ? "setup" : "dashboard");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigateTo = useCallback((target: "dashboard" | "setup") => {
    window.location.hash = target === "setup" ? "#/setup" : "";
    setPage(target);
  }, []);
  const { linked } = useDeviceLinked(user?.id);
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs(user?.id);
  const { runs, loading: runsLoading, error: runsError } = useRuns(user?.id, undefined, 200);
  const { sessions, refetch: refetchSessions } = useSessions(user?.id);
  const stats = useStats(jobs, runs);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated — show login
  if (!user) {
    return <Login />;
  }

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

  // Still checking device link status
  if (linked === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No linked device or explicit setup nav → full-screen setup wizard
  if (linked === false || page === "setup") {
    return <SetupGuide onDone={() => navigateTo("dashboard")} />;
  }

  const loading = jobsLoading || runsLoading;
  const error = jobsError || runsError;

  return (
    <div className="h-screen flex flex-col pb-14 md:pb-0 overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-surface z-30 shrink-0">
        <div className="flex items-center justify-between px-4 md:px-6 py-2">
          <RondoLogo />
          {/* Mobile: account menu */}
          <div className="md:hidden">
            <AccountMenu email={user.email ?? ""} avatarUrl={user.user_metadata?.avatar_url} onSignOut={signOut} onSetup={() => navigateTo("setup")} onTheme={() => setSettingsOpen(true)} />
          </div>
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
            <SyncButton onSynced={refetchSessions} />
            <div className="ml-2 pl-2 border-l border-border">
              <AccountMenu email={user.email ?? ""} avatarUrl={user.user_metadata?.avatar_url} onSignOut={signOut} onSetup={() => navigateTo("setup")} onTheme={() => setSettingsOpen(true)} />
            </div>
            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Syncing
              </span>
            )}
            {error && (
              <span className="flex items-center gap-1.5 text-xs text-error/80">
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
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
                <ACPSessions userId={user?.id} />
              </div>
            </div>

            {/* Execution log — cron runs + completed ACP sessions merged */}
            <ExecutionLog runs={runs} jobs={jobs} sessions={sessions} selectedJobId={selectedJobId} />
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

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
