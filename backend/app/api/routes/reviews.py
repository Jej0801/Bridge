import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.pull_request import PullRequest
from app.models.review import Review, ReviewStatus
from app.schemas.review import ReviewCreate, ReviewOut
from app.services.java_analysis import run_java_static_analysis

router = APIRouter(prefix="/reviews", tags=["reviews"])


async def _execute_review(review_id: uuid.UUID) -> None:
    """
    Background job: runs static analysis for the PR's repo checkout and
    writes results back onto the Review row. A fresh session is opened
    here since this runs outside the original request's session scope.
    """
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        review = await session.get(Review, review_id)
        if review is None:
            return

        review.status = ReviewStatus.RUNNING
        await session.commit()

        try:
            pr = await session.get(PullRequest, review.pull_request_id)
            # Assumes the repo has already been cloned/checked out to
            # WORKSPACE_DIR/<repo_id>/<head_sha> by an earlier pipeline step.
            repo_path = Path(settings.WORKSPACE_DIR) / str(pr.repo_id) / pr.head_sha
            results = await run_java_static_analysis(repo_path)

            review.static_analysis_results = results
            review.status = ReviewStatus.COMPLETED
            review.completed_at = datetime.now(timezone.utc)
        except Exception as exc:
            review.status = ReviewStatus.FAILED
            review.error_message = str(exc)

        await session.commit()


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review(
    payload: ReviewCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Review:
    pr = await db.get(PullRequest, payload.pull_request_id)
    if pr is None:
        raise HTTPException(status_code=404, detail="pull request not found")

    review = Review(pull_request_id=pr.id, status=ReviewStatus.PENDING)
    db.add(review)
    await db.commit()
    await db.refresh(review)

    background_tasks.add_task(_execute_review, review.id)
    return review


@router.get("/{review_id}", response_model=ReviewOut)
async def get_review(review_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Review:
    review = await db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="review not found")
    return review


@router.get("", response_model=list[ReviewOut])
async def list_reviews_for_pr(pull_request_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[Review]:
    result = await db.execute(select(Review).where(Review.pull_request_id == pull_request_id))
    return list(result.scalars().all())
