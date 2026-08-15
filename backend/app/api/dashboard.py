"""Dashboard API endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session

router = APIRouter()


@router.get("/sprint/health")
async def sprint_health(db: AsyncSession = Depends(get_db_session)):
    """Return sprint health metrics (static mock for V1)."""
    return {
        "sprint_name": "Sprint 42",
        "confidence_percent": 78,
        "trend": "stable",
        "burndown": {
            "total": 10,
            "completed": 7,
            "remaining": 3,
        },
        "blockers": [],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }