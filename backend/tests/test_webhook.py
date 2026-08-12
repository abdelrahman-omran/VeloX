"""Tests for webhook endpoints."""

import pytest
from sqlalchemy import select

import app.database
from app.common.models import PR


@pytest.mark.asyncio
async def test_health_check(client):
    """GET /health returns ok."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_github_webhook_missing_pr_data(client):
    """Missing pull_request payload returns 400."""
    response = await client.post("/webhooks/github", json={})
    assert response.status_code == 400
    assert response.json()["detail"] == "No pull_request data"


@pytest.mark.asyncio
async def test_github_webhook_creates_pr(client):
    """Valid webhook creates a new PR in the database."""
    payload = {
        "repository": {"full_name": "owner/repo"},
        "pull_request": {
            "id": 55555,
            "number": 42,
            "title": "New feature",
            "user": {"login": "dev1"},
            "head": {"ref": "feature-branch", "sha": "abc123"},
            "base": {"sha": "def456"},
        },
    }

    response = await client.post("/webhooks/github", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["accepted"] is True
    assert isinstance(data["pr_id"], int)

    # Verify in DB
    async with app.database.AsyncSessionLocal() as db:
        result = await db.execute(
            select(PR).where(PR.github_pr_id == 55555)
        )
        pr = result.scalar_one()
        assert pr.title == "New feature"
        assert pr.number == 42
        assert pr.status == "pending"


@pytest.mark.asyncio
async def test_github_webhook_updates_pr(client):
    """Duplicate webhook updates existing PR head_sha, title and status."""
    payload = {
        "repository": {"full_name": "owner/repo"},
        "pull_request": {
            "id": 55556,
            "number": 43,
            "title": "Original title",
            "user": {"login": "dev1"},
            "head": {"ref": "feature-branch", "sha": "old_sha"},
            "base": {"sha": "base_sha"},
        },
    }

    # First call - create
    response1 = await client.post("/webhooks/github", json=payload)
    assert response1.status_code == 200
    pr_id = response1.json()["pr_id"]

    # Update payload
    payload["pull_request"]["title"] = "Updated title"
    payload["pull_request"]["head"]["sha"] = "new_sha"

    # Second call - update
    response2 = await client.post("/webhooks/github", json=payload)
    assert response2.status_code == 200
    assert response2.json()["pr_id"] == pr_id

    # Verify update in DB
    async with app.database.AsyncSessionLocal() as db:
        result = await db.execute(select(PR).where(PR.id == pr_id))
        pr = result.scalar_one()
        assert pr.title == "Updated title"
        assert pr.head_sha == "new_sha"
        assert pr.status == "pending"