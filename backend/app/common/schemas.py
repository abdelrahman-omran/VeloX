"""Shared Pydantic DTOs."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PRBase(BaseModel):
    id: int
    repo: str
    number: int
    title: Optional[str] = None
    author: Optional[str] = None
    branch: Optional[str] = None
    head_sha: Optional[str] = None
    base_sha: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class PRCreate(BaseModel):
    repo: str
    number: int
    title: Optional[str] = None
    author: Optional[str] = None
    branch: Optional[str] = None
    head_sha: Optional[str] = None
    base_sha: Optional[str] = None
    github_pr_id: Optional[int] = None