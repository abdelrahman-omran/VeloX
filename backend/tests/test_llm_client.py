"""Unit tests for LLMClient (Gemini adapter)."""

from unittest.mock import AsyncMock, Mock, patch

import pytest

from app.core.ai.llm.llm_client import LLMClient


@pytest.fixture
def client():
    return LLMClient()


@pytest.mark.asyncio
async def test_generate_success(client):
    """Valid Gemini response is parsed and returned."""
    with patch.object(client, "api_key", "test-key"):
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json = Mock(
            return_value={
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Hello world"}],
                            "role": "model",
                        }
                    }
                ]
            }
        )

        mock_http = AsyncMock()
        mock_http.post = AsyncMock(return_value=mock_response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_http):
            result = await client.generate("system prompt", "user prompt")

    assert result == "Hello world"
    mock_http.post.assert_called_once()
    args, kwargs = mock_http.post.call_args
    assert "key=test-key" in args[0]
    assert kwargs["json"]["systemInstruction"]["parts"][0]["text"] == "system prompt"
    assert kwargs["json"]["contents"][0]["parts"][0]["text"] == "user prompt"
    assert kwargs["json"]["generationConfig"]["temperature"] == 0.0
    assert "Authorization" not in kwargs.get("headers", {})


@pytest.mark.asyncio
async def test_generate_missing_api_key(client):
    """Missing key raises RuntimeError before any HTTP call."""
    with patch.object(client, "api_key", ""):
        with pytest.raises(RuntimeError, match="GEMINI_API_KEY is not configured"):
            await client.generate("system", "user")


@pytest.mark.asyncio
async def test_generate_http_error_propagates(client):
    """HTTP errors from raise_for_status propagate."""
    with patch.object(client, "api_key", "test-key"):
        mock_response = Mock()
        mock_response.raise_for_status = Mock(
            side_effect=Exception("HTTP 429 Too Many Requests")
        )
        mock_response.json = Mock(return_value={})

        mock_http = AsyncMock()
        mock_http.post = AsyncMock(return_value=mock_response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_http):
            with pytest.raises(Exception, match="HTTP 429"):
                await client.generate("system", "user")


@pytest.mark.asyncio
async def test_generate_malformed_response_raises_value_error(client):
    """Unexpected response shape raises ValueError."""
    with patch.object(client, "api_key", "test-key"):
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json = Mock(return_value={"candidates": []})

        mock_http = AsyncMock()
        mock_http.post = AsyncMock(return_value=mock_response)
        mock_http.__aenter__ = AsyncMock(return_value=mock_http)
        mock_http.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_http):
            with pytest.raises(ValueError, match="Unexpected Gemini response shape"):
                await client.generate("system", "user")