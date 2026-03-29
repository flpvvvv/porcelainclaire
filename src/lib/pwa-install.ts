/** localStorage key for quiet install callout dismissal */
export const PWA_INSTALL_DISMISS_KEY = "pwa-install-dismissed-at";

/** Hide callout again for this long after user dismisses (ms) */
export const PWA_INSTALL_DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function isIosLikeDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS =
    ua.includes("Mac") && "maxTouchPoints" in navigator && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 48rem)").matches;
}

export function readDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PWA_INSTALL_DISMISS_KEY);
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function isDismissalActive(): boolean {
  const at = readDismissedAt();
  if (at == null) return false;
  return Date.now() - at < PWA_INSTALL_DISMISS_COOLDOWN_MS;
}
