import { useEffect, useRef, useState } from "react";
import { themes } from "../themes";
import { useTheme } from "./ThemeProvider";
import {
  getNotificationPermission,
  requestNotificationPermission,
  fireTestNotification,
} from "../lib/notifications";

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">(getNotificationPermission);
  const [testFired, setTestFired] = useState(false);

  // Refresh permission state when modal opens
  useEffect(() => {
    if (open) setNotifPerm(getNotificationPermission());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={ref}
        className="w-full max-w-md mx-4 rounded-xl border border-border bg-[var(--rondo-surface)] shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-gray-200 tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notifications */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Notifications</p>

          {notifPerm === "unsupported" && (
            <div className="rounded-lg bg-surface-raised/50 px-3 py-2.5 text-[12px] text-gray-500">
              이 브라우저는 알림을 지원하지 않습니다.
            </div>
          )}

          {notifPerm === "default" && (
            <div className="space-y-2">
              <div className="rounded-lg bg-accent/5 border border-accent/20 px-3 py-2.5 text-[12px] text-gray-400 leading-relaxed">
                알림을 허용하면 ACP 완료/에러 시 즉시 heads-up 알림을 받을 수 있습니다.
              </div>
              <button
                onClick={async () => {
                  const result = await requestNotificationPermission();
                  setNotifPerm(result);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                알림 허용하기
              </button>
            </div>
          )}

          {notifPerm === "denied" && (
            <div className="rounded-lg bg-error/5 border border-error/20 px-3 py-2.5 text-[12px] text-gray-400 leading-relaxed">
              <p className="text-error/80 font-medium mb-1">알림이 차단되어 있습니다</p>
              <p className="text-gray-500">브라우저 설정 → 사이트 설정 → 알림에서 이 사이트를 "허용"으로 변경해 주세요.</p>
            </div>
          )}

          {notifPerm === "granted" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/20 px-3 py-2 text-[12px] text-success/80">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                알림 활성 — ACP 이벤트 시 heads-up 알림을 수신합니다.
              </div>

              {/* Notification options info */}
              <div className="rounded-lg bg-surface-raised/30 px-3 py-2.5 text-[11px] text-gray-500 space-y-1">
                <p className="text-gray-400 font-medium">적용된 알림 옵션:</p>
                <p>• requireInteraction: 에러 알림은 직접 닫을 때까지 유지</p>
                <p>• renotify: 에러 미확인 시 1분 후 1회 재알림</p>
                <p>• vibrate: 진동 패턴 (일반: 짧게, 에러: 길게)</p>
                <p>• tag: 동일 이벤트 중복 방지</p>
              </div>

              {/* Test button */}
              <button
                onClick={() => {
                  fireTestNotification();
                  setTestFired(true);
                  setTimeout(() => setTestFired(false), 3000);
                }}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-colors ${
                  testFired
                    ? "text-success bg-success/10 border border-success/20"
                    : "text-gray-300 bg-white/5 hover:bg-white/10 border border-border"
                }`}
              >
                {testFired ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    전송됨!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    Test Heads-up
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Theme picker */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Theme</p>
          <div className="grid grid-cols-1 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                  theme === t.id
                    ? "border-[var(--rondo-iris)] bg-[var(--rondo-iris)]/8"
                    : "border-transparent hover:border-[var(--rondo-iris)]/20 hover:bg-white/[0.02]"
                }`}
              >
                {/* Swatches */}
                <div className="flex gap-1 shrink-0">
                  {t.swatches.map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                {/* Label */}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-200 leading-tight">{t.name}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{t.label}</p>
                </div>
                {/* Check */}
                {theme === t.id && (
                  <svg className="w-4 h-4 ml-auto text-[var(--rondo-iris)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
