"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type BeforeInstallPromptEventLike,
  isDismissalActive,
  isIosLikeDevice,
  isMobileViewport,
  isStandaloneDisplayMode,
  PWA_INSTALL_DISMISS_KEY,
} from "@/lib/pwa-install";

type InstallVariant = "android" | "ios";

type PwaInstallContextValue = {
  /** True after client mount and initial checks */
  ready: boolean;
  /** Whether inline callout should render (mobile, not standalone, not on cooldown) */
  showInstallCallout: boolean;
  variant: InstallVariant | null;
  /** Android/Chrome: native install prompt is available */
  canPromptInstall: boolean;
  dismissCallout: () => void;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function usePwaInstall(): PwaInstallContextValue {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return ctx;
}

/** Optional: use when callout may render outside strict tree (defensive). */
export function usePwaInstallOptional(): PwaInstallContextValue | null {
  return useContext(PwaInstallContext);
}

export function PwaInstallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] = useState({
    ready: false,
    standalone: false,
    dismissed: false,
    mobile: false,
    iosLike: false,
  });
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEventLike | null>(null);

  useEffect(() => {
    let raf = 0;

    const syncViewport = () => {
      setClient((prev) => ({
        ...prev,
        mobile: isMobileViewport(),
      }));
    };

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEventLike);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("resize", syncViewport, { passive: true });

    raf = requestAnimationFrame(() => {
      setClient({
        ready: true,
        standalone: isStandaloneDisplayMode(),
        dismissed: isDismissalActive(),
        iosLike: isIosLikeDevice(),
        mobile: isMobileViewport(),
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as EventListener,
      );
    };
  }, []);

  const dismissCallout = useCallback(() => {
    try {
      window.localStorage.setItem(
        PWA_INSTALL_DISMISS_KEY,
        String(Date.now()),
      );
    } catch {
      /* ignore */
    }
    setClient((prev) => ({ ...prev, dismissed: true }));
  }, []);

  const promptInstall = useCallback(async () => {
    const ev = deferredPrompt;
    if (!ev) return "unavailable";
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        try {
          window.localStorage.setItem(
            PWA_INSTALL_DISMISS_KEY,
            String(Date.now()),
          );
        } catch {
          /* ignore */
        }
        setClient((prev) => ({ ...prev, dismissed: true }));
      }
      return outcome;
    } catch {
      return "unavailable";
    }
  }, [deferredPrompt]);

  const { ready, standalone, dismissed, mobile, iosLike } = client;

  const variant: InstallVariant | null = useMemo(() => {
    if (!ready || standalone || dismissed || !mobile) return null;
    if (deferredPrompt) return "android";
    if (iosLike) return "ios";
    return null;
  }, [ready, standalone, dismissed, mobile, deferredPrompt, iosLike]);

  const showInstallCallout = variant !== null;

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      ready,
      showInstallCallout,
      variant,
      canPromptInstall: Boolean(deferredPrompt),
      dismissCallout,
      promptInstall,
    }),
    [
      ready,
      showInstallCallout,
      variant,
      deferredPrompt,
      dismissCallout,
      promptInstall,
    ],
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}
