"""PR prioritization business workflow."""

import logging

import httpx
from sqlalchemy import select

from app.common.models import PR, PriorityScore
from app.config import settings
from app.database import AsyncSessionLocal
from app.core.ai.orchestrator import AIOrchestrator


logger = logging.getLogger(__name__)


async def _fetch_github_diff(repo: str, number: int) -> str:
    """Fetch PR diff from GitHub; return empty string on failure."""
    if not settings.github_token:
        logger.warning("GITHUB_TOKEN not set; cannot fetch diff.")
        return ""

    url = f"https://api.github.com/repos/{repo}/pulls/{number}.diff"
    headers = {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github.v3.diff",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 404:
                logger.warning("Diff not found for %s#%s", repo, number)
                return ""
            response.raise_for_status()
            return response.text
    except Exception:
        logger.exception("Failed to fetch diff for %s#%s", repo, number)
        return ""


async def score_pr(pr_id: int) -> None:
    """
    Score a PR using the AI orchestrator and persist the result.

    This function is designed to run as a FastAPI BackgroundTask.
    It creates its own database session because the request session
    must not be used after the HTTP response has been returned.
    """

    async with AsyncSessionLocal() as db:
        try:
            # ---------------------------------------------------------
            # 1. Load PR
            # ---------------------------------------------------------
            result = await db.execute(
                select(PR).where(PR.id == pr_id)
            )
            pr = result.scalar_one_or_none()

            if not pr:
                logger.error("PR %s not found during scoring.", pr_id)
                return

            # ---------------------------------------------------------
            # 2. Prevent duplicate scoring
            # ---------------------------------------------------------
            if pr.status == "scored":
                logger.info("PR %s is already scored. Skipping.", pr_id)
                return

            # ---------------------------------------------------------
            # 3. Mark workflow as running
            # ---------------------------------------------------------
            pr.status = "scoring"
            await db.commit()

            # ---------------------------------------------------------
            # 4. Fetch diff if missing
            # ---------------------------------------------------------
            if not pr.diff_text:
                pr.diff_text = await _fetch_github_diff(pr.repo, pr.number)
                await db.commit()
                await db.refresh(pr)

            # ---------------------------------------------------------
            # 5. Run AI orchestration
            # ---------------------------------------------------------
            orchestrator = AIOrchestrator()

            priority_result = await orchestrator.prioritize_pr(
                repo=pr.repo,
                title=pr.title,
                diff_text=pr.diff_text,
            )

            # ---------------------------------------------------------
            # 6. Persist PriorityScore
            # ---------------------------------------------------------
            score = PriorityScore(
                pr_id=pr.id,
                risk_score=priority_result.risk_score,
                readability=priority_result.readability,
                security=priority_result.security,
                performance=priority_result.performance,
                architecture=priority_result.architecture,
                reasoning=priority_result.reasoning,
            )

            existing_result = await db.execute(
                select(PriorityScore).where(
                    PriorityScore.pr_id == pr.id
                )
            )
            existing_score = existing_result.scalar_one_or_none()

            if existing_score:
                existing_score.risk_score = score.risk_score
                existing_score.readability = score.readability
                existing_score.security = score.security
                existing_score.performance = score.performance
                existing_score.architecture = score.architecture
                existing_score.reasoning = score.reasoning
            else:
                db.add(score)

            # ---------------------------------------------------------
            # 7. Mark PR as successfully scored
            # ---------------------------------------------------------
            pr.status = "scored"
            await db.commit()

            logger.info("Successfully scored PR %s.", pr_id)

        # -------------------------------------------------------------
        # 8. Handle expected AI/workflow failures
        # -------------------------------------------------------------
        except Exception:
            await db.rollback()
            logger.exception("Failed to score PR %s.", pr_id)

            try:
                result = await db.execute(
                    select(PR).where(PR.id == pr_id)
                )
                pr = result.scalar_one_or_none()
                if pr:
                    pr.status = "error"
                    await db.commit()
            except Exception:
                await db.rollback()
                logger.exception(
                    "Failed to update PR %s status after scoring failure.",
                    pr_id,
                )