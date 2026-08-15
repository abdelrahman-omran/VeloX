"""Tests for webhook endpoints."""

import hmac
import hashlib
import json
from unittest.mock import patch

import pytest
from sqlalchemy import select

import app.database
from app.common.models import PR
from app.config import settings


def _sign_payload(secret: str, payload: dict) -> str:
    body = json.dumps(payload).encode()
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


@pytest.mark.asyncio
async def test_health_check(client):
    """GET /health returns ok."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_github_webhook_missing_signature(client):
    """Missing X-Hub-Signature-256 returns 401."""
    with patch.object(settings, "github_webhook_secret", "test-secret"):
        response = await client.post("/webhooks/github", json={})
    assert response.status_code == 401
    assert response.json()["error"]["message"] == "Invalid signature"


@pytest.mark.asyncio
async def test_github_webhook_invalid_signature(client):
    """Bad signature returns 401."""
    payload = {"pull_request": {"id": 1}}
    with patch.object(settings, "github_webhook_secret", "test-secret"):
        response = await client.post(
            "/webhooks/github",
            json=payload,
            headers={"X-Hub-Signature-256": "sha256=bad"},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_github_webhook_missing_pr_data(client):
    """Missing pull_request payload returns 400."""
    payload = {}
    sig = _sign_payload("test-secret", payload)
    with patch.object(settings, "github_webhook_secret", "test-secret"):
        response = await client.post(
            "/webhooks/github",
            json=payload,
            headers={"X-Hub-Signature-256": sig},
        )
    assert response.status_code == 400
    assert response.json()["error"]["message"] == "No pull_request data"


@pytest.mark.asyncio
async def test_github_webhook_creates_pr_and_enqueues(client):
    """Valid webhook creates PR, returns 202, and enqueues scoring."""
    payload = {
        "repository": {"full_name": "owner/repo"},
        "pull_request": {
            "id": 55555,
            "number": 42,
            "title": "New feature",
            "user": {"login": "dev1"},
            "head": {"ref": "feature-branch", "sha": "abc123"},
            "base": {"sha": "def456"},
            "html_url": "https://github.com/owner/repo/pull/42",
        },
    }
    sig = _sign_payload("test-secret", payload)

    with patch.object(settings, "github_webhook_secret", "test-secret"):
        with patch("app.api.webhooks.score_pr") as mock_score:
            response = await client.post(
                "/webhooks/github",
                json=payload,
                headers={"X-Hub-Signature-256": sig},
            )

    assert response.status_code == 202
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
        assert pr.status == "scoring"
        assert pr.html_url == "https://github.com/owner/repo/pull/42"

    mock_score.assert_called_once_with(data["pr_id"])


@pytest.mark.asyncio
async def test_github_webhook_updates_pr(client):
    """Duplicate webhook updates existing PR and re-enqueues scoring."""
    payload = {
        "repository": {"full_name": "owner/repo"},
        "pull_request": {
            "id": 55556,
            "number": 43,
            "title": "Original title",
            "user": {"login": "dev1"},
            "head": {"ref": "feature-branch", "sha": "old_sha"},
            "base": {"sha": "base_sha"},
            "html_url": "https://github.com/owner/repo/pull/43",
        },
    }
    sig = _sign_payload("test-secret", payload)

    with patch.object(settings, "github_webhook_secret", "test-secret"):
        response1 = await client.post(
            "/webhooks/github",
            json=payload,
            headers={"X-Hub-Signature-256": sig},
        )
    assert response1.status_code == 202
    pr_id = response1.json()["pr_id"]

    # Update payload
    payload["pull_request"]["title"] = "Updated title"
    payload["pull_request"]["head"]["sha"] = "new_sha"
    sig2 = _sign_payload("test-secret", payload)

    with patch.object(settings, "github_webhook_secret", "test-secret"):
        with patch("app.api.webhooks.score_pr") as mock_score:
            response2 = await client.post(
                "/webhooks/github",
                json=payload,
                headers={"X-Hub-Signature-256": sig2},
            )
    assert response2.status_code == 202
    assert response2.json()["pr_id"] == pr_id

    async with app.database.AsyncSessionLocal() as db:
        result = await db.execute(select(PR).where(PR.id == pr_id))
        pr = result.scalar_one()
        assert pr.title == "Updated title"
        assert pr.head_sha == "new_sha"
        assert pr.status == "scoring"

    mock_score.assert_called_once_with(pr_id)