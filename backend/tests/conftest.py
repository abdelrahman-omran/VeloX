"""Pytest configuration."""
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import init_db, close_db


@pytest_asyncio.fixture(scope="session")
async def db():
    await init_db()
    yield
    await close_db()


@pytest_asyncio.fixture
async def client(db):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac