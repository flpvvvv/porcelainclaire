"""Fetch WeChat article HTML from mp.weixin.qq.com."""

import httpx

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "zh-CN,zh;q=0.9",
}


def fetch_article_html(url: str) -> str:
    """Fetch the raw HTML of a WeChat article page.

    Parameters
    ----------
    url : str
        Full URL to the WeChat article (mp.weixin.qq.com).

    Returns
    -------
    str
        The HTML body of the article page.

    Raises
    ------
    httpx.HTTPStatusError
        If the request returns a non-2xx status code.
    """
    with httpx.Client(headers=_HEADERS, follow_redirects=True, timeout=30) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.text


def download_image(url: str) -> bytes:
    """Download an image and return its raw bytes.

    Parameters
    ----------
    url : str
        URL of the image to download.

    Returns
    -------
    bytes
        Raw image data.
    """
    with httpx.Client(headers=_HEADERS, follow_redirects=True, timeout=30) as client:
        resp = client.get(url)
        resp.raise_for_status()
        return resp.content
