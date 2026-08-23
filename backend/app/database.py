"""SQLAlchemy async engine and session factory."""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.config import settings

engine = create_async_engine(
    settings.sqlalchemy_database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False,
    connect_args={} if settings.is_local_database else {"ssl": "require"},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    """Yield a transactional session. Rolls back on unhandled exceptions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create tables on startup (dev only). Production uses Alembic."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Dispose engine pools on shutdown."""
    await engine.dispose()