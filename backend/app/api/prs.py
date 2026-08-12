"""PR API endpoints."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.dependencies import get_db_session
from app.common.schemas import PRBase
from app.common.models import PR

router = APIRouter()


@router.get("/active", response_model=List[PRBase])
async def list_active_prs(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(PR).where(PR.status != "error"))
    return result.scalars().all()


@router.get("/{pr_id}", response_model=PRBase)
async def get_pr(pr_id: int, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(PR).where(PR.id == pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    return pr