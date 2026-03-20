import { useMemo, useState } from "react";
import type { ACPSession } from "../types";

function timeAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export function AcpLiveFloating({ sessions }: { sessions: ACPSession[] }) {
  const [open, setOpen] = useState(false);
  const running = useMemo(
    () => sessions.filter((s) => s.status === "running" || s.status === "active").slice(0, 5),
    [sessions]
  );

  if (!open && running.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-20 md:bottom-4 z-50">
      {open && (
        <div className="mb-2 w-72 rounded-xl border border-border bg-surface-card shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs text-gray-400">Running ACP Sessions</div>
          <div className="max-h-64 overflow-y-auto">
            {running.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-500">No running sessions</div>
            ) : (
              running.map((s) => (
                <div key={s.key} className="px-3 py-2 border-b border-border/50 last:border-b-0">
                  <div className="text-sm text-gray-200 truncate">{s.label ?? s.key}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{timeAgo(s.updatedAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full bg-accent text-black font-semibold shadow-lg flex items-center justify-center"
        title="ACP live"
      >
        {running.length}
      </button>
    </div>
  );
}
