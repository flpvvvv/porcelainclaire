-- GIN index for array containment queries (e.g. tags @> ARRAY['tag']).
CREATE INDEX IF NOT EXISTS idx_articles_tags_gin ON public.articles USING gin (tags);

-- Global tag frequencies across all articles (for homepage word cloud).
CREATE OR REPLACE FUNCTION public.get_tag_cloud(result_limit int DEFAULT 60)
RETURNS TABLE (
  tag text,
  article_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    u.t AS tag,
    count(*)::bigint AS article_count
  FROM public.articles a,
       unnest(coalesce(a.tags, array[]::text[])) AS u(t)
  WHERE nullif(trim(u.t), '') IS NOT NULL
  GROUP BY u.t
  ORDER BY count(*) DESC, u.t ASC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 60), 1), 200);
$$;

GRANT EXECUTE ON FUNCTION public.get_tag_cloud(integer) TO anon, authenticated;
