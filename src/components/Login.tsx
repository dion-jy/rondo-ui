import { useAuth } from "../hooks/useAuth";

export function Login() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" stroke="url(#login-grad)" strokeWidth="2" fill="none" opacity="0.5" />
              <circle cx="11" cy="18" r="4.5" fill="url(#login-grad)" />
              <rect x="15" y="5" width="2.2" height="14" rx="1.1" fill="url(#login-grad)" />
              <path d="M15 5 C15 5, 22 4, 21 9 C20 13, 17 11, 17.2 9" fill="url(#login-grad)" opacity="0.7" />
              <defs>
                <linearGradient id="login-grad" x1="4" y1="4" x2="24" y2="24">
                  <stop stopColor="#9B8FFF" />
                  <stop offset="1" stopColor="#5E50CC" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-gray-100 leading-none">Rondo</span>
              <span className="text-[10px] tracking-widest text-gray-600 uppercase mt-0.5">Cron Dashboard</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-8">
          Sign in to view your cron jobs and ACP sessions.
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-surface-card hover:bg-surface-raised transition-colors text-sm text-gray-200 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
