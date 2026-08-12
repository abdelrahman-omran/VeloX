"""SQLAlchemy ORM models."""
from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger
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
    diff_text = Column(Text)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())