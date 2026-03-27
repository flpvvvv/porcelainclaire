"""CLI entry point for the WeChat article sync tool."""

from __future__ import annotations

import os
from pathlib import Path

import click
import httpx

from .fetcher import fetch_article_html
from .parser import parse_article
from .storage import _get_client, rehost_images, upload_image, upsert_article
from .tagger import generate_tags

# sync/src/sync/cli.py -> repo root (porcelainclaire/)
_REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_repo_env() -> None:
    """Merge repo-root `.env` and `.env.local` into the process env (shell exports win)."""
    from dotenv import dotenv_values

    base = dotenv_values(_REPO_ROOT / ".env") or {}
    local = dotenv_values(_REPO_ROOT / ".env.local") or {}
    merged = {**base, **local}
    for key, val in merged.items():
        if val is not None and key not in os.environ:
            os.environ[key] = val


@click.group()
def cli() -> None:
    """Porcelain Claire WeChat article sync tool."""
    _load_repo_env()


@cli.command()
@click.argument("url")
@click.option(
    "--revalidate/--no-revalidate",
    default=True,
    help="Trigger Vercel ISR revalidation after import.",
)
def article(url: str, revalidate: bool) -> None:
    """Import a single WeChat article by URL.

    Parameters
    ----------
    url : str
        Full URL of the WeChat article to import.
    revalidate : bool
        Whether to call the Vercel revalidation endpoint.
    """
    click.echo(f"Fetching article: {url}")
    html = fetch_article_html(url)

    click.echo("Parsing article content…")
    parsed = parse_article(html)
    click.echo(f"  Title: {parsed.title}")
    click.echo(f"  Author: {parsed.author}")
    click.echo(f"  Date: {parsed.published_at}")
    click.echo(f"  Images found: {len(parsed.image_urls)}")

    client = _get_client()

    if parsed.image_urls:
        click.echo("Re-hosting images to Supabase Storage…")
        parsed.content_html = rehost_images(client, parsed.content_html, parsed.image_urls)
        if parsed.cover_image_url:
            try:
                parsed.cover_image_url = upload_image(client, parsed.cover_image_url)
            except Exception as exc:
                click.echo(f"Warning: cover image re-host failed: {exc}")

    click.echo("Generating tags (Gemini)…")
    tag_list = generate_tags(parsed.content_html)
    if tag_list:
        click.echo(f"  Tags: {', '.join(tag_list)}")
    else:
        click.echo("  Tags: (none — set GEMINI_API_KEY for auto-tagging)")

    click.echo("Upserting article to Supabase…")
    row = upsert_article(
        client,
        title=parsed.title,
        author=parsed.author,
        published_at=parsed.published_at,
        content_html=parsed.content_html,
        cover_image_url=parsed.cover_image_url,
        wechat_url=url,
        summary=parsed.summary,
        tags=tag_list,
    )
    click.echo(f"  Slug: {row.get('slug', 'unknown')}")

    if revalidate:
        _trigger_revalidation(row.get("slug"))

    click.echo("Done!")


@cli.command("backfill-tags")
@click.option(
    "--dry-run",
    is_flag=True,
    help="Call Gemini and print tags only; do not write to Supabase.",
)
@click.option(
    "--limit",
    type=int,
    default=None,
    metavar="N",
    help="Process at most N articles (after picking order / random).",
)
@click.option(
    "--order",
    type=click.Choice(["newest", "oldest", "random"], case_sensitive=False),
    default="newest",
    show_default=True,
    help="How to order candidates before --limit: by published_at or random shuffle.",
)
@click.option(
    "--seed",
    type=int,
    default=None,
    metavar="INT",
    help="Random seed when --order=random (reproducible sample).",
)
def backfill_tags(
    dry_run: bool,
    limit: int | None,
    order: str,
    seed: int | None,
) -> None:
    """Fill tags for articles that currently have an empty tag list."""
    import random
    import time

    if not os.environ.get("GEMINI_API_KEY"):
        click.echo("GEMINI_API_KEY is not set; cannot backfill tags.")
        raise SystemExit(1)

    if limit is not None and limit < 1:
        click.echo("--limit must be at least 1.")
        raise SystemExit(1)

    client = _get_client()
    q = client.table("articles").select("id,slug,title,content_html,tags,published_at")
    order_l = order.lower()
    if order_l == "oldest":
        q = q.order("published_at", desc=False)
    else:
        q = q.order("published_at", desc=True)
    resp = q.execute()
    rows = resp.data or []
    todo = [r for r in rows if not r.get("tags")]
    if order_l == "random":
        if seed is not None:
            random.seed(seed)
        random.shuffle(todo)
    if limit is not None:
        todo = todo[:limit]

    if not todo:
        click.echo("No articles with empty tags (or none after --limit).")
        return

    total_empty = len([r for r in rows if not r.get("tags")])
    if limit is not None:
        click.echo(
            f"Processing {len(todo)} of {total_empty} article(s) without tags (order={order_l})."
        )
    else:
        click.echo(f"Found {len(todo)} article(s) without tags.")
    for i, row in enumerate(todo, start=1):
        title = row.get("title") or row.get("slug") or "?"
        click.echo(f"[{i}/{len(todo)}] {title}")
        tags = generate_tags(row["content_html"])
        click.echo(f"  -> {tags}")
        if not dry_run:
            client.table("articles").update({"tags": tags}).eq("id", row["id"]).execute()
        if i < len(todo):
            time.sleep(6)

    if not dry_run:
        _trigger_revalidation(None)
    click.echo("Done.")


def _trigger_revalidation(slug: str | None) -> None:
    """Call the Vercel revalidation API endpoint.

    Parameters
    ----------
    slug : str | None
        Article slug to revalidate, or None for home page only.
    """
    site_url = os.environ.get("SITE_URL", "https://porcelainclaire.com")
    secret = os.environ.get("REVALIDATION_SECRET")
    if not secret:
        click.echo("  Skipping revalidation (REVALIDATION_SECRET not set).")
        return

    try:
        resp = httpx.post(
            f"{site_url}/api/revalidate",
            json={"secret": secret, "slug": slug},
            timeout=10,
        )
        if resp.status_code == 200:
            click.echo("  Revalidation triggered.")
        else:
            click.echo(f"  Revalidation failed: {resp.status_code}")
    except Exception as exc:
        click.echo(f"  Revalidation error: {exc}")
