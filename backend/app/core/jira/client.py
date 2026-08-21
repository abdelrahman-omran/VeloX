import httpx
from app.config import settings


class JiraClient:
    def __init__(self):
        self.domain = settings.jira_domain.replace("https://", "").rstrip("/")
        self.email = settings.jira_email
        self.token = settings.jira_api_token
        self.board_id = settings.jira_board_id

    @property
    def is_configured(self) -> bool:
        return bool(self.domain and self.email and self.token and self.board_id)

    async def fetch_sprints(self) -> list[dict]:
        if not self.is_configured:
            return []

        url = f"https://{self.domain}/rest/agile/1.0/board/{self.board_id}/sprint"
        auth = (self.email, self.token)
        headers = {"Accept": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, auth=auth, headers=headers, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return data.get("values", [])

    async def fetch_sprint_issues(self, sprint_id: int) -> list[dict]:
        if not self.is_configured:
            return []

        url = f"https://{self.domain}/rest/agile/1.0/sprint/{sprint_id}/issue"
        auth = (self.email, self.token)
        headers = {"Accept": "application/json"}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, auth=auth, headers=headers, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return data.get("issues", [])