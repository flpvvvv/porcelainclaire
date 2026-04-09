import { supabase } from "./supabase";

export type TagCloudItem = {
  tag: string;
  articleCount: number;
};

const DEFAULT_CLOUD_LIMIT = 60;
const MAX_CLOUD_LIMIT = 200;

/**
 * Tag frequencies across all published articles (via Supabase RPC).
 */
export async function getTagCloud(
  limit = DEFAULT_CLOUD_LIMIT,
): Promise<TagCloudItem[]> {
  const lim = Math.min(
    Math.max(limit, 1),
    MAX_CLOUD_LIMIT,
  );

  const { data, error } = await supabase.rpc("get_tag_cloud", {
    result_limit: lim,
  });

  if (error) throw error;

  const rows = (data ?? []) as { tag: string; article_count: number | string }[];

  return rows.map((row) => ({
    tag: row.tag,
    articleCount:
      typeof row.article_count === "string"
        ? Number.parseInt(row.article_count, 10)
        : row.article_count,
  }));
}

/** Top tags by global frequency (same source as word cloud). */
export async function getPopularTags(limit = 12): Promise<string[]> {
  const items = await getTagCloud(limit);
  return items.map((i) => i.tag);
}
