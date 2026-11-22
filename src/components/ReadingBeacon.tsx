"use client";

import { useEffect } from "react";

const MIN_VISIBLE_MS = 10_000;
const MIN_SCROLL_PCT = 25;

/** Reports one engaged read per article per day. Renders nothing. */
export function ReadingBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const storageKey = `reading-beacon:${slug}:${new Date().toISOString().slice(0, 10)}`;
    if (readStorage(storageKey)) return;

    let visibleMs = 0;
    let lastTick = performance.now();
    let sent = false;
    let timer: number | undefined;

    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };

    const send = () => {
      if (sent) return;
      sent = true;
      writeStorage(storageKey);
      stop();

      void fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          visibleMs: Math.round(visibleMs),
          scrollPct: currentScrollPct(),
        }),
        credentials: "omit",
        keepalive: true,
      }).catch(() => {});
    };

    const tick = () => {
      const now = performance.now();
      if (document.visibilityState === "visible") {
        visibleMs += now - lastTick;
      }
      lastTick = now;

      if (visibleMs >= MIN_VISIBLE_MS && currentScrollPct() >= MIN_SCROLL_PCT) {
        send();
      }
    };

    function onScroll() {
      if (visibleMs >= MIN_VISIBLE_MS && currentScrollPct() >= MIN_SCROLL_PCT) {
        send();
      }
    }

    function onVisibilityChange() {
      lastTick = performance.now();
    }

    timer = window.setInterval(tick, 1000);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return stop;
  }, [slug]);

  return null;
}

function currentScrollPct(): number {
  const scrollHeight = document.documentElement.scrollHeight;
  const maxScroll = scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 100;
  return Math.min(
    100,
    Math.max(0, Math.round((window.scrollY / maxScroll) * 100)),
  );
}

function readStorage(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeStorage(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage can be unavailable in private modes; the server still dedupes.
  }
}
