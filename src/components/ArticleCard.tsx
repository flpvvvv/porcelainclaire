import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/articles";
import { formatDate } from "@/lib/articles";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/articles/${encodeURIComponent(article.slug)}`}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-accent-light">
        {article.cover_image_url ? (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-accent/40">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <time
          dateTime={article.published_at}
          className="text-xs text-foreground-secondary"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatDate(article.published_at)}
        </time>
        <h2
          className="mt-1.5 text-lg font-semibold leading-snug text-foreground"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {article.title}
        </h2>
        {article.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-foreground-secondary">
            {article.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
