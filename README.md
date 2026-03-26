# Porcelain Claire

个人博客，文章同步自微信公众号。

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + TypeScript
- **样式**: Tailwind CSS v4
- **数据库**: Supabase (PostgreSQL)
- **同步**: Python 3.12+（[uv](https://docs.astral.sh/uv/)）
- **部署**: Vercel
- **包管理**: pnpm

## 项目结构（简要）

| 路径 | 说明 |
|------|------|
| `app/` | Next.js 应用与路由 |
| `sync/` | 微信文章 / RSS 同步 CLI |
| `supabase/migrations/` | 数据库迁移 SQL |

## 本地开发

```bash
pnpm install
cp .env.local.example .env.local  # 填写 Supabase 与 revalidate 相关变量
pnpm dev
```

## 文章同步

在运行前配置 Supabase 凭据（与下表中的 `SUPABASE_*` 一致），可选设置 `REVALIDATION_SECRET`、`SITE_URL` 以便导入后触发站点重新验证。

**本地环境：**`uv run sync …` 会在执行时自动从**仓库根目录**的 `.env`、`.env.local` 加载变量（后者覆盖前者），因此可把 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY`、`GEMINI_API_KEY` 等写在根目录 `.env.local` 中，无需每次手动 `export`。

从微信公众号导入单篇文章（需设置 `GEMINI_API_KEY` 以自动生成 2–5 个中文标签）：

```bash
cd sync
uv sync
uv run sync article "https://mp.weixin.qq.com/s/..."
```

为已有文章补全标签（免费层级建议保持默认间隔，约 6 秒/篇）：

```bash
uv run sync backfill-tags                    # 全部无标签文章，写入 Supabase
uv run sync backfill-tags --dry-run          # 仅调用 Gemini 打印标签，不写库
uv run sync backfill-tags --dry-run --limit 3 --order newest   # 只测最新 3 篇
uv run sync backfill-tags --dry-run --limit 5 --order random --seed 42  # 随机 5 篇（可复现）
```

`--order`：`newest`（默认）、`oldest`、`random`。与 `--limit N` 联用便于调试提示词与参数。

从 RSS 源批量导入：

```bash
uv run sync rss "https://your-rss-bridge/feed-url"
```

## 环境变量

### 前端 / Vercel（`.env.local` 与线上）

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `REVALIDATION_SECRET` | ISR 重新验证密钥（需与同步脚本使用的一致） |

模板见根目录 [`.env.local.example`](./.env.local.example)。

### 同步脚本（shell 环境变量）

| 变量 | 说明 |
|------|------|
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | 服务角色密钥（仅用于同步，勿暴露到浏览器） |
| `REVALIDATION_SECRET` | 可选；设置后导入完成会请求 `/api/revalidate` |
| `SITE_URL` | 可选；重新验证时的站点根 URL，默认 `https://porcelainclaire.com` |
| `GEMINI_API_KEY` | 可选；未设置时导入成功但 `tags` 为空。GitHub Actions 同步需在仓库 Secrets 中配置 |

## 部署

1. 在 [Supabase](https://supabase.com) 创建项目，并在 SQL Editor 或 CLI 中按顺序应用 `supabase/migrations/` 下的迁移。
2. 在 Vercel 导入此仓库，配置上表中的前端环境变量。
3. 域名 DNS 按 **Vercel 控制台显示的记录** 配置（不要死记 IP，以 Vercel 为准）。
4. 若使用 GitHub Actions 等方式跑同步，在对应环境中配置 `SUPABASE_URL`、`SUPABASE_SERVICE_KEY`、`GEMINI_API_KEY`（自动标签）等密钥。

## 许可

MIT
