import Image from "next/image";
import Link from "next/link";
import type { ArticleListItem } from "@/lib/articles";
import { formatDate } from "@/lib/articles";
import { formatReadingTime } from "@/lib/reading";

type ArticleCardProps = {
  article: ArticleListItem;
  /** First / hero card — larger type & layout */
  featured?: boolean;
  /** Stagger index for reveal animation */
  revealIndex?: number;
};

export function ArticleCard({
  article,
  featured = false,
  revealIndex = 0,
}: ArticleCardProps) {
  const delayMs = Math.min(revealIndex * 70, 420);

  return (
    <Link
      href={`/articles/${encodeURIComponent(article.slug)}`}
      className={`editorial-card editorial-reveal group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.6rem] transition-[border-color,box-shadow,transform] duration-300 ease-out hover:border-border-strong hover:shadow-[var(--float-shadow)] motion-reduce:transition-none ${
        featured
          ? "lg:min-h-[min(100%,30rem)]"
          : "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      }`}
      style={
        {
          animationDelay: `${delayMs}ms`,
        } as React.CSSProperties
      }
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-surface-muted ${
          featured ? "aspect-[4/3] sm:aspect-[16/9]" : "aspect-[4/3]"
        }`}
      >
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            sizes={
              featured
                ? "(max-width: 1024px) 100vw, 65vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover transition-[transform] duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading={featured ? "eager" : "lazy"}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent-light/80 to-surface-muted text-accent/35">
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/45 via-foreground/8 to-transparent opacity-85"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
          {featured ? (
            <span className="soft-pill border-white/30 bg-black/25 text-white">
              本期慢读
            </span>
          ) : (
            <span className="soft-pill border-white/20 bg-black/18 text-white/90">
              新近更新
            </span>
          )}
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col ${
          featured ? "p-5 sm:p-6 lg:p-7" : "p-5"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          <span className="reader-stat tabular-nums">
            {formatDate(article.published_at)}
          </span>
          <span className="reader-stat">
            {formatReadingTime(article.readingTimeMinutes)}
          </span>
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="文章标签">
            {article.tags.slice(0, 3).map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="tag-compact">
                {tag}
              </span>
            ))}
          </div>
        )}
        <h2
          className={`font-display mt-4 font-semibold leading-snug tracking-tight text-foreground ${
            featured
              ? "text-[1.45rem] sm:text-[1.8rem] lg:text-[2rem]"
              : "text-[1.16rem] sm:text-[1.22rem]"
          }`}
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {article.title}
        </h2>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <span className="text-sm text-foreground-tertiary">
            {featured ? "本期推荐" : "继续阅读"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none">
            阅读全文
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
              <path d="M5 12h14" />
              <path d="m13 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
