import { supabase } from "./supabase";

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content_html: string;
  cover_image_url: string | null;
  wechat_url: string;
  author: string;
  published_at: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export type ArticleMetadata = Pick<
  Article,
  "slug" | "title" | "summary" | "cover_image_url" | "published_at"
>;

export type ArticleListItem = Pick<
  Article,
  "id" | "slug" | "title" | "summary" | "cover_image_url" | "published_at"
>;

const ARTICLES_PER_PAGE = 12;
const ARTICLE_METADATA_COLUMNS =
  "slug,title,summary,cover_image_url,published_at";
const ARTICLE_LIST_COLUMNS =
  "id,slug,title,summary,cover_image_url,published_at";

/** Dynamic route params may arrive percent-encoded; DB slugs are stored decoded (UTF-8). */
function normalizeArticleSlugParam(slug: string): string {
  let out = slug;
  for (let i = 0; i < 8; i++) {
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  return out;
}

function getArticleSlugCandidates(slug: string): string[] {
  const normalized = normalizeArticleSlugParam(slug);
  const collapsed = normalized.includes("-")
    ? normalized.replace(/-/g, "")
    : normalized;

  return collapsed === normalized ? [normalized] : [normalized, collapsed];
}

async function queryArticleBySlug<T>(
  slug: string,
  columns = "*",
): Promise<T | null> {
  for (const candidate of getArticleSlugCandidates(slug)) {
    const { data, error } = await supabase
      .from("articles")
      .select(columns)
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") continue;
      throw error;
    }
    if (data) return data as T;
  }

  return null;
}

export async function getArticles(cursor?: string): Promise<{
  articles: ArticleListItem[];
  hasMore: boolean;
  nextCursor: string | null;
}> {
  let query = supabase
    .from("articles")
    .select(ARTICLE_LIST_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(ARTICLES_PER_PAGE + 1);

  if (cursor) {
    query = query.lt("published_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const articles = (data ?? []) as ArticleListItem[];
  const hasMore = articles.length > ARTICLES_PER_PAGE;
  if (hasMore) articles.pop();

  return {
    articles,
    hasMore,
    nextCursor:
      hasMore && articles.length > 0
        ? articles[articles.length - 1].published_at
        : null,
  };
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  return queryArticleBySlug<Article>(slug);
}

export async function getArticleMetadataBySlug(
  slug: string,
): Promise<ArticleMetadata | null> {
  return queryArticleBySlug<ArticleMetadata>(slug, ARTICLE_METADATA_COLUMNS);
}

export async function getAllSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((a) => a.slug);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}
