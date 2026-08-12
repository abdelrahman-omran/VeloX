"""FastAPI Depends providers."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db


async def get_db_session() -> AsyncSession:
    """Re-export for FastAPI Depends()."""
    async for session in get_db():
        yield session