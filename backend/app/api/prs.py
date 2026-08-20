"""PR API endpoints."""

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.models import PR
from app.common.schemas import (
    PRDetail,
    ScorePRRequest,
    ScorePRResponse,
    ActivePRsResponse,
    ScoredPR,
)
from app.core.prioritization.service import score_pr
from app.dependencies import get_db_session


router = APIRouter()


@router.get("/active", response_model=ActivePRsResponse)
async def list_active_prs(
    db: AsyncSession = Depends(get_db_session),
):
    """List all active PRs with their latest priority scores."""

    result = await db.execute(
        select(PR)
        .options(selectinload(PR.priority_score))
        .where(PR.status != "error")
        .order_by(PR.created_at.desc())
    )

    prs = result.scalars().all()
    items: list[ScoredPR] = []

    for pr in prs:
        score = pr.priority_score
        items.append(
            ScoredPR(
                id=f"{pr.repo}#{pr.number}",
                repo=pr.repo,
                number=pr.number,
                title=pr.title,
                author=pr.author,
                html_url=pr.html_url,
                status=pr.status,
                risk_score=score.risk_score if score else None,
                readability=score.readability if score else None,
                security=score.security if score else None,
                performance=score.performance if score else None,
                architecture=score.architecture if score else None,
                ai_summary=score.reasoning if score else None,
                updated_at=pr.updated_at,
            )
        )

    return ActivePRsResponse(items=items)


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
    """Queue PR scoring as a background task."""

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

    pr.status = "scoring"
    await db.commit()

    background_tasks.add_task(score_pr, pr.id)

    return ScorePRResponse(
        pr_id=pr.id,
        status="queued",
        message=f"Scoring queued for PR #{pr.number}",
    )