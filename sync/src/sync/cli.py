"""CLI entry point for the WeChat article sync tool."""

from __future__ import annotations

import os

import click
import httpx

from .fetcher import fetch_article_html
from .parser import parse_article
from .storage import _get_client, rehost_images, upload_image, upsert_article


@click.group()
def cli() -> None:
    """Porcelain Claire WeChat article sync tool."""


@cli.command()
@click.argument("url")
@click.option("--tags", default="", help="Comma-separated tags for the article.")
@click.option(
    "--revalidate/--no-revalidate",
    default=True,
    help="Trigger Vercel ISR revalidation after import.",
)
def article(url: str, tags: str, revalidate: bool) -> None:
    """Import a single WeChat article by URL.

    Parameters
    ----------
    url : str
        Full URL of the WeChat article to import.
    tags : str
        Comma-separated list of tags.
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
        parsed.content_html = rehost_images(
            client, parsed.content_html, parsed.image_urls
        )
        if parsed.cover_image_url:
            try:
                parsed.cover_image_url = upload_image(client, parsed.cover_image_url)
            except Exception as exc:
                click.echo(f"Warning: cover image re-host failed: {exc}")

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None

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


@cli.command()
@click.argument("feed_url")
def rss(feed_url: str) -> None:
    """Discover and import new articles from an RSS feed.

    Parameters
    ----------
    feed_url : str
        URL of the RSS feed for the WeChat account.
    """
    import feedparser

    click.echo(f"Fetching RSS feed: {feed_url}")
    feed = feedparser.parse(feed_url)

    if not feed.entries:
        click.echo("No entries found in feed.")
        return

    client = _get_client()

    existing = client.table("articles").select("wechat_url").execute()
    known_urls = {r["wechat_url"] for r in (existing.data or [])}

    new_entries = [e for e in feed.entries if e.get("link") not in known_urls]
    click.echo(f"Found {len(new_entries)} new article(s).")

    for entry in new_entries:
        entry_url = entry.get("link", "")
        if not entry_url:
            continue

        click.echo(f"\nImporting: {entry.get('title', entry_url)}")
        try:
            html = fetch_article_html(entry_url)
            parsed = parse_article(html)

            if parsed.image_urls:
                parsed.content_html = rehost_images(
                    client, parsed.content_html, parsed.image_urls
                )
                if parsed.cover_image_url:
                    try:
                        parsed.cover_image_url = upload_image(
                            client, parsed.cover_image_url
                        )
                    except Exception:
                        pass

            row = upsert_article(
                client,
                title=parsed.title,
                author=parsed.author,
                published_at=parsed.published_at,
                content_html=parsed.content_html,
                cover_image_url=parsed.cover_image_url,
                wechat_url=entry_url,
                summary=parsed.summary,
            )
            click.echo(f"  Imported: {row.get('slug', 'unknown')}")
        except Exception as exc:
            click.echo(f"  Error: {exc}")

    _trigger_revalidation(None)
    click.echo("\nSync complete!")


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
