import { SITE_URL } from "./site";

const TITLE_SUFFIX = " | Porcelain Claire";

/** Approximate character bounds for meta titles (Squirrel core/meta-title). */
const TITLE_MIN = 30;
const TITLE_MAX = 60;

function truncateTitleChars(text: string, maxChars: number): string {
  const chars = Array.from(text);
  if (chars.length <= maxChars) return text;
  const inner = maxChars - 1;
  return `${chars.slice(0, inner).join("")}…`;
}

/**
 * Build a meta title within common SEO length bounds.
 */
export function formatArticleMetaTitle(articleTitle: string): string {
  const full = `${articleTitle}${TITLE_SUFFIX}`;
  if (full.length >= TITLE_MIN && full.length <= TITLE_MAX) return full;
  if (full.length < TITLE_MIN) {
    const padded = `${articleTitle} — 慢读文字 · 个人博客${TITLE_SUFFIX}`;
    return truncateTitleChars(padded, TITLE_MAX);
  }
  const budget = TITLE_MAX - TITLE_SUFFIX.length;
  return `${truncateTitleChars(articleTitle, budget)}${TITLE_SUFFIX}`;
}

/**
 * Meta description between ~120–160 chars for core/meta-description rules.
 */
export function metaDescriptionFromSummary(
  summary: string | null | undefined,
  articleTitle: string,
): string {
  const fallback =
    `「${articleTitle}」收录于 Porcelain Claire 个人博客：记录生活与瓷器文化相关的阅读与思考；文章同步自微信公众号，本站提供更安静、更适合慢读的排版与体验。转载请注明出处。`;
  let text = (summary?.trim() || fallback).replace(/\s+/g, " ");

  if (text.length < 120) {
    text = `${text} 本站内容为原创，转载请注明作者与原文链接。`.replace(
      /\s+/g,
      " ",
    );
  }
  if (text.length > 160) {
    text = `${truncateTitleChars(text, 157)}…`;
  }
  if (text.length < 120) {
    text = truncateTitleChars(fallback.replace(/\s+/g, " "), 160);
  }
  return text;
}

export function articleCanonicalUrl(slug: string): string {
  return `${SITE_URL}/articles/${encodeURIComponent(slug)}`;
}
