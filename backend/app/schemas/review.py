import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.review import ReviewStatus


class ReviewCreate(BaseModel):
    pull_request_id: uuid.UUID


class ReviewOut(BaseModel):
    id: uuid.UUID
    pull_request_id: uuid.UUID
    status: ReviewStatus
    ai_summary: str | None
    static_analysis_results: dict | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
