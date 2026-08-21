from fastapi import APIRouter, HTTPException, status
from app.common.schemas import JiraSprint, JiraSprintsResponse, JiraIssue
from app.core.jira.client import JiraClient

router = APIRouter()
jira_client = JiraClient()


@router.get("/sprints", response_model=JiraSprintsResponse)
async def get_sprints():
    if not jira_client.is_configured:
        return JiraSprintsResponse(
            sprints=[
                JiraSprint(
                    id=101,
                    name="Sprint 24 - Q3 Core Refactor",
                    state="active",
                    start_date="2026-08-10T09:00:00.000Z",
                    end_date="2026-08-24T18:00:00.000Z",
                    goal="Finish core migration & API hardening",
                    issues=[
                        JiraIssue(
                            id="10001",
                            key="VEL-101",
                            summary="Refactor database initialization for async execution",
                            status="In Progress",
                            assignee="Abdelrahman Omran",
                            story_points=5.0,
                        ),
                        JiraIssue(
                            id="10002",
                            key="VEL-102",
                            summary="Integrate Jira REST API sprint endpoint",
                            status="In Review",
                            assignee="Abdelrahman Omran",
                            story_points=3.0,
                        ),
                    ],
                ),
                JiraSprint(
                    id=102,
                    name="Sprint 25 - AI Orchestration",
                    state="future",
                    start_date="2026-08-25T09:00:00.000Z",
                    end_date="2026-09-08T18:00:00.000Z",
                    goal="Deploy Gemini agent prioritization pipeline",
                    issues=[
                        JiraIssue(
                            id="10003",
                            key="VEL-103",
                            summary="Enhance blast radius analyzer with AST parser",
                            status="To Do",
                            assignee=None,
                            story_points=8.0,
                        ),
                    ],
                ),
            ]
        )

    try:
        raw_sprints = await jira_client.fetch_sprints()
        sprints: list[JiraSprint] = []

        for raw in raw_sprints:
            if raw.get("state") in ("active", "future"):
                sprint_id = raw["id"]
                raw_issues = await jira_client.fetch_sprint_issues(sprint_id)

                issues = [
                    JiraIssue(
                        id=str(issue.get("id")),
                        key=issue.get("key", ""),
                        summary=issue.get("fields", {}).get("summary", ""),
                        status=issue.get("fields", {}).get("status", {}).get("name", "Unknown"),
                        assignee=issue.get("fields", {}).get("assignee", {}).get("displayName")
                        if issue.get("fields", {}).get("assignee")
                        else None,
                        story_points=issue.get("fields", {}).get("customfield_10016")
                        or issue.get("fields", {}).get("storyPoints"),
                    )
                    for issue in raw_issues
                ]

                sprints.append(
                    JiraSprint(
                        id=sprint_id,
                        name=raw.get("name", ""),
                        state=raw.get("state", ""),
                        start_date=raw.get("startDate"),
                        end_date=raw.get("endDate"),
                        goal=raw.get("goal"),
                        issues=issues,
                    )
                )

        return JiraSprintsResponse(sprints=sprints)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch Jira sprints: {str(e)}",
        )