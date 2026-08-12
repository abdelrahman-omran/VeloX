"""Tests for dashboard endpoints."""

import pytest


@pytest.mark.asyncio
async def test_sprint_health(client):
    """Returns stub sprint health shape."""
    response = await client.get("/api/sprint/health")
    assert response.status_code == 200
    data = response.json()
    assert data["total_prs"] == 0
    assert data["scored"] == 0
    assert data["analyzed"] == 0
    assert data["health_score"] is None
    assert data["forecast"] is None


@pytest.mark.asyncio
async def test_prs_overview_collision_returns_422(client):
    """
    /api/prs/overview is unreachable because the PRs router (registered first)
    catches it as /api/prs/{pr_id} and tries to parse 'overview' as an int.
    This test documents the routing collision.
    """
    response = await client.get("/api/prs/overview")
    assert response.status_code == 422