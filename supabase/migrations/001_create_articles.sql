create table if not exists articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  summary       text,
  content_html  text not null,
  cover_image_url text,
  wechat_url    text not null,
  author        text default 'Claire',
  published_at  timestamptz not null,
  tags          text[],
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_articles_published_at on articles (published_at desc);
create index if not exists idx_articles_slug on articles (slug);

alter table articles enable row level security;

create policy "Allow public read access"
  on articles for select
  to anon
  using (true);
