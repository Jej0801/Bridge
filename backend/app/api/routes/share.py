import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.models.shared_content import SharedContent, ShareStatus
from app.schemas.share import SharedContentCreate, SharedContentOut
from app.services.oembed import detect_platform, fetch_oembed

router = APIRouter(prefix="/share", tags=["share"])


async def _enrich(shared_content_id: uuid.UUID) -> None:
    """Background job: calls the platform's oEmbed API and writes results back."""
    async with AsyncSessionLocal() as session:
        item = await session.get(SharedContent, shared_content_id)
        if item is None:
            return

        result = await fetch_oembed(item.original_url, item.platform)

        if result.success:
            item.title = result.title
            item.author_name = result.author_name
            item.thumbnail_url = result.thumbnail_url
            item.embed_html = result.embed_html
            item.raw_metadata = result.raw
            item.status = ShareStatus.ENRICHED
            item.enriched_at = datetime.now(timezone.utc)
        else:
            item.status = ShareStatus.FAILED
            item.error_message = result.error

        await session.commit()


@router.post("", response_model=SharedContentOut, status_code=201)
async def create_shared_content(
    payload: SharedContentCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> SharedContent:
    """
    Called right after the app receives a share-intent URL from the
    IG/TikTok share sheet. Stores the link immediately (status=pending)
    and enriches it with oEmbed metadata in the background, so the UI
    doesn't have to block on an outbound HTTP call.
    """
    platform = detect_platform(str(payload.url))

    item = SharedContent(
        user_id=payload.user_id,
        original_url=str(payload.url),
        platform=platform,
        status=ShareStatus.PENDING,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    background_tasks.add_task(_enrich, item.id)
    return item


@router.get("/{shared_content_id}", response_model=SharedContentOut)
async def get_shared_content(shared_content_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> SharedContent:
    item = await db.get(SharedContent, shared_content_id)
    if item is None:
        raise HTTPException(status_code=404, detail="shared content not found")
    return item


@router.get("", response_model=list[SharedContentOut])
async def list_shared_content(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[SharedContent]:
    result = await db.execute(
        select(SharedContent).where(SharedContent.user_id == user_id).order_by(SharedContent.created_at.desc())
    )
    return list(result.scalars().all())
