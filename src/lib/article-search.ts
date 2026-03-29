import { supabase } from "./supabase";

export type ParsedSearchQuery = {
  /** Free-text terms (after stripping tag / quoted syntax). */
  q: string | null;
  /** First explicit tag filter from `#…` or `tag:…`. */
  tagFilter: string | null;
};

/**
 * Parse lightweight power syntax:
 * - `#标签` or `tag:标签` → tag filter (first wins)
 * - `"短语"` → quotes removed, phrase kept as part of q
 */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  let s = raw.trim();
  if (!s) return { q: null, tagFilter: null };

  const tagFilters: string[] = [];

  s = s.replace(/\btag:\s*([^\s#]+)/gi, (_, tag: string) => {
    const t = tag.trim();
    if (t) tagFilters.push(t);
    return " ";
  });

  s = s.replace(/#([^\s#]+)/g, (_, tag: string) => {
    const t = tag.trim();
    if (t) tagFilters.push(t);
    return " ";
  });

  s = s.replace(/"([^"]+)"/g, "$1");
  s = s.replace(/\s+/g, " ").trim();

  return {
    q: s.length > 0 ? s : null,
    tagFilter: tagFilters[0] ?? null,
  };
}

export type ArticleSearchResult = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string;
  tags: string[] | null;
  reading_time_minutes: number;
  rank: number;
  match_reason: string | null;
  matched_tags: string[];
  snippet: string | null;
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export async function searchArticles(
  rawQuery: string,
  limit = DEFAULT_LIMIT,
): Promise<ArticleSearchResult[]> {
  const { q, tagFilter } = parseSearchQuery(rawQuery);
  if (q === null && tagFilter === null) return [];

  const lim = Math.min(Math.max(limit, 1), MAX_LIMIT);

  const { data, error } = await supabase.rpc("search_articles", {
    query_text: q ?? "",
    result_limit: lim,
    tag_filter: tagFilter ?? "",
  });

  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: row.summary != null ? String(row.summary) : null,
    cover_image_url:
      row.cover_image_url != null ? String(row.cover_image_url) : null,
    published_at: String(row.published_at),
    tags: Array.isArray(row.tags)
      ? (row.tags as unknown[]).map(String)
      : null,
    reading_time_minutes: Number(row.reading_time_minutes) || 1,
    rank: Number(row.rank) || 0,
    match_reason:
      row.match_reason != null ? String(row.match_reason) : null,
    matched_tags: Array.isArray(row.matched_tags)
      ? (row.matched_tags as unknown[]).map(String)
      : [],
    snippet: row.snippet != null ? String(row.snippet) : null,
  }));
}

export type SuggestedArticle = Pick<
  ArticleSearchResult,
  "slug" | "title" | "published_at" | "tags"
>;

/** Recent articles + tag frequency for empty search state (no RPC). */
export async function getSearchSuggestions(): Promise<{
  recent: SuggestedArticle[];
  popularTags: string[];
}> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug,title,published_at,tags")
    .order("published_at", { ascending: false })
    .limit(64);

  if (error) throw error;

  const rows = (data ?? []) as {
    slug: string;
    title: string;
    published_at: string;
    tags: string[] | null;
  }[];

  const recent: SuggestedArticle[] = rows.slice(0, 8).map((r) => ({
    slug: r.slug,
    title: r.title,
    published_at: r.published_at,
    tags: r.tags,
  }));

  const tagCounts = new Map<string, number>();
  for (const r of rows) {
    for (const t of r.tags ?? []) {
      if (!t) continue;
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }

  const popularTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t);

  return { recent, popularTags };
}
