# Agentic Team Lead Assistant — Low-Level Design

> **Stack:** Python (FastAPI) · ARQ · SQLite · Redis · React  
> **Architecture:** Modular Monolith (single deployable, clean domain boundaries)  
> **Date:** 2026-08-04

---

## 1. Overview

Agentic Team Lead Assistant is a single-backend application that acts as an AI-powered team lead. It receives GitHub webhooks, analyzes PRs through specialized AI agents, and serves a React dashboard with prioritization, blast radius, and sprint forecasting.

**Key decisions:**
- **ARQ** for background jobs — asyncio-native, typed, minimal ops.
- **SQLite** kept for persistence — WAL mode + busy-timeout make it viable for modest worker concurrency.
- **Redis** required by ARQ for the job queue only.
- **Agentic architecture** — `orchestrator` coordinates specialized agents (`prioritization`, `blast_radius`, `sprint_forecast`).
- **Modular monolith** — domains are separate modules with zero cross-imports.

---

## 2. Repository Layout

```
agentic-team-lead/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI factory, router mount, lifespan
│   │   ├── config.py                    # Pydantic Settings (env-only, no secrets baked)
│   │   ├── database.py                  # SQLAlchemy engine + session (SQLite, WAL)
│   │   ├── dependencies.py              # FastAPI Depends: DB, Redis, HTTP clients
│   │   │
│   │   ├── common/                      # Shared kernel (both modules may read, neither owns)
│   │   │   ├── __init__.py
│   │   │   ├── enums.py                 # PRStatus, JobStatus, RiskLevel
│   │   │   ├── schemas.py               # PRBase, PRMetadata shared DTOs
│   │   │   └── models.py                # SQLAlchemy: PR table (shared reference)
│   │   │
│   │   ├── api/                         # HTTP layer (thin controllers)
│   │   │   ├── __init__.py
│   │   │   ├── webhooks.py              # POST /webhooks/github → enqueue ARQ task
│   │   │   ├── prs.py                   # GET /api/prs/active, GET /api/prs/{id}
│   │   │   └── dashboard.py             # GET /api/sprint/health, GET /api/prs/overview
│   │   │
│   │   ├── core/                        # Domain layer — pure business logic, no frameworks
│   │   │   ├── __init__.py
│   │   │   ├── prioritization/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── service.py           # Delegates to prioritization_agent via orchestrator
│   │   │   │   └── github_client.py     # verify webhook sig + fetch diff
│   │   │   ├── blast_radius/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── service.py           # Delegates to blast_radius_agent via orchestrator
│   │   │   │   ├── code_parser.py       # AST / import extraction from diff text
│   │   │   │   └── impact_graph.py      # reach calculator + risk scoring
│   │   │   └── ai/                      # Agentic layer — orchestrator + agents + LLM infra
│   │   │       ├── __init__.py
│   │   │       ├── orchestrator.py      # Coordinates agents, routes tasks, manages context
│   │   │       ├── agents/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── prioritization_agent.py   # Agent: scores PRs, ranks priority
│   │   │       │   ├── blast_radius_agent.py     # Agent: analyzes code impact
│   │   │       │   └── sprint_forecast_agent.py  # Agent: predicts sprint health
│   │   │       └── llm/
│   │   │           ├── __init__.py
│   │   │           ├── llm_client.py    # OpenAI-compatible adapter + schema validation
│   │   │           ├── prompt_loader.py # Loads prompt templates by agent/task
│   │   │           └── response_validator.py  # Pydantic validation of LLM outputs
│   │   │
│   │   └── workers/                     # ARQ task definitions + queue wiring
│   │       ├── __init__.py
│   │       ├── queue.py                 # Redis pool factory, ARQ settings
│   │       ├── prioritization.py        # @task score_pr_task(ctx, pr_id, ...)
│   │       └── blast_radius.py          # @task analyze_pr_task(ctx, pr_id)
│   │
│   ├── worker.py                        # Entrypoint: `arq app.worker.WorkerSettings`
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_webhook.py
│   │   ├── test_scoring.py
│   │   └── test_blast_radius.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   └── entrypoint.sh
│
├── frontend/                            # React + Vite + nginx
│   ├── src/
│   │   ├── modules/
│   │   │   ├── prioritization/
│   │   │   │   ├── PRList.tsx
│   │   │   │   └── PRScoreCard.tsx
│   │   │   ├── blast_radius/
│   │   │   │   ├── ImpactGraph.tsx
│   │   │   │   └── FileTree.tsx
│   │   │   └── dashboard/
│   │   │       ├── SprintHealthPanel.tsx
│   │   │       └── PROverview.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml                   # prod-like stack
├── docker-compose.override.yml          # dev overrides (hot reload)
├── .dockerignore
└── .env.example
```

