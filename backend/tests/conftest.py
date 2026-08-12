"""Pytest configuration."""

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.config import settings
from app.database import Base
import app.database as database_module
from app.main import app


@pytest_asyncio.fixture(autouse=True)
async def database():
    """
    Fresh engine + session factory for every test, bound to that test's loop.
    Monkey-patches app.database so the whole app uses them.
    """
    engine = create_async_engine(settings.database_url, echo=False)
    database_module.engine = engine
    database_module.AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text(
                "TRUNCATE TABLE priority_scores, blast_reports, job_logs, prs "
                "RESTART IDENTITY CASCADE"
            )
        )

    yield

    await engine.dispose()


@pytest_asyncio.fixture
async def client(database):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac