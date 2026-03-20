import { useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function generateToken(): string {
  return crypto.randomUUID();
}

export function LinkDevice() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateLink = useCallback(async () => {
    if (!user || !supabaseUrl || !supabaseAnonKey) return;
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      // Get current session to use authenticated client
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Use authenticated client
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
      });

      const newToken = generateToken();
      const { error: insertError } = await authClient
        .from("device_links")
        .insert({ token: newToken, user_id: user.id });

      if (insertError) {
        setError(insertError.message);
      } else {
        setToken(newToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const copyToken = useCallback(() => {
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [token]);

  return (
    <div className="rounded-lg border border-border bg-surface-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.353a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.028" />
        </svg>
        <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider">Link Device</h3>
      </div>

      {!token ? (
        <div className="space-y-3">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Generate a one-time token to link your OpenClaw plugin to this account.
            Add the token to your <code className="text-accent/70 bg-surface-raised/50 px-1 rounded text-[11px]">openclaw.json</code> config.
          </p>
          <button
            onClick={generateLink}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            Generate Link Token
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] font-mono text-accent/90 bg-surface-raised/50 rounded px-2.5 py-1.5 truncate select-all">
              {token}
            </code>
            <button
              onClick={copyToken}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-200 bg-surface-raised/50 hover:bg-surface-raised rounded transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-gray-500 space-y-2">
            <p className="flex items-center gap-1.5">
              <svg className="w-3 h-3 text-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expires in 5 minutes
            </p>
            <p>Add to your <code className="text-accent/70 bg-surface-raised/50 px-1 rounded text-[11px]">openclaw.json</code>:</p>
            <pre className="text-[10px] bg-surface-raised/30 rounded px-2.5 py-2 overflow-x-auto text-gray-400">
{`"rondo": {
  "linkToken": "${token}"
}`}
            </pre>
            <p className="text-gray-600">The plugin will claim this token on next sync and save your user ID locally.</p>
          </div>

          <button
            onClick={() => { setToken(null); setCopied(false); }}
            className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Generate new token
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[11px] text-error/80">{error}</p>
      )}
    </div>
  );
}
