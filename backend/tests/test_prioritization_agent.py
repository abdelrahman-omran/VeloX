"""Unit tests for PrioritizationAgent."""

import json
from unittest.mock import AsyncMock

import pytest
from pydantic import ValidationError

from app.core.ai.agents.prioritization_agent import (
    PrioritizationAgent,
    PriorityScoreResult,
)
from app.core.ai.llm.llm_client import LLMClient


@pytest.fixture
def agent():
    mock_llm = AsyncMock(spec=LLMClient)
    return PrioritizationAgent(llm_client=mock_llm)


@pytest.mark.asyncio
async def test_analyze_returns_valid_result(agent):
    """Valid JSON from LLM is parsed into PriorityScoreResult."""
    agent.llm_client.generate = AsyncMock(
        return_value=json.dumps(
            {
                "overall_score": 87,
                "readability": 90,
                "security": 85,
                "performance": 80,
                "architecture": 92,
                "reasoning": "Good architecture.",
            }
        )
    )

    result = await agent.analyze("owner/repo", "Fix auth", "diff...")

    assert isinstance(result, PriorityScoreResult)
    assert result.overall_score == 87
    assert result.readability == 90
    assert result.security == 85
    assert result.performance == 80
    assert result.architecture == 92
    assert result.reasoning == "Good architecture."


@pytest.mark.asyncio
async def test_analyze_invalid_json_raises_value_error(agent):
    """Non-JSON response raises ValueError."""
    agent.llm_client.generate = AsyncMock(return_value="not json at all")

    with pytest.raises(ValueError, match="LLM returned invalid JSON"):
        await agent.analyze("owner/repo", "Fix auth", "diff...")


@pytest.mark.asyncio
async def test_analyze_out_of_range_score_raises_validation_error(agent):
    """Scores outside 0-100 raise Pydantic ValidationError."""
    agent.llm_client.generate = AsyncMock(
        return_value=json.dumps(
            {
                "overall_score": 150,
                "readability": 90,
                "security": 85,
                "performance": 80,
                "architecture": 92,
                "reasoning": "Bad score.",
            }
        )
    )

    with pytest.raises(ValidationError):
        await agent.analyze("owner/repo", "Fix auth", "diff...")


@pytest.mark.asyncio
async def test_analyze_missing_field_raises_validation_error(agent):
    """Missing required field raises Pydantic ValidationError."""
    agent.llm_client.generate = AsyncMock(
        return_value=json.dumps(
            {
                "overall_score": 50,
                "readability": 50,
                "security": 50,
                "performance": 50,
                "architecture": 50,
                # missing "reasoning"
            }
        )
    )

    with pytest.raises(ValidationError):
        await agent.analyze("owner/repo", "Fix auth", "diff...")
