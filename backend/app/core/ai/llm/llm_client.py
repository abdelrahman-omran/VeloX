"""LLM client abstraction for AI agents."""

from typing import Any

import httpx

from app.config import settings


class LLMClient:
    """Simple OpenAI-compatible LLM client."""

    def __init__(self) -> None:
        self.api_key = settings.openai_api_key
        self.base_url = "https://api.openai.com/v1"
        self.model = "gpt-4o-mini"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Send a prompt to the LLM and return the text response."""

        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            "temperature": 0.0,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )

        response.raise_for_status()

        data = response.json()

        return data["choices"][0]["message"]["content"]