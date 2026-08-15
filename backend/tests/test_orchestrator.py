"""Unit tests for AIOrchestrator."""

from unittest.mock import AsyncMock, patch

import pytest

from app.core.ai.orchestrator import AIOrchestrator


@pytest.mark.asyncio
async def test_prioritize_pr_delegates_to_agent():
    """Orchestrator initializes agent and forwards arguments."""
    fake_result = AsyncMock()

    with patch(
        "app.core.ai.orchestrator.PrioritizationAgent"
    ) as MockAgent:
        instance = MockAgent.return_value
        instance.analyze = AsyncMock(return_value=fake_result)

        orchestrator = AIOrchestrator()
        result = await orchestrator.prioritize_pr(
            repo="owner/repo",
            title="Fix auth",
            diff_text="diff...",
        )

        assert result == fake_result
        instance.analyze.assert_awaited_once_with(
            repo="owner/repo",
            title="Fix auth",
            diff_text="diff...",
        )