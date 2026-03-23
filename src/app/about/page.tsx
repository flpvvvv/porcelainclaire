import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "关于",
  description: "关于 Porcelain Claire",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 pt-[3.35rem] sm:pt-14"
      >
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="text-accent">
              <Logo size={80} />
            </div>
            <h1
              className="font-display mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              关于 Porcelain Claire
            </h1>
            <p className="mt-4 max-w-lg text-foreground-secondary">
              一个分享生活与思考的个人空间。
            </p>
          </div>

          <div className="mt-12 space-y-8">
            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                简介
              </h2>
              <div className="mt-3 space-y-4 leading-relaxed text-foreground-secondary">
                <p>
                  你好，我是 Claire。欢迎来到我的个人博客。
                </p>
                <p>
                  这里是我记录生活、分享思考的地方。文章同步自我的微信公众号，
                  你可以在这里阅读，也可以跳转到微信进行互动。
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                联系方式
              </h2>
              <div className="mt-3 space-y-3">
                <p className="text-foreground-secondary">
                  邮箱：
                  <a
                    href="mailto:contact@porcelainclaire.com"
                    className="text-accent transition-colors hover:text-accent-hover"
                  >
                    contact@porcelainclaire.com
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-foreground">
                关注公众号
              </h2>
              <p className="mt-3 text-sm text-foreground-secondary">
                扫描下方二维码，关注我的微信公众号获取最新文章推送。
              </p>
              <div className="mt-4 inline-block overflow-hidden rounded-xl border border-border bg-surface-muted">
                <Image
                  src="/wechat-qr.png"
                  width={160}
                  height={160}
                  alt="WeChat Official Account QR code for Porcelain Claire"
                  className="block h-40 w-40 object-contain p-1.5"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
