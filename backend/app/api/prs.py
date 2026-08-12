"""PR API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.models import PR
from app.common.schemas import (
    PRDetail,
    PRWithScore,
    ScorePRResponse,
)
from app.dependencies import get_db_session

router = APIRouter()


@router.get(
    "/active",
    response_model=list[PRWithScore],
)
async def list_active_prs(
    db: AsyncSession = Depends(get_db_session),
):
    """List active PRs with their latest priority scores."""

    result = await db.execute(
        select(PR)
        .options(selectinload(PR.priority_score))
        .where(PR.status != "error")
        .order_by(PR.created_at.desc())
    )

    prs = result.scalars().all()

    return [
        {
            **{
                "id": pr.id,
                "repo": pr.repo,
                "number": pr.number,
                "title": pr.title,
                "author": pr.author,
                "branch": pr.branch,
                "head_sha": pr.head_sha,
                "base_sha": pr.base_sha,
                "status": pr.status,
                "created_at": pr.created_at,
                "updated_at": pr.updated_at,
            },
            "score": pr.priority_score,
        }
        for pr in prs
    ]


@router.get(
    "/{pr_id}",
    response_model=PRDetail,
)
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
            status_code=404,
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
    db: AsyncSession = Depends(get_db_session),
):
    """
    Queue priority scoring for a PR.

    Actual worker/queue integration will be added
    in the background-job phase.
    """

    result = await db.execute(
        select(PR).where(PR.id == pr_id)
    )

    pr = result.scalar_one_or_none()

    if not pr:
        raise HTTPException(
            status_code=404,
            detail="PR not found",
        )

    return ScorePRResponse(
        pr_id=pr.id,
        status="queued",
        message=f"Scoring queued for PR #{pr.number}",
    )