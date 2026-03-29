-- Weighted article search: tags > title > summary > content (tie-break: published_at desc).
-- Requires pg_trgm for similarity(); ILIKE still helps CJK substring matches.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_text text;

-- Backfill plain text from HTML for existing rows.
UPDATE articles
SET content_text = trim(
  regexp_replace(
    regexp_replace(coalesce(content_html, ''), '<[^>]+>', ' ', 'g'),
    E'[[:space:]]+',
    ' ',
    'g'
  )
)
WHERE content_text IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_articles_summary_trgm ON articles USING gin (summary gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_articles_content_text_trgm ON articles USING gin (content_text gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_articles(
  query_text text,
  result_limit int DEFAULT 10,
  tag_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  summary text,
  cover_image_url text,
  published_at timestamptz,
  tags text[],
  reading_time_minutes int,
  rank double precision,
  match_reason text,
  matched_tags text[],
  snippet text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      nullif(trim(coalesce(query_text, '')), '') AS q,
      nullif(trim(coalesce(tag_filter, '')), '') AS tf
  ),
  base AS (
    SELECT
      a.id,
      a.slug,
      a.title,
      a.summary,
      a.cover_image_url,
      a.published_at,
      a.tags,
      a.content_text,
      p.q,
      p.tf,
      -- Tag intent filter: must match at least one tag when tf is set.
      (p.tf IS NULL OR EXISTS (
        SELECT 1
        FROM unnest(coalesce(a.tags, array[]::text[])) AS t0(t0)
        WHERE t0 ILIKE '%' || p.tf || '%'
      )) AS passes_tf,
      -- Text query: any field (or q unset).
      (p.q IS NULL OR a.title ILIKE '%' || p.q || '%'
        OR coalesce(a.summary, '') ILIKE '%' || p.q || '%'
        OR coalesce(a.content_text, '') ILIKE '%' || p.q || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(a.tags, array[]::text[])) AS t1(t1)
          WHERE t1 ILIKE '%' || p.q || '%'
        )) AS passes_q
    FROM articles a
    CROSS JOIN params p
    WHERE (p.q IS NOT NULL OR p.tf IS NOT NULL)
  ),
  filtered AS (
    SELECT *
    FROM base
    WHERE passes_tf AND passes_q
  ),
  scored AS (
    SELECT
      f.id,
      f.slug,
      f.title,
      f.summary,
      f.cover_image_url,
      f.published_at,
      f.tags,
      GREATEST(1, (length(coalesce(f.content_text, '')) / 400)::int) AS reading_time_minutes,
      -- Strong boost when user narrowed by tag_filter and a tag matches.
      (CASE
        WHEN f.tf IS NOT NULL AND EXISTS (
          SELECT 1
          FROM unnest(coalesce(f.tags, array[]::text[])) AS tx(tx)
          WHERE tx ILIKE '%' || f.tf || '%'
        ) THEN 50000::double precision
        ELSE 0::double precision
      END) AS tf_boost,
      -- Query matched against tags (ordered: better exact/prefix; earlier tags slightly higher).
      coalesce((
        SELECT max(
          CASE
            WHEN lower(u.t) = lower(f.q) THEN (10000::double precision - (u.ord - 1) * 100::double precision)
            WHEN u.t ILIKE f.q || '%' AND char_length(f.q) >= 1 THEN (8500::double precision - (u.ord - 1) * 100::double precision)
            WHEN u.t ILIKE '%' || f.q || '%' THEN (7000::double precision - (u.ord - 1) * 100::double precision)
            ELSE 0::double precision
          END
        )
        FROM unnest(coalesce(f.tags, array[]::text[])) WITH ORDINALITY AS u(t, ord)
        WHERE f.q IS NOT NULL
      ), 0::double precision) AS tag_q_score,
      (CASE
        WHEN f.q IS NULL THEN 0::double precision
        WHEN lower(f.title) = lower(f.q) THEN 3500::double precision
        WHEN lower(f.title) LIKE lower(f.q) || '%' THEN 3000::double precision
        WHEN f.title ILIKE '%' || f.q || '%' THEN 2500::double precision
        ELSE 0::double precision
      END + CASE
        WHEN f.q IS NOT NULL THEN similarity(coalesce(f.title, ''), f.q) * 400::double precision
        ELSE 0::double precision
      END) AS title_part,
      (CASE
        WHEN f.q IS NOT NULL AND coalesce(f.summary, '') ILIKE '%' || f.q || '%' THEN 1200::double precision
        ELSE 0::double precision
      END + CASE
        WHEN f.q IS NOT NULL THEN similarity(coalesce(f.summary, ''), f.q) * 250::double precision
        ELSE 0::double precision
      END) AS summary_part,
      (CASE
        WHEN f.q IS NOT NULL AND coalesce(f.content_text, '') ILIKE '%' || f.q || '%' THEN 400::double precision
        ELSE 0::double precision
      END + CASE
        WHEN f.q IS NOT NULL THEN similarity(coalesce(f.content_text, ''), f.q) * 80::double precision
        ELSE 0::double precision
      END) AS content_part,
      coalesce(
        (
          SELECT array_agg(x ORDER BY x)
          FROM (
            SELECT DISTINCT m.t AS x
            FROM unnest(coalesce(f.tags, array[]::text[])) AS m(t)
            WHERE (f.q IS NOT NULL AND m.t ILIKE '%' || f.q || '%')
               OR (f.tf IS NOT NULL AND m.t ILIKE '%' || f.tf || '%')
          ) sub
        ),
        ARRAY[]::text[]
      ) AS matched_tags,
      (
        CASE
          WHEN f.q IS NOT NULL
            AND char_length(f.q) > 0
            AND strpos(lower(coalesce(f.content_text, '')), lower(f.q)) > 0
          THEN substr(
            coalesce(f.content_text, ''),
            greatest(1, strpos(lower(coalesce(f.content_text, '')), lower(f.q)) - 40),
            220
          )
          ELSE left(coalesce(nullif(trim(f.summary), ''), f.content_text, ''), 200)
        END
      ) AS snippet
    FROM filtered f
  ),
  final AS (
    SELECT
      s.id,
      s.slug,
      s.title,
      s.summary,
      s.cover_image_url,
      s.published_at,
      s.tags,
      s.reading_time_minutes,
      (s.tf_boost + s.tag_q_score + s.title_part + s.summary_part + s.content_part) AS rnk,
      trim(
        both ' · '
        FROM concat_ws(
          ' · ',
          CASE WHEN (s.tf_boost + s.tag_q_score) > 0 THEN '标签命中' END,
          CASE WHEN s.title_part > 0 THEN '标题命中' END,
          CASE WHEN s.summary_part > 0 THEN '摘要命中' END,
          CASE WHEN s.content_part > 0 THEN '正文命中' END
        )
      ) AS match_reason,
      s.matched_tags,
      s.snippet
    FROM scored s
  )
  SELECT
    f.id,
    f.slug,
    f.title,
    f.summary,
    f.cover_image_url,
    f.published_at,
    f.tags,
    f.reading_time_minutes,
    f.rnk AS rank,
    nullif(f.match_reason, '') AS match_reason,
    f.matched_tags,
    f.snippet
  FROM final f
  ORDER BY f.rnk DESC, f.published_at DESC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 10), 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.search_articles(text, integer, text) TO anon, authenticated;
