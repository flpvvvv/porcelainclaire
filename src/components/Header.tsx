"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArticleSearchDialog } from "./ArticleSearchDialog";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const [concealed, setConcealed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < 48) {
        setConcealed(false);
      } else if (delta > 6) {
        setConcealed(true);
      } else if (delta < -6) {
        setConcealed(false);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-3 z-40 px-3 transition-transform duration-300 ease-out motion-reduce:transition-none sm:top-4 sm:px-4 ${
        concealed ? "-translate-y-[140%]" : "translate-y-0"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div
          className="@container overflow-hidden rounded-[1.4rem] border border-border/75 shadow-[var(--float-shadow)] supports-[backdrop-filter]:backdrop-blur-xl"
          style={{ backgroundColor: "var(--header-bg)" }}
        >
          <div className="flex min-h-[3.6rem] items-center justify-between gap-2 px-3 sm:min-h-[4rem] sm:gap-3 sm:px-4 lg:px-5">
            <Link
              href="/"
              className="group flex min-h-11 min-w-0 shrink-0 cursor-pointer items-center gap-2 rounded-full pr-0.5 text-foreground transition-opacity hover:opacity-90 sm:gap-3 sm:pr-1"
            >
              <div className="rounded-full border border-border/70 bg-accent-soft p-1.5 text-accent transition-colors group-hover:text-accent-hover">
                <Logo size={28} />
              </div>
              <div className="hidden min-w-0 @min-[420px]:block">
                <span className="font-display block truncate text-[0.98rem] font-medium tracking-tight sm:text-base">
                  Porcelain Claire
                </span>
                <span className="hidden truncate text-[0.7rem] tracking-[0.18em] text-foreground-tertiary lg:block">
                  写给愿意慢慢读的人
                </span>
              </div>
            </Link>

            <nav
              className="flex min-w-0 flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain sm:gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="主导航"
            >
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex size-11 shrink-0 cursor-pointer flex-row flex-nowrap items-center justify-center gap-0 rounded-full border border-transparent text-foreground-secondary transition-[background-color,border-color,color,box-shadow] duration-200 hover:bg-accent-soft hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] motion-reduce:transition-none @min-[380px]:h-11 @min-[380px]:w-max @min-[380px]:justify-start @min-[380px]:gap-2 @min-[380px]:rounded-full @min-[380px]:border-border/60 @min-[380px]:bg-surface/50 @min-[380px]:px-3.5 @min-[380px]:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] @min-[380px]:hover:border-accent/35 @min-[380px]:hover:bg-accent-soft dark:@min-[380px]:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                aria-label="搜索文章"
                title="搜索（⌘K）"
              >
                <svg
                  className="shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="hidden whitespace-nowrap @min-[380px]:inline @min-[380px]:text-sm @min-[380px]:font-medium @min-[380px]:tracking-tight">
                  搜索
                </span>
                <span
                  className="hidden whitespace-nowrap font-mono text-[0.65rem] tabular-nums tracking-wide text-foreground-tertiary @min-[480px]:inline"
                  aria-hidden="true"
                >
                  ⌘K
                </span>
              </button>
              <Link
                href="/"
                className="flex size-11 shrink-0 flex-row flex-nowrap items-center justify-center gap-0 rounded-full text-foreground-secondary transition-[background-color,color] duration-200 hover:bg-accent-soft hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] motion-reduce:transition-none @min-[380px]:h-11 @min-[380px]:w-max @min-[380px]:px-4"
                aria-label="首页"
              >
                <svg
                  className="shrink-0 @min-[380px]:hidden"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
                <span className="hidden whitespace-nowrap @min-[380px]:inline @min-[380px]:text-sm @min-[380px]:font-medium">
                  首页
                </span>
              </Link>
              <Link
                href="/about"
                className="flex size-11 shrink-0 flex-row flex-nowrap items-center justify-center gap-0 rounded-full text-foreground-secondary transition-[background-color,color] duration-200 hover:bg-accent-soft hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] motion-reduce:transition-none @min-[380px]:h-11 @min-[380px]:w-max @min-[380px]:px-4"
                aria-label="关于"
              >
                <svg
                  className="shrink-0 @min-[380px]:hidden"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx={12} cy={12} r={10} />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span className="hidden whitespace-nowrap @min-[380px]:inline @min-[380px]:text-sm @min-[380px]:font-medium">
                  关于
                </span>
              </Link>
              <ThemeToggle />
            </nav>
        </div>
      </div>
      </div>
      <ArticleSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </header>
  );
}
