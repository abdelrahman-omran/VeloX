"""Shared enums used across modules."""
from enum import Enum


class PRStatus(str, Enum):
    pending = "pending"
    scored = "scored"
    analyzed = "analyzed"
    error = "error"


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class JobType(str, Enum):
    score_pr = "score_pr"
    analyze_pr = "analyze_pr"
    forecast_sprint = "forecast_sprint"


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"
    cancelled = "cancelled"