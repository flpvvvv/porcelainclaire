import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ReadingProgress } from "@/components/ReadingProgress";
import { WeChatButton } from "@/components/WeChatButton";
import {
  getCachedArticleBySlug,
  getAllSlugs,
  formatDate,
} from "@/lib/articles";

export const revalidate = 86400;
export const maxDuration = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getCachedArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.summary ?? undefined,
    openGraph: {
      title: article.title,
      description: article.summary ?? undefined,
      type: "article",
      publishedTime: article.published_at,
      images: article.cover_image_url
        ? [{ url: article.cover_image_url }]
        : undefined,
    },
  };
}

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "figure",
    "figcaption",
    "video",
    "source",
    "section",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height", "loading", "class"],
    video: ["src", "controls", "poster", "width", "height"],
    source: ["src", "type"],
    "*": ["class", "style"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/.*/],
      "font-size": [/.*/],
      "line-height": [/.*/],
      color: [/.*/],
      "margin-top": [/.*/],
      "margin-bottom": [/.*/],
    },
  },
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const article = await getCachedArticleBySlug(slug);

  if (!article) notFound();

  const cleanHtml = sanitizeHtml(article.content_html, sanitizeOptions);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 pt-[3.35rem] sm:pt-14"
      >
        <article className="article-shell px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
          <ReadingProgress targetId="article-reading" />
          <div id="article-reading">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-foreground-tertiary transition-colors hover:text-accent"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            返回首页
          </Link>

          {article.cover_image_url && (
            <div className="relative mb-10 aspect-[16/10] overflow-hidden rounded-lg border border-border shadow-[var(--card-shadow)] sm:aspect-[2/1] sm:rounded-xl">
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 42rem"
                className="object-cover"
                priority
              />
            </div>
          )}

          <header className="mb-10 border-b border-[var(--reading-rule)] pb-8">
            <p className="font-display text-[0.7rem] font-medium tracking-[0.2em] text-foreground-tertiary sm:text-xs">
              阅读
            </p>
            <h1
              className="font-display mt-3 text-[1.65rem] font-semibold leading-[1.2] tracking-tight text-foreground sm:text-3xl lg:text-[2rem]"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              {article.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-secondary">
              <span className="font-medium text-foreground">{article.author}</span>
              <span className="text-foreground-tertiary" aria-hidden="true">
                /
              </span>
              <time
                dateTime={article.published_at}
                className="tabular-nums text-foreground-secondary"
              >
                {formatDate(article.published_at)}
              </time>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm border border-border bg-surface-muted px-2.5 py-1 text-xs text-foreground-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="article-content text-foreground"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />

          <div className="mt-14 flex flex-col items-center gap-4 rounded-lg border border-border-strong/60 bg-surface p-6 text-center shadow-[var(--card-shadow)] sm:p-8">
            <p className="text-sm text-foreground-secondary">
              喜欢这篇文章？在微信中互动
            </p>
            <WeChatButton url={article.wechat_url} />
          </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
