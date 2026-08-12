"""Unit tests for LLMClient."""

from unittest.mock import AsyncMock, Mock, patch

import pytest

from app.core.ai.llm.llm_client import LLMClient


@pytest.fixture
def client():
    return LLMClient()


@pytest.mark.asyncio
async def test_generate_success(client):
    """Valid response is parsed and returned."""
    with patch.object(client, "api_key", "test-key"):
        mock_response = Mock()
        mock_response.raise_for_status = Mock()
        mock_response.json = Mock(
            return_value={
                "choices": [{"message": {"content": "Hello world"}}]
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
    _, kwargs = mock_http.post.call_args
    assert kwargs["headers"]["Authorization"] == "Bearer test-key"
    assert kwargs["json"]["model"] == "gpt-4o-mini"
    assert kwargs["json"]["messages"][0]["content"] == "system prompt"
    assert kwargs["json"]["messages"][1]["content"] == "user prompt"
    assert kwargs["json"]["temperature"] == 0.0


@pytest.mark.asyncio
async def test_generate_missing_api_key(client):
    """Missing key raises RuntimeError before any HTTP call."""
    with patch.object(client, "api_key", ""):
        with pytest.raises(RuntimeError, match="OPENAI_API_KEY is not configured"):
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