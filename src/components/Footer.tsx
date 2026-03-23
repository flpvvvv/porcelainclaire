import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-border bg-surface/80">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent opacity-60"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="font-display text-lg font-medium tracking-tight text-foreground">
              Porcelain Claire
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground-secondary">
              记录生活，分享思考。每一篇文字都值得慢慢读。
            </p>
            <p className="mt-5 text-sm">
              <a
                href="mailto:contact@porcelainclaire.com"
                className="text-foreground-secondary underline decoration-border underline-offset-4 transition-colors hover:text-accent"
              >
                contact@porcelainclaire.com
              </a>
            </p>
          </div>

          <nav
            className="flex flex-col gap-3 sm:items-end lg:col-span-3 lg:items-start"
            aria-label="页脚导航"
          >
            <span className="text-[0.65rem] font-medium tracking-[0.15em] text-foreground-tertiary">
              导航
            </span>
            <Link
              href="/"
              className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
            >
              首页
            </Link>
            <Link
              href="/about"
              className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
            >
              关于
            </Link>
          </nav>

          <div className="sm:col-span-2 lg:col-span-4 lg:justify-self-end">
            <span className="text-[0.65rem] font-medium tracking-[0.15em] text-foreground-tertiary">
              公众号
            </span>
            <div className="mt-3 overflow-hidden rounded-lg border border-border bg-[var(--surface-muted)] p-1 shadow-[var(--card-shadow)]">
              <Image
                src="/wechat-qr.png"
                width={112}
                height={112}
                alt="Porcelain Claire 微信公众号二维码"
                className="block h-28 w-28 object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-[var(--reading-rule)] pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs tabular-nums text-foreground-tertiary">
            &copy; {year} Porcelain Claire
          </p>
          <p className="text-xs text-foreground-tertiary">用心记录</p>
        </div>
      </div>
    </footer>
  );
}
