import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ACPSession } from "../types";

// ── Browser Notification helpers ──

const notifiedKeys = new Set<string>();

function fireBrowserNotification(sessionKey: string, status: "done" | "error" | "running", label: string) {
  const dedupKey = `${sessionKey}:${status}`;
  if (notifiedKeys.has(dedupKey)) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  notifiedKeys.add(dedupKey);
  const body = status === "done" ? `[완료] ${label}` : status === "error" ? `[에러] ${label}` : `[시작] ${label}`;
  try {
    new Notification("Rondo ACP", { body, tag: dedupKey });
  } catch {
    // SW-only environment (mobile PWA) — fall back to service worker notification
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification("Rondo ACP", { body, tag: dedupKey }))
      .catch(() => {});
  }
}

function requestNotificationPermission() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function timeAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

interface Toast {
  id: string;
  label: string;
  kind: "done" | "error" | "start";
  ts: number;
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed right-4 bottom-36 md:bottom-20 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm animate-fade-in ${
            t.kind === "done"
              ? "bg-success/15 border border-success/30 text-success"
              : t.kind === "start"
              ? "bg-accent/15 border border-accent/30 text-accent"
              : "bg-error/15 border border-error/30 text-error"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.kind === "done" ? "bg-success" : t.kind === "start" ? "bg-accent" : "bg-error"}`} />
          <span className="truncate max-w-[200px]">
            {t.kind === "done" ? "[ACP 완료]" : t.kind === "start" ? "[ACP 시작]" : "[ACP 에러]"} {t.label}
          </span>
          <button onClick={() => onDismiss(t.id)} className="ml-1 text-gray-500 hover:text-gray-300 text-xs">✕</button>
        </div>
      ))}
    </div>
  );
}

export function AcpLiveFloating({ sessions }: { sessions: ACPSession[] }) {
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const running = useMemo(
    () => sessions.filter((s) => s.status === "running" || s.status === "active").slice(0, 5),
    [sessions]
  );

  // Detect running → done/error transitions
  useEffect(() => {
    const prev = prevStatusRef.current;
    const next = new Map<string, string>();

    for (const s of sessions) {
      const status = s.status ?? "idle";
      next.set(s.key, status);

      const prevStatus = prev.get(s.key);
      const lbl = s.label ?? s.key;

      // Detect new session starting (not previously tracked → running)
      if (!prevStatus && (status === "running" || status === "active")) {
        setToasts((ts) => [...ts, { id: `${s.key}-start-${Date.now()}`, label: lbl, kind: "start" as Toast["kind"], ts: Date.now() }]);
        fireBrowserNotification(s.key, "running", lbl);
      }

      // Detect running → done/error transitions
      if (prevStatus && (prevStatus === "running" || prevStatus === "active")) {
        if (status === "done" || status === "completed") {
          setToasts((ts) => [...ts, { id: `${s.key}-${Date.now()}`, label: lbl, kind: "done", ts: Date.now() }]);
          fireBrowserNotification(s.key, "done", lbl);
        } else if (status === "error") {
          setToasts((ts) => [...ts, { id: `${s.key}-${Date.now()}`, label: lbl, kind: "error", ts: Date.now() }]);
          fireBrowserNotification(s.key, "error", lbl);
        }
      }
    }

    prevStatusRef.current = next;
  }, [sessions]);

  // Auto-dismiss toasts after 5s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setToasts((ts) => ts.filter((t) => now - t.ts < 5000));
    }, 1000);
    return () => clearInterval(timer);
  }, [toasts.length]);

  const dismissToast = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
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
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
                        <span className="text-sm text-gray-200 truncate">{s.label ?? s.key}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 pl-3.5">{timeAgo(s.updatedAt)}</div>
                    </div>
                  ))
                )}
              </div>
              {/* Notification permission bar */}
              {notifPerm === "default" && (
                <button
                  onClick={() => {
                    requestNotificationPermission();
                    // Re-check after a short delay (permission dialog is async)
                    setTimeout(() => {
                      setNotifPerm(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
                    }, 500);
                  }}
                  className="w-full px-3 py-2 text-[11px] text-accent hover:bg-accent/10 border-t border-border transition-colors text-left"
                >
                  🔔 알림 허용 — ACP 완료/에러 시 브라우저 알림
                </button>
              )}
              {notifPerm === "denied" && (
                <div className="px-3 py-1.5 text-[10px] text-gray-500 border-t border-border">
                  브라우저 알림 차단됨 — 설정에서 허용 가능
                </div>
              )}
              {notifPerm === "granted" && (
                <div className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-border">
                  🔔 브라우저 알림 활성
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className={`w-12 h-12 rounded-full text-black font-semibold shadow-lg flex items-center justify-center relative transition-opacity ${running.length > 0 ? "bg-accent opacity-100" : "bg-gray-500 opacity-60"}`}
            title="ACP live"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            {running.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                {running.length}
              </span>
            )}
          </button>
        </div>
    </>
  );
}
