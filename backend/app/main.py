"""FastAPI application factory."""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import init_db, close_db
from app.api import webhooks, prs, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables. Shutdown: close connections."""
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="VeloX",
    description="AI-powered PR analysis",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(prs.router, prefix="/api/prs", tags=["prs"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}