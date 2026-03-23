import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto pb-8 pt-12 sm:pb-10 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="editorial-card overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-80"
            aria-hidden="true"
          />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.85fr)_auto] lg:gap-8">
            <div>
              <p className="section-kicker">慢读空间</p>
              <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Porcelain Claire
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-foreground-secondary sm:text-[0.97rem]">
                记录生活，分享思考。希望每一次打开页面，都像在夜里点亮一盏安静的阅读灯。
              </p>
              <p className="mt-6 text-sm">
                <a
                  href="mailto:contact@porcelainclaire.com"
                  className="inline-flex min-h-11 items-center rounded-full border border-border/75 bg-surface/80 px-4 text-foreground-secondary transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground"
                >
                  contact@porcelainclaire.com
                </a>
              </p>
            </div>

            <nav className="flex flex-col gap-3" aria-label="页脚导航">
              <span className="section-kicker">导航</span>
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
              <a
                href="#top"
                className="text-sm text-foreground-secondary transition-colors hover:text-foreground"
              >
                回到顶部
              </a>
            </nav>

            <div className="max-w-[12rem]">
              <span className="section-kicker">公众号</span>
              <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface/85 p-2 shadow-[var(--card-shadow)]">
                <Image
                  src="/wechat-qr.png"
                  width={144}
                  height={144}
                  alt="Porcelain Claire 微信公众号二维码"
                  className="block h-36 w-36 rounded-[1rem] object-contain"
                />
              </div>
              <p className="mt-3 text-xs leading-6 text-foreground-tertiary">
                关注后可在微信里继续点赞、分享与互动。
              </p>
            </div>
          </div>

          <div className="editorial-divider mt-10" />

          <div className="mt-6 flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs tabular-nums text-foreground-tertiary">
              &copy; {year} Porcelain Claire
            </p>
            <p className="text-xs text-foreground-tertiary">
              留一点安静，给值得慢慢读的文字。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
