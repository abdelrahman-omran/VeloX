"""Tests for PR API endpoints."""

from unittest.mock import patch

import pytest
from sqlalchemy import select

from app.common.models import PR
import app.database


@pytest.mark.asyncio
async def test_list_active_prs(client):
    """GET /api/prs/active returns {items: [...]} with Glass shape."""
    async with app.database.AsyncSessionLocal() as db:
        pr1 = PR(
            github_pr_id=1001,
            repo="a/b",
            number=1,
            title="T1",
            status="scoring",
        )
        pr2 = PR(
            github_pr_id=1002,
            repo="a/b",
            number=2,
            title="T2",
            status="scored",
        )
        pr3 = PR(
            github_pr_id=1003,
            repo="a/b",
            number=3,
            title="T3",
            status="error",
        )
        db.add_all([pr1, pr2, pr3])
        await db.commit()

    response = await client.get("/api/prs/active")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 2
    ids = {p["id"] for p in data["items"]}
    assert ids == {"a/b#1", "a/b#2"}
    for item in data["items"]:
        assert "risk_score" in item
        assert "readability" in item
        assert "security" in item
        assert "performance" in item
        assert "architecture" in item
        assert "ai_summary" in item
        assert "html_url" in item
        assert item["status"] in ("scoring", "scored", "error")


@pytest.mark.asyncio
async def test_get_pr_found(client):
    """GET /api/prs/{id} returns existing PR."""
    async with app.database.AsyncSessionLocal() as db:
        pr = PR(
            github_pr_id=2001,
            repo="a/b",
            number=5,
            title="Found",
            status="scoring",
        )
        db.add(pr)
        await db.commit()
        await db.refresh(pr)

    response = await client.get(f"/api/prs/{pr.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Found"
    assert data["id"] == pr.id
    assert data["number"] == 5


@pytest.mark.asyncio
async def test_get_pr_not_found(client):
    """GET /api/prs/{id} returns 404 for missing PR."""
    response = await client.get("/api/prs/999999")
    assert response.status_code == 404
    assert response.json()["error"]["message"] == "PR not found"


@pytest.mark.asyncio
async def test_score_pr_already_scored(client):
    """POST /score for already-scored PR returns already_scored."""
    async with app.database.AsyncSessionLocal() as db:
        pr = PR(
            github_pr_id=3001,
            repo="a/b",
            number=10,
            title="Scored",
            status="scored",
        )
        db.add(pr)
        await db.commit()
        await db.refresh(pr)

    response = await client.post(f"/api/prs/{pr.id}/score", json={})
    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "already_scored"


@pytest.mark.asyncio
async def test_score_pr_not_found(client):
    """POST /score for nonexistent PR returns 404."""
    response = await client.post("/api/prs/999999/score", json={})
    assert response.status_code == 404
    assert response.json()["error"]["message"] == "PR not found"


@pytest.mark.asyncio
async def test_score_pr_endpoint(client):
    """POST /api/prs/{id}/score should queue scoring."""
    async with app.database.AsyncSessionLocal() as db:
        pr = PR(
            github_pr_id=98765,
            repo="owner/repo",
            number=10,
            title="Test PR",
            status="scoring",
        )
        db.add(pr)
        await db.commit()
        await db.refresh(pr)
        pr_id = pr.id

    with patch("app.api.prs.score_pr") as mock_score:
        response = await client.post(
            f"/api/prs/{pr_id}/score",
            json={},
        )

    assert response.status_code == 202
    body = response.json()
    assert body["pr_id"] == pr_id
    assert body["status"] == "queued"
    mock_score.assert_called_once_with(pr_id)