---

## 3. File Responsibilities

### Application Core

| File | Responsibility |
|------|----------------|
| `main.py` | FastAPI app factory. Mounts routers under `/api/*`. Starts ARQ Redis pool in lifespan. Creates SQLite tables on startup. |
| `config.py` | `Pydantic Settings` class. Reads `GITHUB_WEBHOOK_SECRET`, `LLM_API_KEY`, `DATABASE_URL`, `REDIS_URL`, etc. from env. Fails fast on boot if required vars missing. |
| `database.py` | SQLAlchemy `create_engine` + `sessionmaker`. SQLite with `check_same_thread=False`, `poolclass=NullPool` for workers, `PRAGMA journal_mode=WAL`. |
| `dependencies.py` | FastAPI `Depends()` providers: `get_db()` (Session), `get_redis_pool()` (ARQ), `get_http_client()` (httpx.AsyncClient singleton). |

### Common (Shared Kernel)

| File | Responsibility |
|------|----------------|
| `common/enums.py` | `PRStatus` (`pending`, `scored`, `analyzed`, `error`), `JobStatus`, `RiskLevel`. |
| `common/schemas.py` | Pydantic DTOs shared across modules: `PRBase`, `PRMetadata`. |
| `common/models.py` | SQLAlchemy `PR` table. **Read-only reference** for both modules. Stores raw metadata + cached diff. Neither module imports the other's schemas. |

### API Layer

| File | Responsibility |
|------|----------------|
| `api/webhooks.py` | `POST /webhooks/github`. Verifies HMAC signature, upserts `PR` row, enqueues ARQ task, returns `202 Accepted`. |
| `api/prs.py` | `GET /api/prs/active` (list with scores), `GET /api/prs/{id}` (detail). |
| `api/dashboard.py` | `GET /api/sprint/health` (aggregated KPIs), `GET /api/prs/overview` (joined view of both modules). |

### Domain Services (Core)

| File | Responsibility |
|------|----------------|
| `core/prioritization/service.py` | `score_pr(db, pr_id, owner, repo, number)`. Orchestrates: fetch diff → delegate to `ai.orchestrator` → persist results. Thin wrapper around the agentic layer. |
| `core/prioritization/github_client.py` | `verify_signature(body, sig, secret)` (HMAC-SHA256). `fetch_diff(owner, repo, number, token)` via GitHub REST API. |
| `core/blast_radius/service.py` | `analyze_pr(db, pr_id)`. Reads cached diff → delegates to `ai.orchestrator` → writes `blast_reports`, updates `PR.status`. |
| `core/blast_radius/code_parser.py` | Extracts changed files, imports, and module boundaries from raw diff text. Language-agnostic regex + optional AST. |
| `core/blast_radius/impact_graph.py` | Calculates downstream reach: "files importing changed modules". Computes `impact_score` (0-100) and `risk_level`. |

### Agentic Layer (Core / AI)

| File | Responsibility |
|------|----------------|
| `core/ai/orchestrator.py` | Central coordinator. Receives task requests from services, selects the right agent, manages shared context (PR metadata, diff), and aggregates multi-agent results. Think of it as the "team lead" that delegates to specialized agents. |
| `core/ai/agents/prioritization_agent.py` | Specialized agent for PR scoring and ranking. Builds scoring prompts via `prompt_loader`, calls `llm_client`, validates via `response_validator`. Returns structured scores + reasoning. |
| `core/ai/agents/blast_radius_agent.py` | Specialized agent for impact analysis. Consumes parsed diff + graph data, builds impact assessment prompts, calls LLM for risk narrative + severity classification. |
| `core/ai/agents/sprint_forecast_agent.py` | Specialized agent for sprint health prediction. Analyzes aggregate PR data, velocity trends, and risk distribution. Called by `dashboard/service.py` for sprint-level insights. |
| `core/ai/llm/llm_client.py` | Low-level LLM adapter. Calls OpenAI-compatible endpoint. Handles retries, timeouts, token budgeting. Returns raw JSON string. |
| `core/ai/llm/prompt_loader.py` | Loads prompt templates from files or constants by agent name + task type. Supports prompt versioning and A/B testing. |
| `core/ai/llm/response_validator.py` | Pydantic-based validation of LLM JSON outputs. Enforces `llm-output.schema.json`. Raises `LLMValidationError` on schema drift. |

