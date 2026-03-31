"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <button
        className="h-11 w-11 shrink-0 rounded-full border border-border/70 bg-surface/80 @min-[380px]:min-w-[4.25rem] @min-[380px]:px-3"
        aria-label="切换主题"
        disabled
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group inline-flex h-11 w-11 shrink-0 items-center justify-center gap-0 rounded-full border border-border/70 bg-surface/85 text-foreground-secondary shadow-[var(--card-shadow)] transition-[border-color,background-color,color,transform] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground active:scale-[0.98] @min-[380px]:w-auto @min-[380px]:gap-1.5 @min-[380px]:px-3"
      aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
      title={isDark ? "切换到浅色模式" : "切换到深色模式"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </>
        ) : (
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        )}
      </svg>
      <span className="hidden text-[0.76rem] font-medium text-current @min-[380px]:inline">
        {isDark ? "浅色" : "深色"}
      </span>
    </button>
  );
}
