import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import sanitizeHtml from "sanitize-html";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PwaInstallCallout } from "@/components/PwaInstallCallout";
import { ReadingProgress } from "@/components/ReadingProgress";
import { WeChatButton } from "@/components/WeChatButton";
import {
  formatDate,
  getAllSlugs,
  getCachedArticleBySlug,
} from "@/lib/articles";
import {
  formatCharacterCount,
  formatReadingTime,
  prepareArticleHtml,
} from "@/lib/reading";
import {
  articleCanonicalUrl,
  formatArticleMetaTitle,
  metaDescriptionFromSummary,
} from "@/lib/seo";

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

  const canonical = articleCanonicalUrl(article.slug);
  const description = metaDescriptionFromSummary(
    article.summary,
    article.title,
  );
  const title = formatArticleMetaTitle(article.title);
  const ogImages = article.cover_image_url
    ? [{ url: article.cover_image_url }]
    : [{ url: "/opengraph-image" }];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      url: canonical,
      publishedTime: article.published_at,
      images: ogImages,
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: ogImages.map((i) => i.url),
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
    img: [
      "src",
      "alt",
      "width",
      "height",
      "loading",
      "class",
      "referrerpolicy",
    ],
    video: ["src", "controls", "poster", "width", "height"],
    source: ["src", "type"],
    "*": ["class", "style"],
  },
  // WeChat HTML often sets inline `color` for light backgrounds; keeping it
  // breaks dark mode contrast. Theme tokens (.article-content) supply text color.
  allowedStyles: {
    "*": {
      "text-align": [/.*/],
      "font-size": [/.*/],
      "line-height": [/.*/],
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

  const pageUrl = articleCanonicalUrl(article.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Porcelain Claire",
      url: "https://porcelainclaire.com",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    ...(article.cover_image_url ? { image: [article.cover_image_url] } : {}),
  };

  const cleanHtml = sanitizeHtml(article.content_html, sanitizeOptions);
  const bodyWithoutDuplicateH1 = cleanHtml
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1>/gi, "</h2>");
  // Add referrerpolicy to img tags for WeChat CDN hotlinking protection
  const withReferrerPolicy = bodyWithoutDuplicateH1.replace(
    /<img(\s[^>]*)?>/gi,
    (match, attrs) => {
      if (/referrerpolicy=/i.test(attrs)) return match;
      return `<img${attrs} referrerpolicy="no-referrer">`;
    },
  );
  const preparedArticle = prepareArticleHtml(withReferrerPolicy, {
    suppressLeadingMedia: Boolean(article.cover_image_url),
  });

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD serialized via JSON.stringify
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main-content" className="flex-1 pt-[5.35rem] sm:pt-28">
        <article className="article-shell px-4 pb-24 sm:px-6 sm:pb-28 lg:px-8">
          <ReadingProgress
            targetId="article-reading"
            headings={preparedArticle.headings}
            articleTitle={article.title}
          />

          <div className="article-layout">
            <aside className="article-sidebar">
              <Link href="/" className="desktop-back-top mb-4">
                返回文章首页
              </Link>

              <div className="article-outline">
                <p className="section-kicker">阅读地图</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="reader-stat">
                    {formatReadingTime(preparedArticle.stats.minutes)}
                  </span>
                  <span className="reader-stat">
                    {formatCharacterCount(preparedArticle.stats.characterCount)}
                  </span>
                </div>

                {preparedArticle.headings.length > 0 ? (
                  <nav className="mt-5 space-y-1" aria-label="文章目录">
                    {preparedArticle.headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className="article-outline-link"
                        data-level={heading.level}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-5 text-sm leading-7 text-foreground-secondary">
                    暂无目录
                  </p>
                )}
              </div>
            </aside>

            <div id="article-reading" className="article-column">
              <Link
                href="/"
                className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-border/75 bg-surface/80 px-4 text-sm text-foreground-secondary transition-[border-color,color,background-color] duration-200 hover:border-border-strong hover:bg-accent-soft hover:text-foreground lg:hidden"
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

              <header className="article-reading-panel relative overflow-hidden px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full blur-3xl"
                  style={{ backgroundColor: "var(--hero-glow)" }}
                  aria-hidden="true"
                />

                <p className="section-kicker">慢读现场</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="reader-stat">{article.author}</span>
                  <span className="reader-stat tabular-nums">
                    {formatDate(article.published_at)}
                  </span>
                  <span className="reader-stat">
                    {formatReadingTime(preparedArticle.stats.minutes)}
                  </span>
                  <span className="reader-stat">
                    {formatCharacterCount(preparedArticle.stats.characterCount)}
                  </span>
                </div>

                <h1
                  className="font-display mt-5 text-[2rem] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[2.6rem]"
                  style={{ textWrap: "balance" } as React.CSSProperties}
                >
                  {article.title}
                </h1>

                {article.tags && article.tags.length > 0 && (
                  <div className="mt-5">
                    <p className="section-kicker mb-3">主题标签</p>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <span key={tag} className="soft-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </header>

              {article.cover_image_url && (
                <div className="article-reading-panel relative mt-6 overflow-hidden rounded-[1.75rem]">
                  <div className="relative aspect-[4/3] sm:aspect-[16/9]">
                    <Image
                      src={article.cover_image_url}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 44rem"
                      className="object-cover"
                      preload
                    />
                  </div>
                </div>
              )}

              <div className="article-reading-panel mt-6 px-5 py-6 sm:px-8 sm:py-8">
                <div
                  className="article-content"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: article HTML is sanitized with sanitize-html above
                  dangerouslySetInnerHTML={{ __html: preparedArticle.html }}
                />
              </div>

              <div className="editorial-card mt-8 rounded-[1.6rem] p-5 sm:p-6">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="section-kicker">继续互动</p>
                      <h2 className="font-display mt-2 text-xl font-semibold text-foreground">
                        在微信里继续这次阅读
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-foreground-secondary">
                        如果你想点赞、分享、收藏或打赏，这篇文章也同步发布在微信公众号里。
                      </p>
                    </div>
                    <WeChatButton url={article.wechat_url} />
                  </div>
                  <PwaInstallCallout layout="compact" />
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
