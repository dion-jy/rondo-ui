import type { CronJob } from "../types";

interface JobListProps {
  jobs: CronJob[];
  selectedJobId: string | null;
  onSelect: (jobId: string | null) => void;
}

function formatSchedule(job: CronJob): string {
  if (!job.schedule_kind) return "—";
  if (job.schedule_kind === "every" && job.schedule_every_ms) {
    const mins = Math.round(job.schedule_every_ms / 60_000);
    if (mins >= 1440) return `every ${Math.round(mins / 1440)}d`;
    if (mins >= 60) return `every ${Math.round(mins / 60)}h`;
    return `every ${mins}m`;
  }
  if (job.schedule_kind === "cron" && job.schedule_expr) {
    return job.schedule_expr;
  }
  if ((job.schedule_kind === "once" || job.schedule_kind === "at") && job.schedule_at) {
    return `once: ${new Date(job.schedule_at).toLocaleDateString()}`;
  }
  return job.schedule_kind;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusBadge(job: CronJob) {
  if (job.is_running) return <span className="badge badge-running">⚡ Running</span>;
  if (!job.enabled) return <span className="badge badge-disabled">Disabled</span>;
  if (job.last_status === "ok") return <span className="badge badge-ok">✓ OK</span>;
  if (job.last_status === "error") return <span className="badge badge-error">✗ Error</span>;
  return <span className="badge badge-disabled">—</span>;
}

export function JobList({ jobs, selectedJobId, onSelect }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-12">
        <p className="text-4xl mb-3">🎵</p>
        <p>No jobs synced yet</p>
        <p className="text-sm mt-1">Data will appear after the first sync cycle</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <button
          key={job.id}
          onClick={() => onSelect(selectedJobId === job.id ? null : job.id)}
          className={`card w-full text-left transition-all hover:border-accent/50 ${
            selectedJobId === job.id ? "border-accent ring-1 ring-accent/30" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-100 truncate">{job.name}</h3>
                {statusBadge(job)}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>🕐 {formatSchedule(job)}</span>
                <span>Last: {formatTimeAgo(job.last_run_at)}</span>
                {job.payload_model && (
                  <span className="text-gray-600">{job.payload_model}</span>
                )}
                {job.consecutive_errors > 0 && (
                  <span className="text-red-400">
                    {job.consecutive_errors} consecutive error{job.consecutive_errors > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            {job.last_duration_ms != null && (
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {(job.last_duration_ms / 1000).toFixed(0)}s
              </span>
            )}
          </div>
          {selectedJobId === job.id && job.last_error && (
            <div className="mt-3 p-3 bg-red-950/30 rounded-lg text-xs text-red-300 break-all">
              {job.last_error}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
