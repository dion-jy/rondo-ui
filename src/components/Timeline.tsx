import { useMemo } from "react";
import type { CronRun, CronJob } from "../types";

interface TimelineProps {
  runs: CronRun[];
  jobs: CronJob[];
}

const HOUR_WIDTH = 60; // px per hour
const ROW_HEIGHT = 36;
const HOURS = 24;

function getJobColor(index: number): string {
  const colors = [
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-lime-500",
  ];
  return colors[index % colors.length];
}

export function Timeline({ runs, jobs }: TimelineProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayRuns = useMemo(
    () =>
      runs.filter((r) => {
        const ts = new Date(r.timestamp);
        return ts >= today && ts < new Date(today.getTime() + 86_400_000);
      }),
    [runs, today]
  );

  // Group runs by job
  const jobMap = useMemo(() => {
    const map = new Map<string, { job: CronJob | undefined; runs: CronRun[] }>();
    for (const run of todayRuns) {
      if (!map.has(run.job_id)) {
        map.set(run.job_id, {
          job: jobs.find((j) => j.id === run.job_id),
          runs: [],
        });
      }
      map.get(run.job_id)!.runs.push(run);
    }
    return map;
  }, [todayRuns, jobs]);

  const lanes = useMemo(() => Array.from(jobMap.entries()), [jobMap]);
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;

  if (lanes.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-8">
        <p>No runs today yet</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">📅 Today&apos;s Timeline</h2>
      <div className="relative" style={{ minWidth: HOURS * HOUR_WIDTH + 120 }}>
        {/* Hour markers */}
        <div className="flex border-b border-gray-800 pb-1 mb-2 pl-[120px]">
          {Array.from({ length: HOURS }, (_, i) => (
            <div
              key={i}
              className="text-xs text-gray-600 flex-shrink-0"
              style={{ width: HOUR_WIDTH }}
            >
              {String(i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Swim lanes */}
        {lanes.map(([jobId, { job, runs: jobRuns }], laneIndex) => (
          <div
            key={jobId}
            className="flex items-center border-b border-gray-800/50"
            style={{ height: ROW_HEIGHT }}
          >
            <div className="w-[120px] flex-shrink-0 text-xs text-gray-400 truncate pr-2">
              {job?.name ?? jobId.slice(0, 8)}
            </div>
            <div className="relative flex-1" style={{ height: ROW_HEIGHT }}>
              {jobRuns.map((run) => {
                const ts = new Date(run.timestamp);
                const startHour =
                  ts.getHours() +
                  ts.getMinutes() / 60 -
                  (run.duration_ms ? run.duration_ms / 3_600_000 : 0);
                const durationHours = run.duration_ms
                  ? run.duration_ms / 3_600_000
                  : 0.05;

                return (
                  <div
                    key={run.id}
                    className={`timeline-bar ${getJobColor(laneIndex)} ${
                      run.status === "error" ? "opacity-50 border border-red-500" : "opacity-80"
                    }`}
                    style={{
                      left: Math.max(0, startHour) * HOUR_WIDTH,
                      width: Math.max(4, durationHours * HOUR_WIDTH),
                      top: 4,
                      height: ROW_HEIGHT - 8,
                    }}
                    title={`${job?.name ?? jobId}\n${run.status} — ${run.duration_ms ? (run.duration_ms / 1000).toFixed(0) + "s" : "—"}\n${new Date(run.timestamp).toLocaleTimeString()}`}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Now line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
          style={{ left: 120 + nowHour * HOUR_WIDTH }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}
