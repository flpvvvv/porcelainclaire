# Porcelain Claire

个人博客，文章同步自微信公众号。

## 技术栈

- **前端**: Next.js 15 (App Router) + React 19 + TypeScript
- **样式**: Tailwind CSS v4
- **数据库**: Supabase (PostgreSQL)
- **同步**: Python 3.12+ (uv)
- **部署**: Vercel
- **包管理**: pnpm

## 本地开发

```bash
pnpm install
cp .env.local.example .env.local  # 填写 Supabase 凭据
pnpm dev
```

## 文章同步

从微信公众号导入单篇文章：

```bash
cd sync
uv sync
uv run sync article "https://mp.weixin.qq.com/s/..."
```

从 RSS 源批量导入：

```bash
uv run sync rss "https://your-rss-bridge/feed-url"
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 |
| `REVALIDATION_SECRET` | ISR 重新验证密钥 |
| `SUPABASE_URL` | Supabase URL（同步脚本用） |
| `SUPABASE_SERVICE_KEY` | Supabase 服务密钥（同步脚本用） |

## 部署

完整分步说明见 **[NEXT_STEPS.md](./NEXT_STEPS.md)**（Supabase、Vercel、DNS、GitHub Secrets、首次同步等）。

简要步骤：

1. 在 Vercel 导入此仓库
2. 设置环境变量
3. 在域名 DNS 按 **Vercel 控制台显示的记录** 配置（不要死记 IP，以 Vercel 为准）

## 许可

MIT
