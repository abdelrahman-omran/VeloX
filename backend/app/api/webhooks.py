"""GitHub webhook handler."""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db_session
from app.common.schemas import PRCreate
from app.common.models import PR

router = APIRouter()


async def upsert_pr(db: AsyncSession, data: PRCreate) -> PR:
    """Upsert PR on webhook receipt."""
    from sqlalchemy import select
    result = await db.execute(select(PR).where(PR.github_pr_id == data.github_pr_id))
    pr = result.scalar_one_or_none()
    if not pr:
        pr = PR(**data.model_dump(exclude_unset=True))
        db.add(pr)
    else:
        pr.head_sha = data.head_sha
        pr.base_sha = data.base_sha
        pr.title = data.title or pr.title
        pr.status = "pending"
    await db.commit()
    await db.refresh(pr)
    return pr


@router.post("/github")
async def github_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
):
    payload = await request.json()
    pr_data = payload.get("pull_request", {})

    if not pr_data:
        raise HTTPException(status_code=400, detail="No pull_request data")

    data = PRCreate(
        repo=payload["repository"]["full_name"],
        number=pr_data["number"],
        title=pr_data.get("title"),
        author=pr_data["user"]["login"],
        branch=pr_data["head"]["ref"],
        head_sha=pr_data["head"]["sha"],
        base_sha=pr_data["base"]["sha"],
        github_pr_id=pr_data["id"],
    )

    pr = await upsert_pr(db, data)
    return {"accepted": True, "pr_id": pr.id}