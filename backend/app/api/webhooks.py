"""GitHub webhook handler."""
import hmac
import hashlib
import json

from fastapi import APIRouter, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db_session
from app.common.schemas import PRCreate
from app.common.models import PR
from app.core.prioritization.service import score_pr

router = APIRouter()


def _verify_signature(body: bytes, signature: str, secret: str) -> bool:
    """Verify GitHub webhook HMAC-SHA256 signature."""
    if not signature:
        return False
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)


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
        pr.html_url = data.html_url or pr.html_url
        pr.status = "scoring"
    await db.commit()
    await db.refresh(pr)
    return pr


@router.post("/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")

    if not _verify_signature(body, signature, settings.github_webhook_secret):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(body)
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
        html_url=pr_data.get("html_url"),
    )

    pr = await upsert_pr(db, data)
    background_tasks.add_task(score_pr, pr.id)

    return JSONResponse(
        status_code=202,
        content={"accepted": True, "pr_id": pr.id},
    )