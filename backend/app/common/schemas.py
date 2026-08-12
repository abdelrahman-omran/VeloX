"""Shared Pydantic DTOs."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# ─────────────────────────────────────────────
# PR Schemas
# ─────────────────────────────────────────────

class PRBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repo: str
    number: int
    title: str | None = None
    author: str | None = None
    branch: str | None = None
    head_sha: str | None = None
    base_sha: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class PRCreate(BaseModel):
    repo: str
    number: int
    title: str | None = None
    author: str | None = None
    branch: str | None = None
    head_sha: str | None = None
    base_sha: str | None = None
    github_pr_id: int


class PRDetail(PRBase):
    diff_text: str | None = None


# ─────────────────────────────────────────────
# Priority Score Schemas
# ─────────────────────────────────────────────

class PriorityScoreBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pr_id: int

    overall_score: int = Field(..., ge=0, le=100)
    readability: int = Field(..., ge=0, le=100)
    security: int = Field(..., ge=0, le=100)
    performance: int = Field(..., ge=0, le=100)
    architecture: int = Field(..., ge=0, le=100)

    reasoning: str | None = None
    rank: int | None = None

    created_at: datetime
    updated_at: datetime


class PRWithScore(PRBase):
    """PR joined with its priority score."""

    score: Optional[PriorityScoreBase] = None

    model_config = ConfigDict(
        from_attributes=True
    )


# ─────────────────────────────────────────────
# Blast Radius Schemas
# ─────────────────────────────────────────────

class BlastReportBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pr_id: int

    files_changed: int | None = None
    lines_added: int | None = None
    lines_removed: int | None = None

    modules_touched: list[str] = []
    entry_points: list[str] = []
    downstream_files: list[str] = []

    impact_score: int = Field(..., ge=0, le=100)

    risk_level: str

    analyzed_at: datetime


class PRWithImpact(PRBase):
    impact: BlastReportBase | None = None


class PROverviewItem(PRBase):
    score: PriorityScoreBase | None = None
    impact: BlastReportBase | None = None


# ─────────────────────────────────────────────
# Job Log Schemas
# ─────────────────────────────────────────────

class JobLogBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    idempotency_key: str
    correlation_id: str | None = None

    job_type: str

    entity_type: str | None = None
    entity_id: str | None = None

    status: str

    attempt_count: int
    max_attempts: int

    error_message: str | None = None
    worker_id: str | None = None

    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


# ─────────────────────────────────────────────
# API Request / Response Schemas
# ─────────────────────────────────────────────
class ScorePRRequest(BaseModel):
    """Request body for POST /api/prs/{id}/score."""
    pass

class ScorePRResponse(BaseModel):
    pr_id: int
    status: str
    message: str


class SprintHealthResponse(BaseModel):
    total_prs: int
    scored: int
    analyzed: int
    health_score: int | None = None
    forecast: str | None = None


class PROverviewResponse(BaseModel):
    prs: list[PROverviewItem]


class ImpactResponse(BaseModel):
    pr_id: int
    impact: BlastReportBase | None = None


class GraphNode(BaseModel):
    id: str
    type: str


class GraphEdge(BaseModel):
    source: str
    target: str


class ImpactGraphResponse(BaseModel):
    pr_id: int
    nodes: list[GraphNode]
    edges: list[GraphEdge]