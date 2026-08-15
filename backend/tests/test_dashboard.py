"""Tests for dashboard endpoints."""

import pytest


@pytest.mark.asyncio
async def test_sprint_health(client):
    """Returns Glass sprint health shape."""
    response = await client.get("/api/sprint/health")
    assert response.status_code == 200
    data = response.json()
    assert "sprint_name" in data
    assert "confidence_percent" in data
    assert "trend" in data
    assert "burndown" in data
    assert "blockers" in data
    assert "updated_at" in data
    assert isinstance(data["burndown"], dict)
    assert isinstance(data["blockers"], list)