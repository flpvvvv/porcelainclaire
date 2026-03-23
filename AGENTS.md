<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Porcelain Claire

Personal blog (个人博客); articles are synced from WeChat into Supabase.

- **App**: Next.js (App Router), React 19, TypeScript, Tailwind CSS v4 — see `app/`.
- **Data**: Supabase (PostgreSQL); SQL migrations in `supabase/migrations/`.
- **Sync**: Python package under `sync/` (uv); imports WeChat URLs or RSS into the database.

Human-facing setup, env vars, and commands: [README.md](./README.md).
