import uuid
from datetime import datetime

from pydantic import BaseModel, HttpUrl

from app.models.shared_content import SourcePlatform, ShareStatus


class SharedContentCreate(BaseModel):
    user_id: uuid.UUID
    url: HttpUrl


class SharedContentOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    original_url: str
    platform: SourcePlatform
    status: ShareStatus
    title: str | None
    author_name: str | None
    thumbnail_url: str | None
    embed_html: str | None
    error_message: str | None
    created_at: datetime
    enriched_at: datetime | None

    model_config = {"from_attributes": True}
