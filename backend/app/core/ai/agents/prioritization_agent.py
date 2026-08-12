"""AI agent responsible for PR prioritization."""

import json
import re
from typing import Any

from pydantic import BaseModel, Field

from app.core.ai.llm.llm_client import LLMClient


class PriorityScoreResult(BaseModel):
    """Validated output produced by the prioritization agent."""

    overall_score: int = Field(..., ge=0, le=100)
    readability: int = Field(..., ge=0, le=100)
    security: int = Field(..., ge=0, le=100)
    performance: int = Field(..., ge=0, le=100)
    architecture: int = Field(..., ge=0, le=100)
    reasoning: str


class PrioritizationAgent:
    """Analyzes a PR and produces a priority score."""

    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client

    def _extract_json(self, raw: str) -> str:
        """Strip markdown fences and extract the inner JSON string."""
        raw = raw.strip()
        # Match ```json ... ``` or ``` ... ```
        match = re.search(r"```(?:json)?\s*(.*?)```", raw, re.DOTALL)
        if match:
            return match.group(1).strip()
        return raw

    async def analyze(
        self,
        repo: str,
        title: str | None,
        diff_text: str | None,
    ) -> PriorityScoreResult:
        """Analyze the PR using the LLM."""

        system_prompt = """
You are a software engineering PR prioritization agent.

Analyze the pull request and score it from 0 to 100 in these categories:

- readability
- security
- performance
- architecture

Then calculate an overall priority score.

Return ONLY valid JSON with this structure:

{
  "overall_score": 0,
  "readability": 0,
  "security": 0,
  "performance": 0,
  "architecture": 0,
  "reasoning": "..."
}

All scores must be integers between 0 and 100.
"""

        user_prompt = f"""
Repository: {repo}

PR title:
{title or "No title"}

PR diff:
{diff_text or "No diff available"}
"""

        raw_response = await self.llm_client.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        cleaned = self._extract_json(raw_response)

        try:
            data: dict[str, Any] = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise ValueError(
                "LLM returned invalid JSON"
            ) from exc

        return PriorityScoreResult.model_validate(data)