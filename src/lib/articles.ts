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
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
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
