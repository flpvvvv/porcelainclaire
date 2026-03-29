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
          className="overflow-hidden rounded-[1.4rem] border border-border/75 shadow-[var(--float-shadow)] supports-[backdrop-filter]:backdrop-blur-xl"
          style={{ backgroundColor: "var(--header-bg)" }}
        >
          <div className="flex min-h-[3.6rem] items-center justify-between gap-3 px-3.5 sm:min-h-[4rem] sm:px-4 lg:px-5">
            <Link
              href="/"
              className="group flex min-h-11 min-w-0 items-center gap-3 rounded-full pr-1 text-foreground transition-opacity hover:opacity-90"
            >
              <div className="rounded-full border border-border/70 bg-accent-soft p-1.5 text-accent transition-colors group-hover:text-accent-hover">
                <Logo size={28} />
              </div>
              <div className="min-w-0">
                <span className="font-display block truncate text-[0.98rem] font-medium tracking-tight sm:text-base">
                  Porcelain Claire
                </span>
                <span className="hidden truncate text-[0.7rem] tracking-[0.18em] text-foreground-tertiary lg:block">
                  写给愿意慢慢读的人
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1" aria-label="主导航">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-foreground-secondary transition-[background-color,color] duration-200 hover:bg-accent-soft hover:text-foreground sm:min-w-0 sm:gap-1.5 sm:px-3.5"
                aria-label="搜索文章"
                title="搜索（⌘K）"
              >
                <svg
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
                <span className="hidden text-sm font-medium sm:inline">搜索</span>
              </button>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium text-foreground-secondary transition-[background-color,color] duration-200 hover:bg-accent-soft hover:text-foreground sm:px-4"
              >
                首页
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium text-foreground-secondary transition-[background-color,color] duration-200 hover:bg-accent-soft hover:text-foreground sm:px-4"
              >
                关于
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
