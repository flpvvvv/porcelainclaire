# Porcelain Claire — Detailed Next Steps

Follow these steps in order. Check off each section as you complete it.

---

## 0. Prerequisites

- [ ] A **GitHub account** you can access (push this repo, enable Actions).
- [ ] A **Supabase** account ([supabase.com](https://supabase.com)).
- [ ] A **Vercel** account ([vercel.com](https://vercel.com)).
- [ ] Access to **Squarespace** DNS for `porcelainclaire.com` (or wherever the domain is managed).
- [ ] At least one **微信公众号** article URL (`https://mp.weixin.qq.com/s/...`) for testing import.

---

## 1. Supabase — Project & Database

### 1.1 Create project

1. In Supabase Dashboard: **New project** → choose region (e.g. closest to you / readers).
2. Wait until the project is **healthy**.

### 1.2 Run the articles migration

1. Open **SQL Editor** → **New query**.
2. Paste the full contents of [`supabase/migrations/001_create_articles.sql`](supabase/migrations/001_create_articles.sql).
3. Run it. Confirm there are no errors.

This creates the `articles` table, indexes, RLS, and a **public read** policy for anonymous users (your Next.js app uses the anon key).

### 1.3 Storage bucket for article images

The sync script uploads WeChat images to a bucket named **`article-images`**.

1. Go to **Storage** → **New bucket**.
2. Name: **`article-images`** (exactly this name).
3. Enable **Public bucket** (so `get_public_url` works for blog images).
4. Save.

If you prefer a private bucket, you must add Storage RLS policies so objects are readable by URL; the simplest path for a public blog is a **public** bucket.

### 1.4 Copy API keys

From **Project Settings → API**:

| Value | Where to use |
|--------|----------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL` |
| **anon public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Next.js only) |
| **service_role** key | `SUPABASE_SERVICE_KEY` (sync script & GitHub Actions **only** — never commit, never expose to the browser) |

---

## 2. Local environment

### 2.1 Next.js (`.env.local`)

1. Copy [`.env.local.example`](.env.local.example) to `.env.local` if needed.
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `REVALIDATION_SECRET` — any long random string (e.g. `openssl rand -hex 32`). You will reuse the **same** value on Vercel and in GitHub Actions.

### 2.2 Verify locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). With an empty database you should see **暂无文章** (no crash).

```bash
pnpm run build
```

Fix any build errors before deploying.

---

## 3. Vercel — Deploy the site

### 3.1 Import repository

1. Vercel Dashboard → **Add New… → Project**.
2. Import this Git repository.
3. Framework: **Next.js** (auto-detected).
4. Root directory: **.** (repo root).
5. Build command: `pnpm build` (default with pnpm is usually fine).

### 3.2 Environment variables (Production)

Add these in **Project → Settings → Environment Variables** (Production; add Preview if you want previews to hit Supabase too):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `REVALIDATION_SECRET` | Same secret as in `.env.local` |

Deploy. Confirm the deployment URL loads.

### 3.3 Custom domain `porcelainclaire.com`

1. **Project → Settings → Domains** → add `porcelainclaire.com` and `www.porcelainclaire.com` (optional but recommended).
2. Vercel will show the **exact DNS records** to create. **Prefer those over any generic IP** — Vercel’s recommended A/CNAME values can change.

### 3.4 Squarespace DNS

In Squarespace (or your DNS host):

1. Add the **A** and/or **CNAME** records **exactly** as Vercel instructs for the apex and `www`.
2. Wait for DNS propagation (often minutes, sometimes up to 48 hours).
3. In Vercel, wait until the domain shows **Valid** and HTTPS is active.

---

## 4. Point sync & revalidation at production

After the site is live on your real domain:

1. **GitHub Actions** workflow uses `SITE_URL: https://porcelainclaire.com` in [`.github/workflows/sync-wechat.yml`](.github/workflows/sync-wechat.yml). If you use another domain first, either change that line or set a workflow env override later.
2. `POST /api/revalidate` must be reachable at `{SITE_URL}/api/revalidate` with the correct `REVALIDATION_SECRET` body (the sync CLI does this after import).

---

## 5. GitHub Actions — Secrets

In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Same as `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_SERVICE_KEY` | Supabase **service_role** key (server-side only) |
| `REVALIDATION_SECRET` | Same as Vercel / `.env.local` |
| `RSS_FEED_URL` | *(Optional)* Full URL of an RSS feed for your 公众号 (e.g. from a third-party bridge). If unset, scheduled runs will skip RSS until you add it. |

### Manual import via Actions

**Actions → Sync WeChat Articles → Run workflow**:

- Fill **WeChat article URL** to import one article.
- Leave URL empty to run **RSS sync** (requires `RSS_FEED_URL`).

---

## 6. First article import

### Option A — Local machine

```bash
cd sync
uv sync
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
export REVALIDATION_SECRET="same-as-vercel"
export SITE_URL="https://porcelainclaire.com"   # or your Vercel URL while testing

uv run sync article "https://mp.weixin.qq.com/s/xxxxxxxx"
```

### Option B — GitHub Actions

Use **workflow_dispatch** with the article URL (see §5).

### After import

1. Refresh the homepage — you should see the article card (may need a hard refresh or wait for ISR; revalidation should trigger if secrets match).
2. Open the article page and test the **在微信中阅读** button opens the original WeChat URL.

**Note:** WeChat pages sometimes block or alter scraping; if import fails, try another article URL or run from a network that can reach `mp.weixin.qq.com`.

---

## 7. RSS automation (optional)

订阅号 has no official “list all articles” API. Typical approach:

1. Use a **第三方 RSS** / bridge service that outputs a feed for your account.
2. Set `RSS_FEED_URL` in GitHub Secrets.
3. Scheduled workflow (`0 8 * * *` UTC) runs `sync rss` daily.

If the bridge is down, the job logs a skip or partial failure — you can always fall back to **manual** `sync article` or workflow dispatch.

---

## 8. Content & branding polish

- [ ] **公众号二维码**: Export a PNG from WeChat backend, save as e.g. `public/wechat-qr.png`, then replace the placeholder blocks in [`src/components/Footer.tsx`](src/components/Footer.tsx) and [`src/app/about/page.tsx`](src/app/about/page.tsx) with `<Image src="/wechat-qr.png" … />` (with width/height and meaningful `alt` text).
- [ ] **About 文案**: Edit bio copy on the About page to match your voice.
- [ ] **`metadataBase`** in [`src/app/layout.tsx`](src/app/layout.tsx) is set to `https://porcelainclaire.com` — keep it aligned with your canonical domain for Open Graph.

---

## 9. Security checklist

- [ ] Never commit `.env.local` or the **service_role** key (already in `.gitignore` for env files).
- [ ] Rotate keys if they are ever leaked.
- [ ] Restrict Supabase **service_role** to CI and your own machine only.

---

## 10. Post-launch checks

- [ ] Home, About, and at least one article page load on mobile (Safari / Chrome).
- [ ] Dark / light mode follows system and toggle works.
- [ ] **Add to Home Screen** / Install PWA (manifest + service worker) — icons under `public/icons/`.
- [ ] From mainland China (or a VPN simulating it): page loads without Google Fonts (already avoided).
- [ ] `contact@porcelainclaire.com` mailbox works if you advertise it.

---

## Quick reference — commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` |
| Production build | `pnpm run build` |
| Lint | `pnpm run lint` |
| Sync one article | `cd sync && uv run sync article "<url>"` |
| Sync RSS | `cd sync && uv run sync rss "<feed-url>"` |

---

## Need help?

- **Supabase**: [Dashboard](https://supabase.com/dashboard) → docs for SQL, Storage, RLS.
- **Vercel**: Project **Domains** tab for live DNS instructions.
- **Repo docs**: [`README.md`](README.md) for a shorter overview.
