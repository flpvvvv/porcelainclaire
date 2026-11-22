import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "Porcelain Claire 网站隐私政策：数据收集范围、Cookie 使用说明、第三方服务列表，以及联系方式。";

export const metadata: Metadata = {
  title: "隐私政策 | Porcelain Claire",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: "隐私政策 | Porcelain Claire",
    description: DESCRIPTION,
    url: `${SITE_URL}/privacy`,
  },
  twitter: {
    title: "隐私政策 | Porcelain Claire",
    description: DESCRIPTION,
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 pt-[5.35rem] sm:pt-28">
        <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <p className="section-kicker">法律与使用</p>
          <h1
            className="font-display mt-4 text-[2.1rem] font-semibold tracking-tight text-foreground sm:text-[2.6rem]"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            隐私政策
          </h1>
          <p className="mt-4 text-sm text-foreground-secondary">
            最后更新：2026年11月22日
          </p>

          <div className="editorial-card mt-10 space-y-8 rounded-[1.8rem] p-6 sm:p-8">
            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <p>
                本站（
                <strong className="text-foreground">porcelainclaire.com</strong>
                ）由 Porcelain Claire
                运营。我们尊重您的隐私，并承诺保护您在本站访问时提供的个人信息。
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                数据收集
              </h2>
              <p>
                本站不要求您登录或注册，也不需要提供任何身份信息。文章内容与图片存储于第三方服务（见下文）。
              </p>
              <p>
                为了区分真实读者与自动化访问，本站使用无 Cookie
                的匿名阅读统计：文章页在满足一定阅读时长和滚动深度后，记录文章标识、停留时长、滚动比例、浏览器
                User-Agent、来源页、国家/地区，以及加盐哈希后的 IP 地址。IP
                原文不会保存。本站还设有一个对普通读者隐藏的爬虫陷阱链接，用于记录自动化访问。
              </p>
              <p>
                这些数据仅用于了解内容表现和识别爬虫，不用于广告、用户画像或跨站追踪。
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Cookie 使用
              </h2>
              <p>
                本站仅使用 Cookie 记录您的
                <strong className="text-foreground">主题偏好</strong>
                （深色或浅色模式）。该 Cookie
                仅用于改善阅读体验，不涉及任何追踪、广告或第三方数据共享。
              </p>
              <p>
                为避免重复计数，阅读统计会在浏览器本地存储中记录“当天是否已上报”，该记录不包含身份信息。您可以在浏览器中清除本地存储。
              </p>
              <p>
                您可以在浏览器中清除或禁用
                Cookie，这不会影响文章阅读功能，仅会影响主题自动切换。
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                第三方服务
              </h2>
              <p>本站使用以下第三方服务托管内容与运营网站：</p>
              <ul className="mt-3 space-y-2 pl-4">
                <li>
                  <strong className="text-foreground">Supabase</strong>
                  ：用于存储文章内容、图片素材与匿名阅读统计。
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong>
                  ：用于网站托管、部署与匿名访问统计。
                </li>
              </ul>
              <p className="mt-3">
                这些服务提供商可能有其独立的隐私政策，建议您在需要时查阅其官方说明。
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                数据安全
              </h2>
              <p>
                我们采用行业标准的加密与安全措施保护网站运营。但由于互联网环境的复杂性，我们无法保证数据传输绝对安全，建议您在公共网络环境中保持谨慎。
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                联系方式
              </h2>
              <p>
                如有隐私相关问题或建议，请邮件联系：{" "}
                <a
                  href="mailto:contact@porcelainclaire.com"
                  className="text-accent transition-colors hover:text-accent-hover"
                >
                  contact@porcelainclaire.com
                </a>
              </p>
            </section>

            <p className="text-sm text-foreground-tertiary">
              <Link
                href="/"
                className="text-accent transition-colors hover:text-accent-hover"
              >
                ← 返回首页
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
