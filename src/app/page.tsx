import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PwaInstallCallout } from "@/components/PwaInstallCallout";
import { TagCloudSection } from "@/components/TagCloudSection";
import {
  type ArticleListItem,
  getArticleCountByTag,
  getArticles,
} from "@/lib/articles";
import { SITE_URL } from "@/lib/site";
import { getTagCloud } from "@/lib/tags";

export const revalidate = 3600;

const HOME_DESCRIPTION =
  "Porcelain Claire（Claire）的个人博客：记录生活、瓷器文化与日常思考。文章同步自微信公众号，本站提供更安静、更适合慢读的排版与阅读体验。";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string; tag?: string }>;
}): Promise<Metadata> {
  const { cursor, tag } = await searchParams;

  if (tag) {
    const title = cursor
      ? `标签「${tag}」· 更早的文章 | Porcelain Claire`
      : `标签「${tag}」· 文章列表 | Porcelain Claire`;
    const description = cursor
      ? `按标签「${tag}」继续翻阅更早发布的文章。${HOME_DESCRIPTION}`
      : `浏览 Porcelain Claire 博客中包含「${tag}」标签的文章列表。${HOME_DESCRIPTION}`;
    const canonical = new URL("/", SITE_URL);
    canonical.searchParams.set("tag", tag);
    if (cursor) canonical.searchParams.set("cursor", cursor);
    const d =
      description.length > 160 ? `${description.slice(0, 157)}…` : description;
    return {
      title,
      description: d,
      alternates: { canonical: canonical.toString() },
      openGraph: {
        title,
        description: d,
        url: canonical.toString(),
      },
      twitter: { title, description: d },
    };
  }

  if (cursor) {
    const title = "更早的文章 · 存档 | Porcelain Claire";
    const description = `继续翻阅 Porcelain Claire 更早发布的文章。${HOME_DESCRIPTION}`;
    const d =
      description.length > 160 ? `${description.slice(0, 157)}…` : description;
    const canonical = `${SITE_URL}/?cursor=${encodeURIComponent(cursor)}`;
    return {
      title,
      description: d,
      alternates: { canonical },
      openGraph: { title, description: d, url: canonical },
      twitter: { title, description: d },
    };
  }

  return {
    title: "写给愿意慢慢读的人",
    description: HOME_DESCRIPTION,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: "Porcelain Claire — 写给愿意慢慢读的人",
      description: HOME_DESCRIPTION,
      url: SITE_URL,
    },
    twitter: {
      title: "Porcelain Claire — 写给愿意慢慢读的人",
      description: HOME_DESCRIPTION,
    },
  };
}

