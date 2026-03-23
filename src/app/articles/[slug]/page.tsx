import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WeChatButton } from "@/components/WeChatButton";
import {
  getArticleBySlug,
  getArticleMetadataBySlug,
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
  const article = await getArticleMetadataBySlug(slug);
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
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const cleanHtml = sanitizeHtml(article.content_html, sanitizeOptions);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-secondary transition-colors hover:text-accent"
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
            <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-xl">
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <header className="mb-8">
            <h1
              className="text-2xl font-bold leading-tight text-foreground sm:text-3xl"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              {article.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-foreground-secondary">
              <span>{article.author}</span>
              <span aria-hidden="true">&middot;</span>
              <time
                dateTime={article.published_at}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatDate(article.published_at)}
              </time>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs text-accent"
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

          <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 text-center">
            <p className="text-sm text-foreground-secondary">
              喜欢这篇文章？在微信中互动
            </p>
            <WeChatButton url={article.wechat_url} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
