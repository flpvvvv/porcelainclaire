import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticles } from "@/lib/articles";
import type { ArticleListItem } from "@/lib/articles";
import Link from "next/link";

export const revalidate = 3600;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const params = await searchParams;
  const cursor = params.cursor || undefined;

  let articles: ArticleListItem[] = [];
  let hasMore = false;
  let nextCursor: string | null = null;
  let fetchError = false;

  try {
    const result = await getArticles(cursor);
    articles = result.articles;
    hasMore = result.hasMore;
    nextCursor = result.nextCursor;
  } catch {
    fetchError = true;
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            文章
          </h1>
          <p className="mt-2 text-foreground-secondary">
            记录生活，分享思考
          </p>

          {fetchError ? (
            <div className="mt-12 rounded-lg border border-border bg-surface p-8 text-center">
              <p className="text-foreground-secondary">
                暂时无法加载文章，请稍后再试。
              </p>
            </div>
          ) : articles.length === 0 ? (
            <div className="mt-12 rounded-lg border border-border bg-surface p-8 text-center">
              <p className="text-foreground-secondary">暂无文章</p>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {(cursor || hasMore) && (
                <nav
                  className="mt-10 flex items-center justify-center gap-4"
                  aria-label="分页"
                >
                  {cursor && (
                    <Link
                      href="/"
                      className="rounded-md border border-border px-4 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground"
                    >
                      ← 最新文章
                    </Link>
                  )}
                  {hasMore && nextCursor && (
                    <Link
                      href={`/?cursor=${encodeURIComponent(nextCursor)}`}
                      className="rounded-md border border-border px-4 py-2 text-sm text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground"
                    >
                      更早文章 →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
