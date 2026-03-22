import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Porcelain Claire
            </h2>
            <p className="text-sm text-foreground-secondary">
              分享生活与思考
            </p>
            <p className="text-sm text-foreground-secondary">
              <a
                href="mailto:contact@porcelainclaire.com"
                className="transition-colors hover:text-accent"
              >
                contact@porcelainclaire.com
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">导航</h2>
            <nav className="flex flex-col gap-2" aria-label="页脚导航">
              <Link
                href="/"
                className="text-sm text-foreground-secondary transition-colors hover:text-accent"
              >
                首页
              </Link>
              <Link
                href="/about"
                className="text-sm text-foreground-secondary transition-colors hover:text-accent"
              >
                关于
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              关注公众号
            </h2>
            <div className="overflow-hidden rounded-lg border border-border bg-white">
              <Image
                src="/wechat-qr.png"
                width={112}
                height={112}
                alt="WeChat Official Account QR code for Porcelain Claire"
                className="block h-28 w-28 object-contain p-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-foreground-secondary">
          &copy; {year} Porcelain Claire. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
