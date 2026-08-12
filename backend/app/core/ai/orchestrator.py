"""Coordinates AI agents."""

from app.core.ai.agents.prioritization_agent import (
    PrioritizationAgent,
    PriorityScoreResult,
)
from app.core.ai.llm.llm_client import LLMClient


class AIOrchestrator:
    """Central coordinator for AI agents."""

    def __init__(self) -> None:
        llm_client = LLMClient()

        self.prioritization_agent = PrioritizationAgent(
            llm_client=llm_client
        )

    async def prioritize_pr(
        self,
        repo: str,
        title: str | None,
        diff_text: str | None,
    ) -> PriorityScoreResult:
        """Route a PR prioritization task to the appropriate agent."""

        return await self.prioritization_agent.analyze(
            repo=repo,
            title=title,
            diff_text=diff_text,
        )