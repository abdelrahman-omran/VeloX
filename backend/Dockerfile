# ─────────────────────────────────────────────
# VeloX Backend — Production Dockerfile
# ─────────────────────────────────────────────

FROM python:3.12-slim AS builder

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python deps into a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# ─────────────────────────────────────────────
# Runtime stage
# ─────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Runtime deps for asyncpg + healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Non-root user setup
RUN useradd -m -u 1000 velox

# Copy application code with correct ownership
COPY --chown=velox:velox app/ ./app/

USER velox

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]