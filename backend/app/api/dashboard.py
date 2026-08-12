"""Dashboard API endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session

router = APIRouter()


@router.get("/sprint/health")
async def sprint_health(db: AsyncSession = Depends(get_db_session)):
    return {
        "total_prs": 0,
        "scored": 0,
        "analyzed": 0,
        "health_score": None,
        "forecast": None,
    }


@router.get("/prs/overview")
async def prs_overview(db: AsyncSession = Depends(get_db_session)):
    return {"prs": []}