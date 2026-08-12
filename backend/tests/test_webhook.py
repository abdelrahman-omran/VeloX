"""Webhook endpoint tests."""
import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_github_webhook_missing_pr_data(client):
    response = await client.post("/webhooks/github", json={})
    assert response.status_code == 400