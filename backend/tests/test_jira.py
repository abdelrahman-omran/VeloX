import pytest
from unittest.mock import AsyncMock, patch, PropertyMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_sprints_unconfigured_returns_mock_data():
    response = client.get("/api/jira/sprints")
    assert response.status_code == 200
    data = response.json()
    assert "sprints" in data
    assert len(data["sprints"]) > 0
    assert "Sprint" in data["sprints"][0]["name"]


@patch("app.api.jira.jira_client.is_configured", new_callable=lambda: True)
@patch("app.api.jira.jira_client.fetch_sprints")
@patch("app.api.jira.jira_client.fetch_sprint_issues")
def test_get_sprints_configured_success(monkeypatch):
    # 1. Mock the environment variables so is_configured evaluates to True
    monkeypatch.setenv("JIRA_DOMAIN", "test-domain.atlassian.net")
    monkeypatch.setenv("JIRA_EMAIL", "test@example.com")
    monkeypatch.setenv("JIRA_API_TOKEN", "fake_token")
def test_get_sprints_configured_success(mock_is_configured, mock_fetch_issues, mock_fetch_sprints, mock_configured):
    mock_is_configured.return_value = True
    mock_fetch_sprints.return_value = [
        {
            "id": 1,
            "name": "Sprint 24",
            "state": "active",
            "startDate": "2026-08-01T00:00:00Z",
            "endDate": "2026-08-15T00:00:00Z",
            "goal": "Test goal",
        }
    ]
    mock_fetch_issues.return_value = [
        {
            "id": "10",
            "key": "VEL-1",
            "fields": {
                "summary": "Setup backend test suite",
                "status": {"name": "In Progress"},
                "assignee": {"displayName": "Developer"},
                "storyPoints": 3,
            },
        }
    ]

    response = client.get("/api/jira/sprints")
    assert response.status_code == 200
    data = response.json()
    assert len(data["sprints"]) == 1
    assert data["sprints"][0]["name"] == "Sprint 24"
    assert len(data["sprints"][0]["issues"]) == 1
    assert data["sprints"][0]["issues"][0]["key"] == "VEL-1"