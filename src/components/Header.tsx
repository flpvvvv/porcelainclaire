import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
        >
          <Logo size={32} />
          <span className="text-base font-semibold tracking-tight">
            Porcelain Claire
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="主导航">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            首页
          </Link>
          <Link
            href="/about"
            className="rounded-md px-3 py-1.5 text-sm text-foreground-secondary transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            关于
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
