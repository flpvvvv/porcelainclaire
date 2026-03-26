"""Parse WeChat article HTML to extract structured content."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

from bs4 import BeautifulSoup


@dataclass
class ParsedArticle:
    """Structured representation of a parsed WeChat article.

    Attributes
    ----------
    title : str
        Article title.
    author : str
        Author name.
    published_at : str
        Publication date in ISO-8601 format, or empty string if unavailable.
    content_html : str
        Cleaned article body HTML.
    image_urls : list[str]
        All image URLs found in the content.
    cover_image_url : str
        URL of the cover / first image, or empty string.
    summary : str
        First ~200 characters of the text content.
    """

    title: str
    author: str
    published_at: str
    content_html: str
    image_urls: list[str] = field(default_factory=list)
    cover_image_url: str = ""
    summary: str = ""


def _extract_publish_date(html: str) -> str:
    """Extract publish date from WeChat page scripts.

    Parameters
    ----------
    html : str
        Raw HTML of the WeChat article.

    Returns
    -------
    str
        ISO-8601 date string, or empty string if not found.
    """
    match = re.search(r"var\s+createTime\s*=\s*'(\d{4}-\d{2}-\d{2})", html)
    if match:
        return match.group(1)

    match = re.search(r"var\s+ct\s*=\s*\"(\d+)\"", html)
    if match:
        import datetime

        ts = int(match.group(1))
        return datetime.datetime.fromtimestamp(ts, tz=datetime.UTC).strftime("%Y-%m-%d")

    return ""


def _normalize_author(raw: str) -> str:
    """Collapse duplicated author text from WeChat meta markup.

    WeChat often renders the author name twice in nested spans (e.g. mobile
    layout + screen-reader), which makes BeautifulSoup ``get_text()`` return
    strings like ``唐慧唐慧`` or ``唐慧Claire唐慧Claire``.
    """
    s = raw.strip()
    if len(s) < 2:
        return s
    for size in range(1, len(s) // 2 + 1):
        if len(s) % size != 0:
            continue
        unit = s[:size]
        reps = len(s) // size
        if reps >= 2 and unit * reps == s:
            return unit
    return s


def _is_wechat_image(url: str) -> bool:
    """Check if a URL is a WeChat-hosted image.

    Parameters
    ----------
    url : str
        Image URL to check.

    Returns
    -------
    bool
        True if the URL is from WeChat's image CDN.
    """
    parsed = urlparse(url)
    return parsed.hostname is not None and "qpic.cn" in parsed.hostname


def parse_article(html: str) -> ParsedArticle:
    """Parse a WeChat article HTML page into structured data.

    Parameters
    ----------
    html : str
        Full HTML of the WeChat article page.

    Returns
    -------
    ParsedArticle
        Parsed and structured article data.
    """
    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.find("h1", class_="rich_media_title") or soup.find("h1")
    title = title_el.get_text(strip=True) if title_el else "无标题"

    author_el = soup.find("span", class_="rich_media_meta_text") or soup.find("a", id="js_name")
    author = _normalize_author(author_el.get_text(strip=True)) if author_el else "Claire"

    published_at = _extract_publish_date(html)

    content_el = soup.find("div", class_="rich_media_content") or soup.find("div", id="js_content")
    if content_el is None:
        content_html = ""
        image_urls: list[str] = []
        plain_text = ""
    else:
        for script in content_el.find_all("script"):
            script.decompose()
        for style in content_el.find_all("style"):
            style.decompose()

        image_urls = []
        for img in content_el.find_all("img"):
            src = img.get("data-src") or img.get("src") or ""
            if src and _is_wechat_image(src):
                image_urls.append(src)
                img["src"] = src
            if img.get("data-src"):
                del img["data-src"]

        content_html = str(content_el)
        plain_text = content_el.get_text(strip=True)

    cover_image_url = image_urls[0] if image_urls else ""
    summary = plain_text[:200] if plain_text else ""

    return ParsedArticle(
        title=title,
        author=author,
        published_at=published_at,
        content_html=content_html,
        image_urls=image_urls,
        cover_image_url=cover_image_url,
        summary=summary,
    )
