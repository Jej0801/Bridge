"""
Fetches preview metadata for a shared IG/TikTok link using each
platform's official oEmbed endpoint. This intentionally does NOT
download or re-host video files — it only pulls the metadata/embed
HTML those platforms explicitly publish for this purpose, the same
way a "save this link" feature (e.g. Pocket) would render a preview.

TikTok's oEmbed endpoint is public and needs no credentials.
Instagram's oEmbed endpoint requires a Meta app access token
(INSTAGRAM_ACCESS_TOKEN) — without one, we still store the raw link
and mark it "failed" enrichment rather than erroring the whole request.
"""

import re
import httpx

from app.core.config import settings
from app.models.shared_content import SourcePlatform

TIKTOK_HOST_RE = re.compile(r"(^|\.)tiktok\.com$")
INSTAGRAM_HOST_RE = re.compile(r"(^|\.)instagram\.com$")

TIKTOK_OEMBED_URL = "https://www.tiktok.com/oembed"
INSTAGRAM_OEMBED_URL = "https://graph.facebook.com/v19.0/instagram_oembed"


def detect_platform(url: str) -> SourcePlatform:
    from urllib.parse import urlparse

    host = urlparse(url).hostname or ""
    if TIKTOK_HOST_RE.search(host):
        return SourcePlatform.TIKTOK
    if INSTAGRAM_HOST_RE.search(host):
        return SourcePlatform.INSTAGRAM
    return SourcePlatform.UNKNOWN


class OEmbedResult:
    def __init__(
        self,
        success: bool,
        title: str | None = None,
        author_name: str | None = None,
        thumbnail_url: str | None = None,
        embed_html: str | None = None,
        raw: dict | None = None,
        error: str | None = None,
    ):
        self.success = success
        self.title = title
        self.author_name = author_name
        self.thumbnail_url = thumbnail_url
        self.embed_html = embed_html
        self.raw = raw
        self.error = error


async def fetch_tiktok_oembed(url: str) -> OEmbedResult:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(TIKTOK_OEMBED_URL, params={"url": url})
            resp.raise_for_status()
            data = resp.json()
            return OEmbedResult(
                success=True,
                title=data.get("title"),
                author_name=data.get("author_name"),
                thumbnail_url=data.get("thumbnail_url"),
                embed_html=data.get("html"),
                raw=data,
            )
        except httpx.HTTPError as exc:
            return OEmbedResult(success=False, error=f"TikTok oEmbed request failed: {exc}")


async def fetch_instagram_oembed(url: str) -> OEmbedResult:
    if not settings.INSTAGRAM_ACCESS_TOKEN:
        return OEmbedResult(
            success=False,
            error="INSTAGRAM_ACCESS_TOKEN not configured — link saved without preview metadata",
        )

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                INSTAGRAM_OEMBED_URL,
                params={"url": url, "access_token": settings.INSTAGRAM_ACCESS_TOKEN},
            )
            resp.raise_for_status()
            data = resp.json()
            return OEmbedResult(
                success=True,
                title=data.get("title"),
                author_name=data.get("author_name"),
                thumbnail_url=data.get("thumbnail_url"),
                embed_html=data.get("html"),
                raw=data,
            )
        except httpx.HTTPError as exc:
            return OEmbedResult(success=False, error=f"Instagram oEmbed request failed: {exc}")


async def fetch_oembed(url: str, platform: SourcePlatform) -> OEmbedResult:
    if platform == SourcePlatform.TIKTOK:
        return await fetch_tiktok_oembed(url)
    if platform == SourcePlatform.INSTAGRAM:
        return await fetch_instagram_oembed(url)
    return OEmbedResult(success=False, error="unrecognized platform — no oEmbed provider available")
