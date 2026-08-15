"""SQLAlchemy ORM models."""

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PR(Base):
    __tablename__ = "prs"

    id = Column(Integer, primary_key=True)

    github_pr_id = Column(BigInteger, nullable=False, unique=True)

    repo = Column(String, nullable=False)
    number = Column(Integer, nullable=False)
    title = Column(String)
    author = Column(String)
    branch = Column(String)
    head_sha = Column(String)
    base_sha = Column(String)
    html_url = Column(String)
    diff_text = Column(Text)

    status = Column(String, nullable=False, default="scoring")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    priority_score = relationship(
        "PriorityScore",
        back_populates="pr",
        uselist=False,
        cascade="all, delete-orphan",
    )

    blast_report = relationship(
        "BlastReport",
        back_populates="pr",
        uselist=False,
        cascade="all, delete-orphan",
    )


class PriorityScore(Base):
    __tablename__ = "priority_scores"

    pr_id = Column(
        Integer,
        ForeignKey("prs.id", ondelete="CASCADE"),
        primary_key=True,
    )

    risk_score = Column(Integer, nullable=False)
    readability = Column(Integer, nullable=False)
    security = Column(Integer, nullable=False)
    performance = Column(Integer, nullable=False)
    architecture = Column(Integer, nullable=False)

    reasoning = Column(Text)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    pr = relationship(
        "PR",
        back_populates="priority_score",
    )

    __table_args__ = (
        CheckConstraint(
            "risk_score BETWEEN 0 AND 100",
            name="ck_priority_risk_score",
        ),
        CheckConstraint(
            "readability BETWEEN 0 AND 100",
            name="ck_priority_readability",
        ),
        CheckConstraint(
            "security BETWEEN 0 AND 100",
            name="ck_priority_security",
        ),
        CheckConstraint(
            "performance BETWEEN 0 AND 100",
            name="ck_priority_performance",
        ),
        CheckConstraint(
            "architecture BETWEEN 0 AND 100",
            name="ck_priority_architecture",
        ),
    )


class BlastReport(Base):
    __tablename__ = "blast_reports"

    pr_id = Column(
        Integer,
        ForeignKey("prs.id", ondelete="CASCADE"),
        primary_key=True,
    )

    files_changed = Column(Integer)
    lines_added = Column(Integer)
    lines_removed = Column(Integer)

    # Stored as JSON strings for now.
    modules_touched = Column(Text)
    entry_points = Column(Text)
    downstream_files = Column(Text)

    impact_score = Column(Integer)

    risk_level = Column(String)

    analyzed_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    pr = relationship(
        "PR",
        back_populates="blast_report",
    )

    __table_args__ = (
        CheckConstraint(
            "impact_score BETWEEN 0 AND 100",
            name="ck_blast_impact_score",
        ),
        CheckConstraint(
            "risk_level IN ('low', 'medium', 'high', 'critical')",
            name="ck_blast_risk_level",
        ),
    )


class JobLog(Base):
    __tablename__ = "job_logs"

    id = Column(Integer, primary_key=True)

    idempotency_key = Column(
        String,
        unique=True,
        nullable=False,
    )

    correlation_id = Column(String)

    job_type = Column(String, nullable=False)

    entity_type = Column(String)
    entity_id = Column(String)

    status = Column(
        String,
        nullable=False,
        default="pending",
    )

    attempt_count = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)

    error_message = Column(Text)
    worker_id = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))