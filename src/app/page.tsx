import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { PwaInstallCallout } from "@/components/PwaInstallCallout";
import { getArticles, type ArticleListItem } from "@/lib/articles";

export const revalidate = 3600;

function ArticleListSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-8">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={i === 0 ? "lg:col-span-7 lg:row-span-2" : "lg:col-span-5 xl:col-span-4"}
        >
          <div className="editorial-card overflow-hidden rounded-[1.6rem]">
            <div
              className={`animate-pulse bg-accent-light/90 ${
                i === 0
                  ? "aspect-[4/3] sm:aspect-[16/9]"
                  : "aspect-[4/3]"
              }`}
            />
            <div className={`space-y-3 ${i === 0 ? "p-6" : "p-5"}`}>
              <div className="h-9 w-48 animate-pulse rounded-full bg-accent-light" />
              <div
                className={`animate-pulse rounded bg-accent-light ${
                  i === 0 ? "h-9 w-full" : "h-6 w-full"
                }`}
              />
              <div className="h-4 w-[80%] animate-pulse rounded bg-accent-light" />
              <div className="h-4 w-[65%] animate-pulse rounded bg-accent-light" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function ArticleList({ cursor }: { cursor?: string }) {
  let articles: ArticleListItem[] = [];
  let hasMore = false;
  let nextCursor: string | null = null;

  try {
    const result = await getArticles(cursor);
    articles = result.articles;
    hasMore = result.hasMore;
    nextCursor = result.nextCursor;
  } catch {
    return (
      <div className="editorial-card mt-8 rounded-[1.6rem] p-10 text-center">
        <p className="text-foreground-secondary">
          暂时无法加载文章，请稍后再试。
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="editorial-card mt-8 rounded-[1.6rem] p-10 text-center">
        <p className="text-foreground-secondary">暂无文章</p>
      </div>
    );
  }

  const showFeatured = !cursor;

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-8">
        {articles.map((article, i) => (
          <div
            key={article.id}
            className={
              showFeatured && i === 0
                ? "lg:col-span-7 lg:row-span-2"
                : "lg:col-span-5 xl:col-span-4"
            }
          >
            <ArticleCard
              article={article}
              featured={showFeatured && i === 0}
              revealIndex={i}
            />
          </div>
        ))}
      </div>

      {(cursor || hasMore) && (
        <nav
          className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:mt-14"
          aria-label="分页"
        >
          {cursor && (
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface/85 px-5 text-sm font-medium text-foreground-secondary shadow-[var(--card-shadow)] transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground"
            >
              ← 最新文章
            </Link>
          )}
          {hasMore && nextCursor && (
            <Link
              href={`/?cursor=${encodeURIComponent(nextCursor)}`}
              className="inline-flex min-h-11 items-center rounded-full border border-transparent bg-accent px-5 text-sm font-medium text-accent-foreground shadow-[var(--float-shadow)] transition-colors hover:bg-accent-hover"
            >
              更早文章 →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const params = await searchParams;
  const cursor = params.cursor || undefined;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 pt-[5.35rem] sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <section className="max-w-3xl">
            <p className="section-kicker">Porcelain Claire</p>
            <h1
              className="font-display mt-4 text-[2.55rem] font-semibold leading-[1.04] tracking-tight text-foreground sm:text-[3.6rem] lg:text-[4.45rem]"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              写给愿意慢慢读的人
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-foreground-secondary sm:text-[1.08rem]">
              记录生活，分享思考。希望文字与页面都足够安静，让你愿意在这里多停留一会儿。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#latest-articles"
                className="inline-flex min-h-12 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground shadow-[var(--float-shadow)] transition-colors hover:bg-accent-hover"
              >
                开始阅读
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-12 items-center rounded-full border border-border bg-surface/80 px-5 text-sm font-medium text-foreground-secondary transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground"
              >
                认识 Claire
              </Link>
            </div>
            <PwaInstallCallout layout="full" />
            <div className="mt-10 max-w-sm">
              <div className="editorial-divider" aria-hidden="true" />
            </div>
          </section>

          <section id="latest-articles" className="mt-14 sm:mt-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">
                  {cursor ? "继续翻阅" : "最近更新"}
                </p>
                <h2 className="font-display mt-3 text-[1.9rem] font-semibold tracking-tight text-foreground sm:text-[2.4rem]">
                  {cursor ? "再往前读一些" : "慢读书架"}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-foreground-secondary">
                {cursor ? "更早的文字依次向前展开。" : "从最新一篇开始读起。"}
              </p>
            </div>

            <Suspense key={cursor ?? ""} fallback={<ArticleListSkeleton />}>
              <ArticleList cursor={cursor} />
            </Suspense>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
