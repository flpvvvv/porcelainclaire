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
      className={`fixed inset-x-0 top-0 z-40 border-b border-border/80 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        concealed ? "-translate-y-full" : "translate-y-0"
      }`}
      style={{ backgroundColor: "var(--header-bg)" }}
    >
      <div className="supports-[backdrop-filter]:bg-background/40 supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="mx-auto flex h-[3.25rem] max-w-6xl items-center justify-between px-4 sm:h-14 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-85"
          >
            <Logo size={30} />
            <span className="font-display text-[0.95rem] font-medium tracking-tight sm:text-base">
              Porcelain Claire
            </span>
          </Link>

          <nav
            className="flex items-center gap-0.5 sm:gap-1"
            aria-label="主导航"
          >
            <Link
              href="/"
              className="rounded-md px-2.5 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-foreground/[0.04] hover:text-foreground sm:px-3"
            >
              首页
            </Link>
            <Link
              href="/about"
              className="rounded-md px-2.5 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-foreground/[0.04] hover:text-foreground sm:px-3"
            >
              关于
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
