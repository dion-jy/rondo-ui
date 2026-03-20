import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";
import { useDeviceLinked } from "../hooks/useSupabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://rondo-ui.vercel.app";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-[10px] font-medium rounded bg-surface-raised/80 text-gray-400 hover:text-gray-200 hover:bg-surface-raised transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="relative group rounded-lg border border-border bg-surface/80 overflow-hidden">
      {language && (
        <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-600 border-b border-border bg-surface-card/50">
          {language}
        </div>
      )}
      <CopyButton text={code} />
      <pre className="p-3 pr-16 overflow-x-auto text-[13px] leading-relaxed font-mono text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StepIndicator({ step, current, done }: { step: number; current: number; done: boolean }) {
  const isActive = step === current;
  const isCompleted = done || step < current;

  return (
    <div className="flex flex-col items-center">
      <span
        className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 ${
          isCompleted
            ? "bg-success/20 text-success border border-success/30"
            : isActive
            ? "scale-110 border"
            : "bg-surface-card text-gray-600 border border-border"
        }`}
        style={
          isActive && !isCompleted
            ? {
                background: "rgb(var(--rondo-iris-rgb) / 0.15)",
                color: "var(--rondo-iris-light)",
                borderColor: "rgb(var(--rondo-iris-rgb) / 0.3)",
              }
            : undefined
        }
      >
        {isCompleted ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          step
        )}
      </span>
    </div>
  );
}

function StepLine({ active }: { active: boolean }) {
  return (
    <div className={`flex-1 h-px mx-3 transition-colors duration-500 ${active ? "bg-success/40" : "bg-border"}`} />
  );
}

const INSTALL_CMD = `openclaw plugins install @dion-jy/rondo
openclaw gateway restart`;

export function SetupGuide({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { linked } = useDeviceLinked(user?.id);
  const [step, setStep] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const linkUrl = token ? `${appOrigin}/link?token=${token}` : "";
  const linkChatCmd = token ? `/rondo link ${linkUrl}` : "";
  const linkCliCmd = token ? `openclaw rondo link ${linkUrl}` : "";

  // Auto-detect linking from polling
  useEffect(() => {
    if (linked && step === 2 && !showSuccess) {
      setShowSuccess(true);
      setStep(3);
      redirectTimerRef.current = setTimeout(() => {
        onDone();
      }, 2500);
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [linked, step, showSuccess, onDone]);

  const generateLink = useCallback(async () => {
    if (!user || !supabaseUrl || !supabaseAnonKey) return;
    setGenerating(true);
    setTokenError(null);

    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session) {
        setTokenError("Not authenticated");
        setGenerating(false);
        return;
      }

      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      });

      const newToken = crypto.randomUUID();
      const { error: insertError } = await authClient.from("device_links").insert({ token: newToken, user_id: user.id });

      if (insertError) {
        setTokenError(insertError.message);
      } else {
        setToken(newToken);
        setStep(2);
      }
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full animate-fade-in">
        {/* Logo + Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="setup-logo-grad" x1="16" y1="28" x2="16" y2="4" gradientUnits="userSpaceOnUse">
                  <stop style={{ stopColor: "var(--rondo-iris-dim)" }} />
                  <stop offset="0.5" style={{ stopColor: "var(--rondo-iris)" }} />
                  <stop offset="1" style={{ stopColor: "var(--rondo-iris-light)" }} />
                </linearGradient>
              </defs>
              <ellipse cx="9.5" cy="23.5" rx="4.2" ry="3.2" transform="rotate(-15 9.5 23.5)" fill="url(#setup-logo-grad)" />
              <ellipse cx="22.5" cy="21.5" rx="4.2" ry="3.2" transform="rotate(-15 22.5 21.5)" fill="url(#setup-logo-grad)" />
              <rect x="12.5" y="5" width="2.2" height="19" rx="1.1" fill="url(#setup-logo-grad)" />
              <rect x="25.5" y="3" width="2.2" height="19" rx="1.1" fill="url(#setup-logo-grad)" />
              <rect x="12.5" y="4" width="15.2" height="2.8" rx="1.2" fill="url(#setup-logo-grad)" />
              <rect x="12.5" y="9.5" width="15.2" height="2.8" rx="1.2" fill="url(#setup-logo-grad)" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">Set Up Rondo</h1>
          <p className="text-sm text-gray-500 mt-1">Connect your device to start monitoring cron jobs.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-10 px-8">
          <StepIndicator step={1} current={step} done={step > 1} />
          <StepLine active={step > 1} />
          <StepIndicator step={2} current={step} done={step > 2} />
          <StepLine active={step > 2} />
          <StepIndicator step={3} current={step} done={showSuccess} />
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-border bg-surface-card p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-gray-200">Install the Plugin</h2>
                <p className="text-[13px] text-gray-500 mt-1">
                  Run these commands on your OpenClaw device to install the Rondo plugin.
                </p>
              </div>

              <CodeBlock language="bash" code={INSTALL_CMD} />

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-gray-600">
                  Already installed? Skip ahead.
                </p>
                <button
                  onClick={generateLink}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--rondo-iris-dim), var(--rondo-iris))",
                  }}
                >
                  {generating ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                  {generating ? "Generating..." : "Next: Generate Link"}
                </button>
              </div>

              {tokenError && <p className="text-[12px] text-error/80">{tokenError}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-gray-200">Link Your Device</h2>
                <p className="text-[13px] text-gray-500 mt-1">
                  Send this command in your OpenClaw chat to connect your device.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Via Chat (Telegram / WhatsApp)</p>
                  <CodeBlock code={linkChatCmd} />
                </div>

                <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Via Terminal</p>
                  <CodeBlock code={linkCliCmd} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[12px] text-warning/80">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expires in 5 minutes
              </div>

              {/* Waiting indicator */}
              <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-[13px] text-gray-300">Waiting for device link...</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    This page will update automatically when your device connects.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    setToken(null);
                    setTokenError(null);
                    setStep(1);
                  }}
                  className="text-[12px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={generateLink}
                  disabled={generating}
                  className="text-[12px] text-gray-500 hover:text-accent transition-colors"
                >
                  Generate new token
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-200">Connected!</h2>
                <p className="text-[13px] text-gray-500 mt-1">
                  Your device is linked. Redirecting to dashboard...
                </p>
              </div>
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full"
                  style={{ animation: "progress-fill 2.5s linear forwards" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Troubleshooting link at bottom */}
        {step !== 3 && (
          <p className="text-center text-[11px] text-gray-600 mt-6">
            Having trouble?{" "}
            <button
              onClick={() => {
                /* could open a help modal */
              }}
              className="text-accent/60 hover:text-accent transition-colors"
            >
              Troubleshooting tips
            </button>
          </p>
        )}
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
