import Image from "next/image";
import Link from "next/link";
import type { ArticleListItem } from "@/lib/articles";
import { formatDate } from "@/lib/articles";

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
      className={`editorial-reveal group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--card-shadow)] transition-[border-color,box-shadow,transform] duration-300 ease-out hover:border-border-strong hover:shadow-lg motion-reduce:transition-none ${
        featured
          ? "ring-1 ring-border/40 lg:min-h-[min(100%,28rem)]"
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
          featured ? "aspect-[16/10] sm:aspect-[21/9]" : "aspect-[16/10]"
        }`}
      >
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            sizes={
              featured
                ? "(max-width: 1024px) 100vw, 66vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover transition-[transform] duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
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
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </div>

      <div className={`flex flex-1 flex-col ${featured ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}>
        <time
          dateTime={article.published_at}
          className="text-[0.7rem] font-medium tracking-wide text-foreground-tertiary tabular-nums sm:text-xs"
        >
          {formatDate(article.published_at)}
        </time>
        <h2
          className={`font-display mt-2 font-semibold leading-snug tracking-tight text-foreground ${
            featured ? "text-xl sm:text-2xl lg:text-[1.65rem]" : "text-lg sm:text-[1.05rem]"
          }`}
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {article.title}
        </h2>
        {article.summary && (
          <p
            className={`mt-2.5 leading-relaxed text-foreground-secondary ${
              featured
                ? "line-clamp-3 text-[0.95rem] sm:text-base"
                : "line-clamp-2 text-sm"
            }`}
          >
            {article.summary}
          </p>
        )}
        <span className="mt-auto pt-4 text-xs font-medium text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:opacity-100">
          阅读全文 →
        </span>
      </div>
    </Link>
  );
}
