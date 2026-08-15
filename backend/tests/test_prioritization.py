"""Tests for the PR prioritization workflow."""

from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select

from app.common.models import PR, PriorityScore
from app.core.ai.agents.prioritization_agent import PriorityScoreResult
from app.core.prioritization.service import score_pr


@pytest.mark.asyncio
async def test_score_pr_persists_priority_score():
    """A successful AI result should be persisted to the database."""

    async with __import__(
        "app.database",
        fromlist=["AsyncSessionLocal"],
    ).AsyncSessionLocal() as db:

        pr = PR(
            github_pr_id=12345,
            repo="owner/repo",
            number=1,
            title="Improve authentication",
            author="testuser",
            branch="feature/auth",
            head_sha="abc123",
            base_sha="def456",
            status="scoring",
        )

        db.add(pr)
        await db.commit()
        await db.refresh(pr)

        pr_id = pr.id

    # Use the real PriorityScoreResult model — no fake rank attribute
    fake_result = PriorityScoreResult(
        risk_score=87,
        readability=90,
        security=85,
        performance=80,
        architecture=92,
        reasoning="The PR improves authentication architecture.",
    )

    with patch(
        "app.core.prioritization.service.AIOrchestrator"
    ) as MockOrchestrator:
        orchestrator = MockOrchestrator.return_value
        orchestrator.prioritize_pr = AsyncMock(return_value=fake_result)

        await score_pr(pr_id)

    async with __import__(
        "app.database",
        fromlist=["AsyncSessionLocal"],
    ).AsyncSessionLocal() as db:

        result = await db.execute(
            select(PR).where(PR.id == pr_id)
        )
        pr = result.scalar_one()

        result = await db.execute(
            select(PriorityScore).where(PriorityScore.pr_id == pr_id)
        )
        score = result.scalar_one()

        assert pr.status == "scored"
        assert score.risk_score == 87
        assert score.readability == 90
        assert score.security == 85
        assert score.performance == 80
        assert score.architecture == 92
        assert score.reasoning == "The PR improves authentication architecture."


@pytest.mark.asyncio
async def test_score_pr_handles_llm_failure():
    """A failed AI workflow should mark the PR as errored."""

    async with __import__(
        "app.database",
        fromlist=["AsyncSessionLocal"],
    ).AsyncSessionLocal() as db:

        pr = PR(
            github_pr_id=54321,
            repo="owner/repo",
            number=2,
            title="Test failure",
            status="scoring",
        )

        db.add(pr)
        await db.commit()
        await db.refresh(pr)

        pr_id = pr.id

    with patch(
        "app.core.prioritization.service.AIOrchestrator"
    ) as MockOrchestrator:
        orchestrator = MockOrchestrator.return_value
        orchestrator.prioritize_pr = AsyncMock(
            side_effect=Exception("LLM unavailable")
        )

        await score_pr(pr_id)

    async with __import__(
        "app.database",
        fromlist=["AsyncSessionLocal"],
    ).AsyncSessionLocal() as db:

        result = await db.execute(
            select(PR).where(PR.id == pr_id)
        )
        pr = result.scalar_one()

        assert pr.status == "error"


@pytest.mark.asyncio
async def test_score_pr_missing_pr():
    """Scoring a nonexistent PR should not create any records."""

    nonexistent_id = 999999

    with patch(
        "app.core.prioritization.service.AIOrchestrator"
    ) as MockOrchestrator:
        await score_pr(nonexistent_id)
        MockOrchestrator.assert_not_called()