import type { CronJob } from "../types";

interface JobListProps {
  jobs: CronJob[];
  selectedJobId: string | null;
  onSelect: (jobId: string | null) => void;
}

function formatSchedule(job: CronJob): string {
  if (!job.schedule_kind) return "\u2014";
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

function statusIndicator(job: CronJob) {
  if (job.is_running) return { dot: "bg-info animate-pulse", label: "Running" };
  if (!job.enabled) return { dot: "bg-gray-600", label: "Disabled" };
  if (job.last_status === "ok") return { dot: "bg-success", label: "OK" };
  if (job.last_status === "error") return { dot: "bg-error", label: "Error" };
  return { dot: "bg-gray-600", label: "\u2014" };
}

export function JobList({ jobs, selectedJobId, onSelect }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-card/40 text-center py-10 px-4">
        <p className="text-sm text-gray-400">No jobs synced yet</p>
        <p className="text-[10px] text-gray-600 mt-1">Data will appear after the first sync cycle</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface-card/30 divide-y divide-border overflow-hidden">
      {jobs.map((job) => {
        const isSelected = selectedJobId === job.id;
        const status = statusIndicator(job);

        return (
          <button
            key={job.id}
            onClick={() => onSelect(isSelected ? null : job.id)}
            className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-hover ${
              isSelected ? "bg-surface-hover" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Status dot */}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />

              {/* Job info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-200 truncate text-[13px]">{job.name}</h3>
                  <span className="text-[10px] text-gray-600 font-mono flex-shrink-0">{formatSchedule(job)}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-600">
                  <span>Last: {formatTimeAgo(job.last_run_at)}</span>
                  {job.payload_model && <span className="hidden sm:inline">{job.payload_model}</span>}
                  {job.consecutive_errors > 0 && (
                    <span className="text-error/80">{job.consecutive_errors} err</span>
                  )}
                </div>
              </div>

              {/* Duration */}
              {job.last_duration_ms != null && (
                <span className="text-[11px] text-gray-600 whitespace-nowrap tabular-nums flex-shrink-0">
                  {(job.last_duration_ms / 1000).toFixed(0)}s
                </span>
              )}
            </div>

            {/* Expanded error */}
            {isSelected && job.last_error && (
              <div className="mt-2.5 ml-5 p-2.5 bg-error/10 rounded-md border border-error/10 text-[11px] text-error/80 break-all animate-fade-in leading-relaxed">
                {job.last_error}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
