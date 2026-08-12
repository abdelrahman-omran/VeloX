"""PR prioritization business workflow."""

import logging

from sqlalchemy import select

from app.common.models import PR, PriorityScore
from app.database import AsyncSessionLocal
from app.core.ai.orchestrator import AIOrchestrator


logger = logging.getLogger(__name__)


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
                logger.info(
                    "PR %s is already scored. Skipping.",
                    pr_id,
                )
                return

            # ---------------------------------------------------------
            # 3. Mark workflow as running
            # ---------------------------------------------------------

            pr.status = "pending"
            await db.commit()

            # ---------------------------------------------------------
            # 4. Run AI orchestration
            # ---------------------------------------------------------

            orchestrator = AIOrchestrator()
            # app/core/prioritization/service.py
            priority_result = await orchestrator.prioritize_pr(
                repo=pr.repo,
                title=pr.title,
                diff_text=pr.diff_text,
            )

            # ---------------------------------------------------------
            # 5. Persist PriorityScore
            # ---------------------------------------------------------

            score = PriorityScore(
                pr_id=pr.id,
                overall_score=priority_result.overall_score,
                readability=priority_result.readability,
                security=priority_result.security,
                performance=priority_result.performance,
                architecture=priority_result.architecture,
                reasoning=priority_result.reasoning,
                rank=priority_result.rank,
            )

            # ---------------------------------------------------------
            # 6. Replace existing score if necessary
            # ---------------------------------------------------------

            existing_result = await db.execute(
                select(PriorityScore).where(
                    PriorityScore.pr_id == pr.id
                )
            )

            existing_score = existing_result.scalar_one_or_none()

            if existing_score:
                existing_score.overall_score = score.overall_score
                existing_score.readability = score.readability
                existing_score.security = score.security
                existing_score.performance = score.performance
                existing_score.architecture = score.architecture
                existing_score.reasoning = score.reasoning
                existing_score.rank = score.rank
            else:
                db.add(score)

            # ---------------------------------------------------------
            # 7. Mark PR as successfully scored
            # ---------------------------------------------------------

            pr.status = "scored"

            await db.commit()

            logger.info(
                "Successfully scored PR %s.",
                pr_id,
            )

        # -------------------------------------------------------------
        # 8. Handle expected AI/workflow failures
        # -------------------------------------------------------------

        except Exception:
            await db.rollback()

            logger.exception(
                "Failed to score PR %s.",
                pr_id,
            )

            # Try to mark the PR as failed.
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