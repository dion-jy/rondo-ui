// ── Heads-up Notification System ──
// Maximizes visibility within browser/PWA constraints.

// Android/Chrome: status-bar icon can appear as white square when badge is non-monochrome.
// Use app icon for main notification and omit badge for compatibility.
const ICON_URL = "/pwa-192x192.png";

// ── Dedup & throttle ──

const notifiedKeys = new Set<string>();
const renotifyTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Prevent notification spam: max 1 notification per tag within this window
const THROTTLE_MS = 10_000;
const throttleMap = new Map<string, number>();

function isThrottled(tag: string): boolean {
  const last = throttleMap.get(tag);
  if (last && Date.now() - last < THROTTLE_MS) return true;
  throttleMap.set(tag, Date.now());
  return false;
}

// ── Permission helpers ──

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  const result = await Notification.requestPermission();
  return result;
}

// ── Core notification fire ──

export interface HeadsUpOptions {
  title: string;
  body: string;
  tag: string;
  /** If true, notification stays until user interacts */
  critical?: boolean;
  /** Deep-link hash to navigate on click (e.g. "#/jobs") */
  deepLink?: string;
  /** If true, schedule a re-notification after 60s if not acknowledged */
  renotify?: boolean;
}

/**
 * Fire a heads-up notification with maximum priority options.
 * Uses new Notification() with onclick for desktop, falls back to
 * ServiceWorker showNotification for mobile PWA.
 */
export function fireHeadsUp(opts: HeadsUpOptions): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const { title, body, tag, critical = false, deepLink, renotify: shouldRenotify = false } = opts;

  // Dedup: same tag won't fire again
  if (notifiedKeys.has(tag)) return;
  if (isThrottled(tag)) return;

  notifiedKeys.add(tag);

  const notifOptions: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body,
    tag, // Same tag → replaces previous (dedup)
    icon: ICON_URL,
    renotify: true, // Re-alert even if same tag replaces
    silent: false,
    requireInteraction: critical, // Critical stays until dismissed
    vibrate: critical ? [200, 100, 200, 100, 300] : [200, 100, 200],
  };

  try {
    const n = new Notification(title, notifOptions);
    n.onclick = () => {
      window.focus();
      if (deepLink) window.location.hash = deepLink;
      n.close();
      // Cancel any pending re-notification
      cancelRenotify(tag);
    };
  } catch {
    // Mobile PWA: new Notification() throws → use SW
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(title, { ...notifOptions, data: { deepLink } }))
      .catch(() => {});
  }

  // Schedule re-notification for critical events
  if (shouldRenotify && critical) {
    scheduleRenotify(opts);
  }
}

// ── Re-notification (1 min, 1 time) ──

function scheduleRenotify(opts: HeadsUpOptions): void {
  const { tag } = opts;
  // Only 1 pending re-notify per tag
  if (renotifyTimers.has(tag)) return;

  const timer = setTimeout(() => {
    renotifyTimers.delete(tag);
    // Allow this tag to fire again
    notifiedKeys.delete(tag);
    throttleMap.delete(tag);
    // Fire once more (without scheduling another renotify)
    fireHeadsUp({ ...opts, renotify: false });
  }, 60_000);

  renotifyTimers.set(tag, timer);
}

/** Cancel pending re-notification (e.g. user clicked the notification) */
export function cancelRenotify(tag: string): void {
  const timer = renotifyTimers.get(tag);
  if (timer) {
    clearTimeout(timer);
    renotifyTimers.delete(tag);
  }
}

/** Clear all dedup state (useful for testing) */
export function resetNotificationState(): void {
  notifiedKeys.clear();
  throttleMap.clear();
  for (const timer of renotifyTimers.values()) clearTimeout(timer);
  renotifyTimers.clear();
}

// ── Convenience: ACP session notifications ──

export function fireAcpNotification(
  sessionKey: string,
  status: "done" | "error" | "running",
  label: string,
) {
  const tag = `acp:${sessionKey}:${status}`;
  const isError = status === "error";
  const body =
    status === "done" ? `[완료] ${label}` :
    status === "error" ? `[에러] ${label}` :
    `[시작] ${label}`;

  fireHeadsUp({
    title: "Rondo ACP",
    body,
    tag,
    critical: isError,
    renotify: isError, // Re-alert errors after 1 min if unacknowledged
    deepLink: "", // Navigate to dashboard root
  });
}

// ── Test notification ──

export function fireTestNotification(): void {
  // Temporarily allow by clearing any previous test dedup
  notifiedKeys.delete("test:headsup");
  throttleMap.delete("test:headsup");

  fireHeadsUp({
    title: "Rondo — Test Alert",
    body: "Heads-up 알림 테스트입니다. 이 알림이 보이면 정상!",
    tag: "test:headsup",
    critical: true,
    deepLink: "",
  });
}
