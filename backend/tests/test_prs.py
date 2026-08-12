"""Tests for PR API endpoints."""

from unittest.mock import patch

import pytest

from app.common.models import PR
import app.database  # <-- changed from "from app.database import AsyncSessionLocal"


@pytest.mark.asyncio
async def test_score_pr_endpoint(client):
    """POST /api/prs/{id}/score should queue scoring."""

    async with app.database.AsyncSessionLocal() as db:  # <-- runtime lookup
        pr = PR(
            github_pr_id=98765,
            repo="owner/repo",
            number=10,
            title="Test PR",
            status="pending",
        )

        db.add(pr)
        await db.commit()
        await db.refresh(pr)

        pr_id = pr.id

    with patch(
        "app.api.prs.score_pr"
    ) as mock_score:

        response = await client.post(
            f"/api/prs/{pr_id}/score",
            json={},
        )

    assert response.status_code == 202

    body = response.json()

    assert body["pr_id"] == pr_id
    assert body["status"] == "queued"

    mock_score.assert_called_once_with(pr_id)