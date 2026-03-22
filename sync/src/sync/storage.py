"""Upload articles and images to Supabase."""

from __future__ import annotations

import hashlib
import os
import re
from mimetypes import guess_type

from supabase import Client, create_client

from .fetcher import download_image

_BUCKET = "article-images"


def _get_client() -> Client:
    """Create a Supabase client from environment variables.

    Returns
    -------
    Client
        Authenticated Supabase client.

    Raises
    ------
    RuntimeError
        If required environment variables are missing.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required"
        )
    return create_client(url, key)


def _slugify(title: str) -> str:
    """Convert a Chinese title to a URL-friendly slug.

    Parameters
    ----------
    title : str
        The article title to slugify.

    Returns
    -------
    str
        A URL-safe slug derived from the title.
    """
    slug = title.strip().lower()
    # Drop punctuation instead of using "-". Hyphens in path segments break
    # Vercel/Next for some [slug] routes; CJK titles need no ASCII separators.
    slug = re.sub(r"[^\w\u4e00-\u9fff]+", "", slug)
    if len(slug) > 80:
        slug = slug[:80]
    return slug or hashlib.md5(title.encode()).hexdigest()[:12]


def upload_image(client: Client, image_url: str) -> str:
    """Download an image and upload it to Supabase Storage.

    Parameters
    ----------
    client : Client
        Supabase client instance.
    image_url : str
        Source URL of the image to re-host.

    Returns
    -------
    str
        Public URL of the uploaded image in Supabase Storage.
    """
    image_data = download_image(image_url)
    content_hash = hashlib.md5(image_data).hexdigest()
    mime, _ = guess_type(image_url)
    ext = ".jpg"
    if mime and "/" in mime:
        ext = f".{mime.split('/')[-1]}"
        if ext == ".jpeg":
            ext = ".jpg"

    path = f"images/{content_hash}{ext}"

    client.storage.from_(_BUCKET).upload(
        path,
        image_data,
        file_options={"content-type": mime or "image/jpeg", "upsert": "true"},
    )

    return client.storage.from_(_BUCKET).get_public_url(path)


def rehost_images(client: Client, content_html: str, image_urls: list[str]) -> str:
    """Replace WeChat image URLs in HTML with Supabase Storage URLs.

    Parameters
    ----------
    client : Client
        Supabase client instance.
    content_html : str
        Article HTML with original WeChat image URLs.
    image_urls : list[str]
        List of WeChat image URLs found in the content.

    Returns
    -------
    str
        Updated HTML with images pointing to Supabase Storage.
    """
    for original_url in image_urls:
        try:
            new_url = upload_image(client, original_url)
            content_html = content_html.replace(original_url, new_url)
        except Exception as exc:
            print(f"Warning: failed to re-host image {original_url}: {exc}")
    return content_html


def upsert_article(
    client: Client,
    *,
    title: str,
    author: str,
    published_at: str,
    content_html: str,
    cover_image_url: str,
    wechat_url: str,
    summary: str,
    tags: list[str] | None = None,
) -> dict:
    """Insert or update an article in the Supabase database.

    Parameters
    ----------
    client : Client
        Supabase client instance.
    title : str
        Article title.
    author : str
        Article author.
    published_at : str
        Publication date (ISO-8601).
    content_html : str
        Sanitised article HTML body.
    cover_image_url : str
        URL to the cover image (already re-hosted).
    wechat_url : str
        Original WeChat article URL.
    summary : str
        Brief text summary.
    tags : list[str] | None
        Optional tags.

    Returns
    -------
    dict
        The upserted row data from Supabase.
    """
    slug = _slugify(title)

    row = {
        "slug": slug,
        "title": title,
        "author": author,
        "published_at": published_at or "2024-01-01",
        "content_html": content_html,
        "cover_image_url": cover_image_url,
        "wechat_url": wechat_url,
        "summary": summary,
        "tags": tags or [],
    }

    result = (
        client.table("articles").upsert(row, on_conflict="slug").execute()
    )

    return result.data[0] if result.data else row
