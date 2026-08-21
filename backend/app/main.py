"""FastAPI application factory."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import init_db, close_db
from app.api import webhooks, prs, dashboard, jira


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

# CORS for Glass (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard error envelope
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.status_code, "message": exc.detail}},
    )

app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(prs.router, prefix="/api/prs", tags=["prs"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(jira.router, prefix="/api/jira", tags=["jira"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}