### Workers (ARQ)

| File | Responsibility |
|------|----------------|
| `workers/queue.py` | `create_redis_pool()` — ARQ Redis connection. Shared by API (enqueue) and workers (consume). |
| `workers/prioritization.py` | `score_pr_task(ctx, pr_id, owner, repo, number)`. Wraps `core.prioritization.service.score_pr`. ARQ handles retry on failure. |
| `workers/blast_radius.py` | `analyze_pr_task(ctx, pr_id)`. Wraps `core.blast_radius.service.analyze_pr`. |
| `worker.py` | Standalone entrypoint. `WorkerSettings` binds Redis, task functions, `max_jobs`, `job_timeout`, `max_tries`. |

---

## 4. Architecture & Design Patterns Catalog

This project follows a combination of architectural patterns and software design patterns to maintain separation of concerns, extensibility, and clean integration with external systems.

---

## 4.1 Architecture Patterns

| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| **Layered Architecture** | `api/ → core/ → database/` | Keeps the HTTP layer thin. Business logic lives in `core/` and remains independent from frameworks such as FastAPI or infrastructure details. |
| **Event-Driven Architecture** | GitHub Webhooks → Processing Pipeline | GitHub events trigger internal workflows without tightly coupling external events with business logic. Allows adding new reactions to events without modifying webhook handling. |
| **AI Agent Orchestration Architecture** | `orchestrator.py` routes tasks to specialized agents | The orchestrator acts as a team leader that delegates tasks to specialized AI agents such as prioritization, blast radius analysis, and sprint forecasting. New agents can be added without modifying existing workflows. |
| **Module Boundaries** | Separate `ai/`, `analysis/`, and `integrations/` modules with controlled dependencies | Prevents tightly coupled code and allows each module to be tested, replaced, or extended independently. |

---

## 4.2 Design Patterns

| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| **Dependency Injection** | `dependencies.py` + FastAPI `Depends()` | External resources such as database sessions, HTTP clients, and configuration objects are injected instead of created inside business logic. This improves testing and flexibility. |
| **Adapter** | `github_client.py` and `llm_client.py` | Isolates third-party APIs behind internal interfaces. Changes in GitHub APIs or LLM providers only affect the adapter layer. |
| **Strategy** | `LLMClient` interface with implementations such as `OpenAILLMClient` | Allows switching between different AI providers (OpenAI, Gemini, Claude, local models) without changing agent logic. |
| **Command** | Background task functions (`score_pr_task`, `analyze_pr_task`) executed by workers | Encapsulates independent operations as executable tasks with support for retries and asynchronous processing. |
| **Data Access Layer** | SQLAlchemy session management through dependency injection | Provides a clear boundary between business logic and persistence. Database implementation details remain isolated from the core system. |
| **DTO / Schema** | Pydantic models in `schemas.py` and shared schemas | Defines strict data contracts for API communication, validation, serialization, and AI model outputs. |
| **Idempotent Consumer** | Worker checks PR processing status before executing duplicate tasks | Protects against duplicate GitHub webhook deliveries and ensures safe retries during asynchronous processing. |


## 5. Module Boundaries (Hard Rules)

```
┌─────────────────────────────────────────┐
│  api/webhooks.py                        │
│  api/prs.py                             │
│  api/dashboard.py                       │
└─────────────┬───────────────────────────┘
              │ Depends()
┌─────────────▼───────────────────────────┐
│  workers/prioritization.py              │
│  workers/blast_radius.py                │
└─────────────┬───────────────────────────┘
              │ calls
┌─────────────▼──────────┐  ┌─────────────▼──────────┐
│  core/prioritization/  │  │  core/blast_radius/    │
│  • service.py          │  │  • service.py          │
│  • github_client.py    │  │  • code_parser.py      │
└──────────┬─────────────┘  └──────────┬─────────────┘
           │                           │
           └───────────┬───────────────┘
                       │ delegates to
           ┌───────────▼───────────────┐
           │  core/ai/orchestrator.py  │
           │  (team lead coordinator)  │
           └───────────┬───────────────┘
                       │ routes to
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  agents/     │ │  agents/     │ │  agents/     │
│  prioritiza- │ │  blast_      │ │  sprint_     │
│  tion_agent  │ │  radius_agent│ │  forecast_   │
│              │ │              │ │  agent       │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┴────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  core/ai/llm/         │
              │  • llm_client.py      │
              │  • prompt_loader.py   │
              │  • response_validator │
              └───────────┬───────────┘
                          │
           ┌──────────────┴──────────────┐
           │  common/models.py (PR)      │
           │  database.py (SQLite)       │
           └─────────────────────────────┘
```

**Rules:**
1. `core/prioritization/` **never** imports from `core/blast_radius/` and vice versa.
2. Both modules **read** `common/models.PR` but **write only to their own** tables (`priority_scores`, `blast_reports`).
3. `core/ai/orchestrator.py` is the **only** cross-domain coordinator. Services do not call agents directly — they ask the orchestrator.
4. Agents **never** import from services. They receive pure data (diff text, parsed graphs) and return structured results.
5. `api/dashboard.py` is the **only** join point allowed to query both module tables in one SQL statement.
6. `api/` never calls `core/` directly for writes — it always goes through `workers/` (enqueue) or `core/` via Depends for read-only endpoints.

---

## 6. Database Schema

### Shared Table

```sql
-- prs (common/models.py)
CREATE TABLE prs (
    id          TEXT PRIMARY KEY,        -- owner/repo#number
    repo        TEXT NOT NULL,
    number      INTEGER NOT NULL,
    title       TEXT,
    author      TEXT,
    branch      TEXT,
    diff_text   TEXT,                    -- cached raw diff
    status      TEXT DEFAULT 'pending',  -- pending | scored | analyzed | error
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Prioritization Table

```sql
-- priority_scores (core/prioritization/models.py)
CREATE TABLE priority_scores (
    pr_id           TEXT PRIMARY KEY REFERENCES prs(id),
    overall_score   INTEGER CHECK(overall_score BETWEEN 0 AND 100),
    readability     INTEGER CHECK(readability BETWEEN 0 AND 100),
    security        INTEGER CHECK(security BETWEEN 0 AND 100),
    performance     INTEGER CHECK(performance BETWEEN 0 AND 100),
    architecture    INTEGER CHECK(architecture BETWEEN 0 AND 100),
    reasoning       TEXT,                -- JSON: {"readability": "...", ...}
    rank            INTEGER,
    scored_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Blast Radius Table

```sql
-- blast_reports (core/blast_radius/models.py)
CREATE TABLE blast_reports (
    pr_id               TEXT PRIMARY KEY REFERENCES prs(id),
    files_changed       INTEGER,
    lines_added         INTEGER,
    lines_removed       INTEGER,
    modules_touched     TEXT,            -- JSON array
    entry_points        TEXT,            -- JSON array
    downstream_files    TEXT,            -- JSON array
    impact_score        INTEGER CHECK(impact_score BETWEEN 0 AND 100),
    risk_level          TEXT CHECK(risk_level IN ('low','medium','high','critical')),
    analyzed_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. ARQ Worker Architecture

### Why ARQ?
- Native `async/await` — same paradigm as FastAPI.
- Typed job arguments and results.
- Built-in retry with exponential backoff.
- No broker protocol complexity (just Redis lists).

### Worker Settings

```python
# worker.py
class WorkerSettings:
    redis_settings = RedisSettings(host="redis", port=6379)
    functions = [score_pr_task, analyze_pr_task]
    max_jobs = 5              # concurrent jobs per worker process
    job_timeout = 300         # 5 minutes (LLM can be slow)
    max_tries = 3             # auto-retry on transient failure
    retry_delay = 30          # seconds between retries
```

### Task Definition Example

```python
# workers/prioritization.py
from arq import create_pool
from app.core.prioritization.service import score_pr
from app.database import AsyncSessionLocal

async def score_pr_task(ctx, pr_id: str, owner: str, repo: str, number: int):
    async with AsyncSessionLocal() as db:
        await score_pr(db, pr_id, owner, repo, number)
```

### Enqueue from API

```python
# api/webhooks.py
@router.post("/webhooks/github")
async def github_webhook(request: Request, redis: Redis = Depends(get_redis_pool)):
    # ... verify signature ...
    await redis.enqueue_job(
        "score_pr_task",
        pr_id=f"{owner}/{repo}#{number}",
        owner=owner, repo=repo, number=number
    )
    return {"accepted": True}
```

---

## 8. Agentic Flow

### Scenario: Developer opens a PR

```
GitHub
  │ POST /webhooks/github
  ▼
┌─────────────────────────────────────┐
│  FastAPI (api/webhooks.py)          │
│  1. Verify HMAC signature           │
│  2. Upsert PR row (status=pending)  │
│  3. Enqueue score_pr_task to Redis  │
│  4. Return 202 Accepted ────────────┼──► GitHub
└─────────────────────────────────────┘
  │
  │ Redis queue
  ▼
┌─────────────────────────────────────┐
│  ARQ Worker                         │
│  1. Dequeue score_pr_task           │
│  2. Call core/prioritization/       │
│     service.score_pr()              │
│     a. github_client.fetch_diff()   │
│     b. Ask ai.orchestrator:         │
│        "Score this PR"              │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  core/ai/orchestrator.py            │
│  1. Select prioritization_agent     │
│  2. Pass PR context + diff          │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  agents/prioritization_agent.py     │
│  1. prompt_loader.load("score")     │
│  2. llm_client.call(prompt)         │
│  3. response_validator.validate()   │
│  4. Return ScoreResult              │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  service.score_pr()                 │
│  1. Write priority_scores           │
│  2. Update PR.status = scored       │
└─────────────────────────────────────┘
  │
  │ (User clicks "Analyze Impact")
  ▼
┌─────────────────────────────────────┐
│  FastAPI (api/prs.py or manual)     │
│  Enqueue analyze_pr_task ──────────►│──► Redis
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  ARQ Worker                         │
│  1. Dequeue analyze_pr_task         │
│  2. Call core/blast_radius/         │
│     service.analyze_pr()            │
│     a. code_parser.parse_diff()     │
│     b. impact_graph.calculate()     │
│     c. Ask ai.orchestrator:         │
│        "Assess impact"              │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  core/ai/orchestrator.py            │
│  1. Select blast_radius_agent       │
│  2. Pass parsed diff + graph        │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  agents/blast_radius_agent.py       │
│  1. Build impact narrative prompt   │
│  2. llm_client.call()               │
│  3. Validate + return ImpactResult  │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  service.analyze_pr()               │
│  1. Write blast_reports             │
│  2. Update PR.status = analyzed     │
└─────────────────────────────────────┘
  │
  │ (Frontend polls)
  ▼
┌─────────────────────────────────────┐
│  React Dashboard                    │
│  GET /api/prs/active                │
│  GET /api/prs/overview              │
│  Renders scores + impact side-by-side
└─────────────────────────────────────┘
```

### Sprint Forecast Agent (Dashboard Context)

```
Frontend
  │ GET /api/sprint/health
  ▼
┌─────────────────────────────────────┐
│  api/dashboard.py                   │
│  Calls dashboard.service.get_health │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  dashboard/service.py               │
│  1. Query aggregate PR data         │
│  2. Ask ai.orchestrator:            │
│     "Forecast sprint health"        │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  orchestrator.py                    │
│  Select sprint_forecast_agent       │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│  agents/sprint_forecast_agent.py    │
│  1. Load velocity + risk prompts    │
│  2. Call LLM for narrative forecast │
│  3. Return SprintHealthResult       │
└─────────────────────────────────────┘
```

---

## 9. Docker Architecture

### `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc     && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /app/data

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `frontend/Dockerfile`

```dockerfile
# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `docker-compose.yml`

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped

  api:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - sqlite_data:/app/data
    depends_on:
      - redis
    restart: unless-stopped

  worker:
    build: ./backend
    command: arq app.worker.WorkerSettings
    env_file: .env
    volumes:
      - sqlite_data:/app/data
    depends_on:
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  sqlite_data:
```

### `docker-compose.override.yml` (Dev)

```yaml
version: "3.8"

services:
  api:
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  worker:
    volumes:
      - ./backend:/app
    command: arq app.worker.WorkerSettings
    deploy:
      replicas: 1
```

---

## 10. SQLite + Workers: Mitigation Strategy

SQLite is single-writer. ARQ workers run in separate processes. This is the architecture's primary constraint.

### Mitigations Applied

| Technique | Where | Effect |
|-----------|-------|--------|
| **WAL mode** | `database.py` — `PRAGMA journal_mode=WAL` | Readers do not block writers. Writers do not block readers. |
| **Busy timeout** | `database.py` — `PRAGMA busy_timeout=5000` | Writer waits up to 5s instead of failing with "database is locked". |
| **NullPool for workers** | `database.py` — `poolclass=NullPool` in worker context | Each job opens a fresh connection. No stale pooled connections across processes. |
| **Low worker concurrency** | `WorkerSettings.max_jobs = 5` | Limits simultaneous writers. Scale horizontally (more worker containers) only if SQLite contention is acceptable. |
| **Claim Check pattern** | ARQ queue carries only `pr_id` | Queue is tiny. Heavy writes (diff cache, scores) happen in SQLite, not Redis. |
| **Idempotency** | Workers skip if `PR.status` already terminal | Duplicate or retried jobs do not re-write. |

### When to Migrate

If you observe `database is locked` errors under load, the path forward is:
1. Replace SQLite with PostgreSQL (`database.py` engine swap).
2. Increase `max_jobs` and worker replicas.
3. No changes needed in `core/`, `api/`, `ai/`, or `workers/`.

---

## 11. API Reference

### Webhooks

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `POST` | `/webhooks/github` | HMAC-SHA256 | GitHub `pull_request` event | `202 Accepted` |

### PRs

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/prs/active` | List of PRs with latest scores |
| `GET` | `/api/prs/{id}` | Full PR detail + scores + impact |

### Dashboard

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/api/sprint/health` | `{total_prs, scored, analyzed, health_score, forecast}` |
| `GET` | `/api/prs/overview` | Joined list: PR + priority score + blast radius |

### Blast Radius (Manual Trigger)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/blast-radius/analyze` | `{"pr_id": "..."}` | `202 Accepted` |
| `GET` | `/api/blast-radius/prs/{id}/impact` | — | Impact report |
| `GET` | `/api/blast-radius/prs/{id}/graph` | — | Nodes + edges |

---

## 12. Environment Variables

```bash
# GitHub
GITHUB_WEBHOOK_SECRET=whsec_...
GITHUB_TOKEN=ghp_...

# LLM
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

# Database
DATABASE_URL=sqlite:////app/data/agentic_team_lead.db

# Redis (ARQ)
REDIS_URL=redis://redis:6379

# App
PORT=8000
```

---

## 13. Failure Handling

| Risk | Symptom | Mitigation |
|------|---------|------------|
| Bad webhook secret | Events ignored | `github_client.verify_signature()` → 401. Log raw body for debugging. |
| LLM timeout / rate limit | PR stuck `pending` | ARQ `max_tries=3`, `retry_delay=30`. Worker marks `error` after exhaustion. |
| LLM schema drift | UI breaks / parse errors | `response_validator` validates with Pydantic. Rejects bad JSON → `error` status. |
| SQLite locked | `database is locked` | WAL + busy_timeout + low concurrency. Monitor logs; migrate to Postgres if persistent. |
| Worker crash mid-job | Job lost in Redis | ARQ retries on next worker start (unacked message). Idempotency prevents double-write. |
| Tunnel / network drop | No live webhook | `POST /webhooks/github` accepts manual replay. Fixtures in `tests/fixtures/` for local dev. |

---

## 14. Related Decisions

| Decision | Rationale |
|----------|-----------|
| **ARQ over Celery** | Asyncio-native, typed, minimal ops. No `kombu`/`billiard` complexity. |
| **SQLite kept** | Zero infra for demo. WAL mode makes it viable for low-concurrency workers. Migration path to Postgres is one engine swap. |
| **Modular monolith** | Clean boundaries without microservices overhead. Can extract to services later if needed. |
| **Redis only for queue** | Not used for caching or state. Keeps architecture simple. |
| **Claim Check** | ARQ messages carry `pr_id` only. Large payloads (diffs) live in SQLite. |
| **Agentic architecture** | `orchestrator` + specialized agents mirrors a real team lead structure. New agents (security, review, docs) can be added without touching existing services. |
