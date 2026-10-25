import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "Porcelain Claire 网站版权声明：内容版权归属、非商业转载与商业使用规则，以及联系授权方式。";

export const metadata: Metadata = {
  title: "版权声明与使用条款 | Porcelain Claire",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/copyright` },
  openGraph: {
    title: "版权声明与使用条款 | Porcelain Claire",
    description: DESCRIPTION,
    url: `${SITE_URL}/copyright`,
  },
  twitter: {
    title: "版权声明与使用条款 | Porcelain Claire",
    description: DESCRIPTION,
  },
};

export default function CopyrightPage() {
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
            版权声明
          </h1>
          <p className="mt-4 text-sm text-foreground-secondary">
            最后更新：以本页所载为准。
          </p>

          <div className="editorial-card mt-10 space-y-8 rounded-[1.8rem] p-6 sm:p-8">
            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <p>
                本站所有内容版权归{" "}
                <strong className="text-foreground">Porcelain Claire</strong>{" "}
                所有，并保留所有权利。
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                非商业转载
              </h2>
              <p>
                非商业转载必须注明出处及原作者（Porcelain Claire /
                Claire），并不得对正文作歪曲、篡改或删减。
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                商业用途
              </h2>
              <p>
                未经授权严禁将本站文字、图片或其他素材用于商业用途。如需商业合作或授权，请务必预先联系作者。
              </p>
              <p>
                联系邮箱：{" "}
                <a
                  href="mailto:contact@porcelainclaire.com"
                  className="text-accent transition-colors hover:text-accent-hover"
                >
                  contact@porcelainclaire.com
                </a>
              </p>
            </section>

            <section className="space-y-3 text-[0.98rem] leading-8 text-foreground-secondary">
              <h2 className="font-display text-lg font-semibold text-foreground">
                与其他平台
              </h2>
              <p>
                部分文章同步发布于微信公众号等平台；各平台展示形式可能不同，仍以作者原创表达为准。
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
