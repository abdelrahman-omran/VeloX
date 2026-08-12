"""Integration tests that hit real external APIs.

Set RUN_INTEGRATION_TESTS=1 to enable.
"""

import os

import pytest

pytestmark = pytest.mark.integration


@pytest.mark.skipif(
    not os.getenv("RUN_INTEGRATION_TESTS"),
    reason="Set RUN_INTEGRATION_TESTS=1 to run integration tests",
)
@pytest.mark.asyncio
async def test_real_openai_prioritization():
    """End-to-end agent test with real OpenAI API."""
    from app.core.ai.llm.llm_client import LLMClient
    from app.core.ai.agents.prioritization_agent import PrioritizationAgent

    llm = LLMClient()
    agent = PrioritizationAgent(llm_client=llm)

    result = await agent.analyze(
        repo="test/repo",
        title="Add JWT authentication middleware",
        diff_text="+def authenticate(token):\n+    ...",
    )

    assert 0 <= result.overall_score <= 100
    assert 0 <= result.readability <= 100
    assert 0 <= result.security <= 100
    assert 0 <= result.performance <= 100
    assert 0 <= result.architecture <= 100
    assert result.reasoning
    assert len(result.reasoning) > 10
