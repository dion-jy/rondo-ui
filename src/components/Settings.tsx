import { useEffect, useRef } from "react";
import { themes } from "../themes";
import { useTheme } from "./ThemeProvider";

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

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
        className="w-full max-w-md mx-4 rounded-xl border border-border bg-[var(--rondo-surface)] shadow-2xl animate-slide-up"
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
