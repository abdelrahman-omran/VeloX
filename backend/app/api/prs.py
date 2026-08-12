"""PR API endpoints."""

from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.models import PR
from app.common.schemas import (
    PRBase,
    PRDetail,
    PRWithScore,
    ScorePRRequest,
    ScorePRResponse,
)
from app.core.prioritization.service import score_pr
from app.dependencies import get_db_session


router = APIRouter()


@router.get("/active", response_model=List[PRWithScore])
async def list_active_prs(
    db: AsyncSession = Depends(get_db_session),
):
    """List all active PRs with their latest priority scores."""

    result = await db.execute(
        select(PR)
        .where(PR.status != "error")
        .order_by(PR.created_at.desc())
    )

    return result.scalars().all()


@router.get("/{pr_id}", response_model=PRDetail)
async def get_pr(
    pr_id: int,
    db: AsyncSession = Depends(get_db_session),
):
    """Get full PR detail including cached diff."""

    result = await db.execute(
        select(PR).where(PR.id == pr_id)
    )

    pr = result.scalar_one_or_none()

    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PR not found",
        )

    return pr


@router.post(
    "/{pr_id}/score",
    response_model=ScorePRResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def score_pr_endpoint(
    pr_id: int,
    request: ScorePRRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Queue PR scoring as a background task.

    The actual AI workflow runs after the HTTP response is returned.
    """

    result = await db.execute(
        select(PR).where(PR.id == pr_id)
    )

    pr = result.scalar_one_or_none()

    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PR not found",
        )

    if pr.status == "scored":
        return ScorePRResponse(
            pr_id=pr.id,
            status="already_scored",
            message=f"PR #{pr.number} has already been scored.",
        )

    if pr.status == "pending":
        pr.status = "pending"

    background_tasks.add_task(score_pr, pr.id)

    return ScorePRResponse(
        pr_id=pr.id,
        status="queued",
        message=f"Scoring queued for PR #{pr.number}",
    )