function ArticleListSkeleton({ uniform }: { uniform?: boolean }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-8">
      {["hero", "b", "c", "d", "e", "f"].map((slot, i) => (
        <div
          key={slot}
          className={
            uniform || i !== 0
              ? "lg:col-span-5 xl:col-span-4"
              : "lg:col-span-7 lg:row-span-2"
          }
        >
          <div className="editorial-card overflow-hidden rounded-[1.6rem]">
            <div
              className={`animate-pulse bg-accent-light/90 ${
                !uniform && i === 0
                  ? "aspect-[4/3] sm:aspect-[16/9]"
                  : "aspect-[4/3]"
              }`}
            />
            <div className={`space-y-3 ${!uniform && i === 0 ? "p-6" : "p-5"}`}>
              <div className="h-9 w-48 animate-pulse rounded-full bg-accent-light" />
              <div
                className={`animate-pulse rounded bg-accent-light ${
                  !uniform && i === 0 ? "h-9 w-full" : "h-6 w-full"
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

function tagHref(tag: string, cursor?: string) {
  const base = `/?tag=${encodeURIComponent(tag)}`;
  return cursor ? `${base}&cursor=${encodeURIComponent(cursor)}` : base;
}

async function ArticleList({
  cursor,
  tag,
  totalCount,
}: {
  cursor?: string;
  tag?: string;
  totalCount: number | null;
}) {
  let articles: ArticleListItem[] = [];
  let hasMore = false;
  let nextCursor: string | null = null;

  try {
    const result = await getArticles(cursor, tag ? { tag } : undefined);
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
    if (tag) {
      return (
        <div className="editorial-card mt-8 rounded-[1.6rem] p-10 text-center">
          <p className="text-foreground-secondary">
            还没有带标签「{tag}」的文章。
          </p>
          <Link
            href="/"
            scroll={false}
            className="mt-6 inline-flex min-h-11 items-center rounded-full border border-border bg-surface/85 px-5 text-sm font-medium text-foreground-secondary transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground"
          >
            查看全部文章
          </Link>
        </div>
      );
    }
    return (
      <div className="editorial-card mt-8 rounded-[1.6rem] p-10 text-center">
        <p className="text-foreground-secondary">暂无文章</p>
      </div>
    );
  }

  const showFeatured = !cursor && !tag;

  return (
    <>
      {tag ? (
        <p className="mt-4 text-sm text-foreground-secondary">
          本页展示{" "}
          <span className="font-medium text-foreground">{articles.length}</span>
          {totalCount != null && totalCount > articles.length
            ? ` / 共 ${totalCount} 篇`
            : totalCount != null && totalCount === articles.length
              ? " / 已全部列出"
              : null}
          。
        </p>
      ) : null}

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
              href={tag ? `/?tag=${encodeURIComponent(tag)}` : "/"}
              scroll={false}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface/85 px-5 text-sm font-medium text-foreground-secondary shadow-[var(--card-shadow)] transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground"
            >
              {tag ? "← 本标签最新" : "← 最新文章"}
            </Link>
          )}
          {hasMore && nextCursor && (
            <Link
              href={
                tag
                  ? tagHref(tag, nextCursor)
                  : `/?cursor=${encodeURIComponent(nextCursor)}`
              }
              scroll={false}
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
  searchParams: Promise<{ cursor?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const cursor = params.cursor || undefined;
  const tagRaw = params.tag?.trim();
  const tag = tagRaw || undefined;

  const [tagCloud, tagTotalCount] = await Promise.all([
    getTagCloud(160),
    tag ? getArticleCountByTag(tag) : Promise.resolve(null),
  ]);

  const suspenseKey = `${tag ?? ""}:${cursor ?? ""}`;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 pt-[5.35rem] sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <section className="max-w-3xl">
            <p className="section-kicker">Porcelain Claire</p>
            <h1
              className="font-display mt-4 text-[2.55rem] font-semibold leading-[1.04] tracking-tight text-foreground sm:text-[3.6rem] lg:text-[4.45rem]"
              style={{ textWrap: "balance" } satisfies CSSProperties}
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
                href="#tag-cloud"
                className="inline-flex min-h-12 items-center rounded-full border border-border bg-surface/80 px-5 text-sm font-medium text-foreground-secondary transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground"
              >
                按标签找文
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

          <div id="tag-cloud">
            <TagCloudSection items={tagCloud} activeTag={tag} />
          </div>

          <section id="latest-articles" className="mt-14 sm:mt-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">
                  {tag
                    ? cursor
                      ? "继续翻阅"
                      : "按标签阅读"
                    : cursor
                      ? "继续翻阅"
                      : "最近更新"}
                </p>
                <h2 className="font-display mt-3 text-[1.9rem] font-semibold tracking-tight text-foreground sm:text-[2.4rem]">
                  {tag ? (
                    <>
                      <span className="text-accent">#{tag}</span>
                      {tagTotalCount != null ? (
                        <span className="mt-1 block text-[1.05rem] font-normal text-foreground-secondary sm:text-[1.15rem]">
                          共 {tagTotalCount} 篇
                        </span>
                      ) : null}
                    </>
                  ) : cursor ? (
                    "再往前读一些"
                  ) : (
                    "慢读书架"
                  )}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-foreground-secondary">
                {tag
                  ? cursor
                    ? "在同一标签下继续往前翻。"
                    : "以下文章都包含你选中的标签。"
                  : cursor
                    ? "更早的文字依次向前展开。"
                    : "从最新一篇开始读起。"}
              </p>
            </div>

            {tag ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-foreground-secondary">
                  筛选中
                </span>
                <span className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                  #{tag}
                </span>
                <Link
                  href="/"
                  scroll={false}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface/85 px-4 text-sm font-medium text-foreground-secondary transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground"
                >
                  清除筛选
                </Link>
              </div>
            ) : null}

            <Suspense
              key={suspenseKey}
              fallback={<ArticleListSkeleton uniform={Boolean(tag)} />}
            >
              <ArticleList
                cursor={cursor}
                tag={tag}
                totalCount={tagTotalCount}
              />
            </Suspense>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
