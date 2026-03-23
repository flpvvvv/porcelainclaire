create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at
  before update on articles
  for each row
  execute function set_updated_at();

-- slug UNIQUE constraint already creates an implicit B-tree index
drop index if exists idx_articles_slug;
