"""Application configuration via Pydantic Settings."""

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict

_LOCAL_HOSTS = {"localhost", "127.0.0.1", "postgres"}


class Settings(BaseSettings):
    # GitHub
    github_webhook_secret: str = ""
    github_token: str = ""

    # LLM (Gemini)
    gemini_api_key: str = ""

    # Jira Integration
    jira_domain: str = ""  # e.g., "company.atlassian.net"
    jira_email: str = ""
    jira_api_token: str = ""
    jira_board_id: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/velox"

    # App
    port: int = 8000

    # CORS: comma-separated list of allowed origins
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        """Normalize DATABASE_URL to a working asyncpg DSN.

        Hosted Postgres providers (Neon, etc.) hand out plain `postgresql://`
        or `postgres://` URLs with driver-specific query params (sslmode,
        channel_binding) that asyncpg doesn't understand. Force the asyncpg
        driver and drop those params; SSL is applied separately via
        connect_args based on `is_local_database`.
        """
        url = self.database_url
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://") :]
        if url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://") :]

        scheme, netloc, path, query, fragment = urlsplit(url)
        params = dict(parse_qsl(query))
        params.pop("sslmode", None)
        params.pop("channel_binding", None)
        return urlunsplit((scheme, netloc, path, urlencode(params), fragment))

    @property
    def is_local_database(self) -> bool:
        return urlsplit(self.database_url).hostname in _LOCAL_HOSTS


settings = Settings()