import type { Metadata } from "next";
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
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
          <div className="flex flex-col items-center text-center">
            <div className="text-accent">
              <Logo size={80} />
            </div>
            <h1
              className="mt-6 text-2xl font-bold text-foreground sm:text-3xl"
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
              <h2 className="text-lg font-semibold text-foreground">简介</h2>
              <div className="mt-3 space-y-4 text-foreground-secondary leading-relaxed">
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
              <h2 className="text-lg font-semibold text-foreground">
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
              <h2 className="text-lg font-semibold text-foreground">
                关注公众号
              </h2>
              <p className="mt-3 text-sm text-foreground-secondary">
                扫描下方二维码，关注我的微信公众号获取最新文章推送。
              </p>
              <div className="mt-4 inline-flex h-40 w-40 items-center justify-center rounded-xl border border-border bg-white">
                <span className="text-xs text-neutral-400">公众号二维码</span>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
