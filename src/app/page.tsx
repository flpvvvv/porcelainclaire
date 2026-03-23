import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticles, type ArticleListItem } from "@/lib/articles";
import Link from "next/link";

export const revalidate = 3600;

function ArticleListSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={i === 0 ? "lg:col-span-8 lg:row-span-2" : "lg:col-span-4"}
        >
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--card-shadow)]">
            <div
              className={`animate-pulse bg-accent-light/90 ${
                i === 0
                  ? "aspect-[16/10] sm:aspect-[21/9]"
                  : "aspect-[16/10]"
              }`}
            />
            <div className={`space-y-3 ${i === 0 ? "p-6" : "p-5"}`}>
              <div className="h-3 w-24 animate-pulse rounded bg-accent-light" />
              <div
                className={`animate-pulse rounded bg-accent-light ${
                  i === 0 ? "h-8 w-full" : "h-5 w-full"
                }`}
              />
              <div className="h-4 w-[80%] animate-pulse rounded bg-accent-light" />
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
      <div className="mt-14 rounded-lg border border-border bg-surface p-10 text-center shadow-[var(--card-shadow)]">
        <p className="text-foreground-secondary">
          暂时无法加载文章，请稍后再试。
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="mt-14 rounded-lg border border-border bg-surface p-10 text-center shadow-[var(--card-shadow)]">
        <p className="text-foreground-secondary">暂无文章</p>
      </div>
    );
  }

  const showFeatured = !cursor;

  return (
    <>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
        {articles.map((article, i) => (
          <div
            key={article.id}
            className={
              showFeatured && i === 0
                ? "lg:col-span-8 lg:row-span-2"
                : "lg:col-span-4"
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
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
          aria-label="分页"
        >
          {cursor && (
            <Link
              href="/"
              className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground-secondary shadow-[var(--card-shadow)] transition-colors hover:border-border-strong hover:text-foreground"
            >
              ← 最新文章
            </Link>
          )}
          {hasMore && nextCursor && (
            <Link
              href={`/?cursor=${encodeURIComponent(nextCursor)}`}
              className="rounded-md border border-transparent bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
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
      <main
        id="main-content"
        className="flex-1 pt-[3.35rem] sm:pt-14"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <header className="relative max-w-2xl lg:max-w-3xl">
            <p className="text-[0.7rem] font-medium tracking-[0.28em] text-foreground-tertiary sm:text-xs">
              专栏
            </p>
            <h1
              className="font-display mt-3 text-[2rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              文章
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-foreground-secondary sm:text-lg">
              记录生活，分享思考。
            </p>
            <div
              className="mt-8 h-px w-16 bg-gradient-to-r from-accent to-transparent sm:w-24"
              aria-hidden="true"
            />
          </header>
          <Suspense key={cursor ?? ""} fallback={<ArticleListSkeleton />}>
            <ArticleList cursor={cursor} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
