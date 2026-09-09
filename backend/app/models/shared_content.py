import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class SourcePlatform(str, enum.Enum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    UNKNOWN = "unknown"


class ShareStatus(str, enum.Enum):
    PENDING = "pending"      # link received, metadata not fetched yet
    ENRICHED = "enriched"    # oEmbed metadata fetched successfully
    FAILED = "failed"        # couldn't fetch metadata (e.g. no access token, dead link)


class SharedContent(Base):
    """
    A link a user shared into Bridge from another app's share sheet
    (e.g. tapping 'Share' on a TikTok/Reel and picking Bridge).
    """
    __tablename__ = "shared_content"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    original_url: Mapped[str] = mapped_column(String(2048))
    platform: Mapped[SourcePlatform] = mapped_column(Enum(SourcePlatform), default=SourcePlatform.UNKNOWN)
    status: Mapped[ShareStatus] = mapped_column(Enum(ShareStatus), default=ShareStatus.PENDING)

    # Populated from the platform's oEmbed response once enriched
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    author_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    embed_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Full raw oEmbed payload, kept for anything not promoted to its own column
    raw_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    enriched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()
