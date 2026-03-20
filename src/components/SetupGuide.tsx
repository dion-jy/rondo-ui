import { useState, useCallback } from "react";

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

function StepNumber({ n, active }: { n: number; active?: boolean }) {
  return (
    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-bold shrink-0 transition-all ${
      active ? "scale-110" : ""
    }`} style={{
      background: "rgb(var(--rondo-iris-rgb) / 0.15)",
      color: "var(--rondo-iris-light)",
      border: "1px solid rgb(var(--rondo-iris-rgb) / 0.3)",
    }}>
      {n}
    </span>
  );
}

function StepConnector() {
  return (
    <div className="ml-[15px] w-px h-4 bg-border" />
  );
}

const INSTALL_CMD = `openclaw plugins install @dion-jy/rondo
openclaw gateway restart`;

const LINK_CHAT_CMD = `/rondo link <URL>`;
const LINK_CLI_CMD = `openclaw rondo link <URL>`;

export function SetupGuide({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-0 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-accent transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">Setup Guide</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect your OpenClaw instance to Rondo in 5 steps.
          </p>
        </div>

        {/* Step 1 — Install */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={1} />
            <div>
              <h2 className="text-base font-semibold text-gray-200">Install the Plugin</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">Run these two commands on your device.</p>
            </div>
          </div>
          <div className="pl-11 space-y-3">
            <CodeBlock language="bash" code={INSTALL_CMD} />
          </div>
        </section>

        <StepConnector />

        {/* Step 2 — Sign In */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={2} />
            <div>
              <h2 className="text-base font-semibold text-gray-200">Sign In</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Open{" "}
                <a href="https://rondo-ui.vercel.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  rondo-ui.vercel.app
                </a>{" "}
                and sign in with Google.
              </p>
            </div>
          </div>
          <div className="pl-11">
            <div className="rounded-lg border border-border bg-surface-card/30 p-3 text-[12px] text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              If you're already signed in, you can skip this step.
            </div>
          </div>
        </section>

        <StepConnector />

        {/* Step 3 — Generate Link */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={3} />
            <div>
              <h2 className="text-base font-semibold text-gray-200">Generate a Link</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Go to the <strong className="text-gray-400">Jobs</strong> tab and click <strong className="text-gray-400">Link Device</strong> &rarr; <strong className="text-gray-400">Generate Link Token</strong>. Copy the link URL.
              </p>
            </div>
          </div>
        </section>

        <StepConnector />

        {/* Step 4 — Link Device */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={4} />
            <div>
              <h2 className="text-base font-semibold text-gray-200">Link Your Device</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Send the link to your OpenClaw instance. Choose whichever method you prefer:
              </p>
            </div>
          </div>
          <div className="pl-11 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface-card/30 p-3 space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Via Chat (Telegram / WhatsApp)</p>
                <CodeBlock code={LINK_CHAT_CMD} />
              </div>
              <div className="rounded-lg border border-border bg-surface-card/30 p-3 space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Via Terminal</p>
                <CodeBlock code={LINK_CLI_CMD} />
              </div>
            </div>
            <p className="text-[11px] text-gray-600">
              Replace <code className="font-mono text-accent/60">&lt;URL&gt;</code> with the link you copied in step 3. The token expires in 5 minutes.
            </p>
          </div>
        </section>

        <StepConnector />

        {/* Step 5 — Done */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <StepNumber n={5} />
            <div>
              <h2 className="text-base font-semibold text-gray-200">Done!</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Your cron jobs will appear on the dashboard within a few minutes.
              </p>
            </div>
          </div>
          <div className="pl-11">
            <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-[12px] text-gray-400 space-y-1.5">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>The plugin syncs every 5 minutes automatically.</span>
              </p>
              <p className="text-gray-500 pl-6">
                Use the <strong className="text-gray-400">Sync</strong> button in the header to trigger an immediate sync.
              </p>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Troubleshooting</h3>
          <div className="text-[12px] text-gray-500 space-y-2">
            <p>
              <strong className="text-gray-400">Jobs not appearing?</strong> Check that the gateway restarted after plugin install. Run <code className="font-mono text-accent/60">/rondo status</code> to verify the plugin is active and linked.
            </p>
            <p>
              <strong className="text-gray-400">Link token expired?</strong> Generate a new one from the Link Device card. Tokens expire after 5 minutes.
            </p>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
