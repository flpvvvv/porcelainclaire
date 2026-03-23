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
      <main id="main-content" className="flex-1 pt-[5.35rem] sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <section className="max-w-3xl">
            <p className="section-kicker">关于这个空间</p>
            <div className="mt-5 inline-flex rounded-full border border-border/75 bg-accent-soft p-3 text-accent shadow-[var(--card-shadow)]">
              <Logo size={64} />
            </div>
            <h1
              className="font-display mt-6 text-[2.3rem] font-semibold tracking-tight text-foreground sm:text-[3rem]"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              一个适合慢慢读、慢慢想的个人空间
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-foreground-secondary sm:text-[1.05rem]">
              这里收纳 Claire 对生活与日常的记录。文章同步自微信公众号，而网站保留一种更轻一些、更安静一些的阅读方式。
            </p>
            <div className="mt-10 max-w-sm">
              <div className="editorial-divider" aria-hidden="true" />
            </div>
          </section>

          <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="editorial-card rounded-[1.8rem] p-6 sm:p-8">
              <p className="section-kicker">Claire</p>
              <h2 className="font-display mt-3 text-[1.7rem] font-semibold tracking-tight text-foreground">
                关于作者
              </h2>
              <div className="mt-5 space-y-4 text-[0.98rem] leading-8 text-foreground-secondary">
                <p>你好，我是 Claire。欢迎来到我的个人博客。</p>
                <p>
                  这里是我记录生活、分享思考的地方。我希望页面本身也像文字一样，有留白、有温度、不急着催促你向下滑。
                </p>
                <p>
                  如果你更习惯在微信里收藏、分享或互动，也可以通过下方入口继续阅读。
                </p>
              </div>
            </section>

            <section className="editorial-card rounded-[1.8rem] p-6 sm:p-7">
              <p className="section-kicker">联系与关注</p>
              <div className="mt-5 space-y-5">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    联系方式
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-foreground-secondary">
                    邮箱：
                    <a
                      href="mailto:contact@porcelainclaire.com"
                      className="ml-1 text-accent transition-colors hover:text-accent-hover"
                    >
                      contact@porcelainclaire.com
                    </a>
                  </p>
                </div>

                <div className="editorial-divider" />

                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    公众号
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-foreground-secondary">
                    扫描二维码关注公众号，在微信里接收最新文章推送。
                  </p>
                  <div className="mt-4 inline-flex overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface/85 p-2 shadow-[var(--card-shadow)]">
                    <Image
                      src="/wechat-qr.png"
                      width={160}
                      height={160}
                      alt="WeChat Official Account QR code for Porcelain Claire"
                      className="block h-40 w-40 rounded-[1rem] object-contain"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
