import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault?.();
      setDeferred(e as any);
    };
    window.addEventListener("beforeinstallprompt", h as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", h as EventListener);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed left-4 right-4 md:left-auto md:right-4 bottom-4 md:bottom-4 z-50 md:w-80 rounded-xl border border-border bg-surface-card p-3 shadow-xl">
      <p className="text-sm text-gray-200">Install Rondo app</p>
      <p className="text-xs text-gray-500 mt-1">홈 화면에 추가해서 앱처럼 사용할 수 있어요.</p>
      <div className="mt-3 flex gap-2 justify-end">
        <button className="px-2 py-1 text-xs text-gray-500" onClick={() => setDismissed(true)}>Later</button>
        <button
          className="px-3 py-1 text-xs rounded bg-accent text-black"
          onClick={async () => {
            deferred.prompt?.();
            await deferred.userChoice?.catch(() => undefined);
            setDeferred(null);
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
