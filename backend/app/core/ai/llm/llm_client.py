"""LLM client abstraction for AI agents — Gemini adapter."""

from typing import Any

import httpx

from app.config import settings


class LLMClient:
    """Simple Google Gemini-compatible LLM client."""

    def __init__(self) -> None:
        self.api_key = settings.gemini_api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.model = "gemini-3.6-flash"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Send a prompt to Gemini and return the text response."""

        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        payload: dict[str, Any] = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
            },
        }

        url = (
            f"{self.base_url}/models/{self.model}:generateContent"
            f"?key={self.api_key}"
        )

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
            )

        response.raise_for_status()

        data = response.json()

        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            raise ValueError(
                f"Unexpected Gemini response shape: {data}"
            ) from exc