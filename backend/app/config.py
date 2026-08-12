"""Application configuration via Pydantic Settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # GitHub
    github_webhook_secret: str = ""
    github_token: str = ""

    # LLM (Gemini)
    gemini_api_key: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/velox"

    # App
    port: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()