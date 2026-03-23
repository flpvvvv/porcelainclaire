"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const [concealed, setConcealed] = useState(false);

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
    </header>
  );
}
