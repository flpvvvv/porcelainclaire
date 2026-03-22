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

const ARTICLES_PER_PAGE = 12;

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

export async function getArticles(page = 1): Promise<{
  articles: Article[];
  total: number;
  totalPages: number;
}> {
  const from = (page - 1) * ARTICLES_PER_PAGE;
  const to = from + ARTICLES_PER_PAGE - 1;

  const { count } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const total = count ?? 0;

  return {
    articles: data ?? [],
    total,
    totalPages: Math.ceil(total / ARTICLES_PER_PAGE),
  };
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | null> {
  const normalized = normalizeArticleSlugParam(slug);
  const collapsed = normalized.includes("-")
    ? normalized.replace(/-/g, "")
    : normalized;

  const trySlugs =
    collapsed === normalized
      ? [normalized]
      : [normalized, collapsed];

  for (const candidate of trySlugs) {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") continue;
      throw error;
    }
    if (data) return data;
  }

  return null;
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
