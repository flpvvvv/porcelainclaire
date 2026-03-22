-- Hyphens inside /articles/[slug] caused 500s on Vercel for some posts.
-- New imports use hyphen-free slugs (see sync _slugify). Collapse legacy slugs.
update articles
set slug = replace(slug, '-', '')
where slug like '%-%';
