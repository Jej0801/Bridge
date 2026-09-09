import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class ReviewStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pull_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pull_requests.id", ondelete="CASCADE"), index=True)

    status: Mapped[ReviewStatus] = mapped_column(Enum(ReviewStatus), default=ReviewStatus.PENDING)

    # Free-text AI-generated summary/commentary for the PR
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured findings from Checkstyle/PMD/SpotBugs, keyed by tool name.
    # Kept as JSONB rather than separate tables since each tool's finding
    # schema differs and this data is written once, read as a whole.
    static_analysis_results: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    pull_request: Mapped["PullRequest"] = relationship(back_populates="reviews")
