# Agentic Team Lead Assistant — Low-Level Design

> **Stack:** Python (FastAPI) · PostgreSQL · React  
> **Architecture:** Modular Monolith (single deployable, clean domain boundaries)  
> **Date:** 2026-08-08

---

## 1. Overview

Agentic Team Lead Assistant is a single-backend application that acts as an AI-powered team lead. It receives GitHub webhooks, analyzes PRs through specialized AI agents, and serves a React dashboard with prioritization, blast radius, and sprint forecasting.

**Key decisions:**
- **FastAPI BackgroundTasks** for post-webhook I/O work (GitHub HTTP + LLM HTTP) — same process as the API, no Redis, no second worker container.
- **PostgreSQL** for persistence — MVCC (Multi-Version Concurrency Control) + connection pooling for modest concurrent task load.
- **No Redis in V1** — durable queues (ARQ/Celery) only if multi-instance durability is required later.
- **Agentic architecture** — `orchestrator` coordinates specialized agents (`prioritization`, `blast_radius`, `sprint_forecast`).
- **Modular monolith** — domains are separate modules with zero cross-imports; **one deploy unit**.

---

## 2. Repository Layout

```
agentic-team-lead/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI factory, router mount, lifespan
│   │   ├── config.py                    # Pydantic Settings (env-only, no secrets baked)
│   │   ├── database.py                  # SQLAlchemy engine + session (PostgreSQL, MVCC)
│   │   ├── dependencies.py              # FastAPI Depends: DB, HTTP clients
│   │   │
│   │   ├── common/                      # Shared kernel (both modules may read, neither owns)
│   │   │   ├── __init__.py
│   │   │   ├── enums.py                 # PRStatus, JobStatus, RiskLevel
│   │   │   ├── schemas.py               # PRBase, PRMetadata shared DTOs
│   │   │   └── models.py                # SQLAlchemy: PR table (shared reference)
│   │   │
│   │   ├── api/                         # HTTP layer (thin controllers)
│   │   │   ├── __init__.py
│   │   │   ├── webhooks.py              # POST /webhooks/github → BackgroundTasks
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
│   │   └── workers/                     # In-process async callables for BackgroundTasks
│   │       ├── __init__.py
│   │       ├── retry.py                 # with_io_retry(max_tries, retry_delay)
│   │       ├── prioritization.py        # async score_pr_task(pr_id, owner, repo, number)
│   │       └── blast_radius.py          # async analyze_pr_task(pr_id)
│   │
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
├── docker-compose.yml                   # prod-like stack (API + Postgres + frontend; no Redis)
├── docker-compose.override.yml          # dev overrides (hot reload)
├── .dockerignore
└── .env.example
```

---

## 3. File Responsibilities

### Application Core

| File | Responsibility |
|------|----------------|
| `main.py` | FastAPI app factory. Mounts routers under `/api/*`. Creates PostgreSQL tables on startup. Optional app-level `asyncio.Semaphore` for concurrent LLM jobs. No Redis lifespan. |
| `config.py` | `Pydantic Settings` class. Reads `GITHUB_WEBHOOK_SECRET`, `LLM_API_KEY`, `DATABASE_URL`, `LLM_CONCURRENCY`, etc. from env. Fails fast on boot if required vars missing. |
| `database.py` | SQLAlchemy `create_engine` + `sessionmaker`. PostgreSQL with `pool_size=10, max_overflow=20`, `poolclass=AsyncAdaptedQueuePool`, isolation `READ_COMMITTED`. |
| `dependencies.py` | FastAPI `Depends()` providers: `get_db()` (Session), `get_http_client()` (httpx.AsyncClient singleton). |

### Common (Shared Kernel)

| File | Responsibility |
|------|----------------|
| `common/enums.py` | `PRStatus` (`pending`, `scored`, `analyzed`, `error`), `JobStatus`, `RiskLevel`. |
| `common/schemas.py` | Pydantic DTOs shared across modules: `PRBase`, `PRMetadata`. |
| `common/models.py` | SQLAlchemy `PR` table. **Read-only reference** for both modules. Stores raw metadata + cached diff. Neither module imports the other's schemas. |

### API Layer

| File | Responsibility |
|------|----------------|
| `api/webhooks.py` | `POST /webhooks/github`. Verifies HMAC signature, upserts `PR` row, schedules `score_pr_task` via `BackgroundTasks`, returns `202 Accepted`. |
| `api/prs.py` | `GET /api/prs/active` (list with scores), `GET /api/prs/{id}` (detail). |
| `api/dashboard.py` | `GET /api/sprint/health` (aggregated KPIs), `GET /api/prs/overview` (joined view of both modules). |

### Domain Services (Core)

| File | Responsibility |
|------|----------------|
| `core/prioritization/service.py` | `score_pr(db, pr_id, owner, repo, number)`. Orchestrates: fetch diff → delegate to `ai.orchestrator` → persist results. Thin wrapper around the agentic layer. |
| `core/prioritization/github_client.py` | `verify_signature(body, sig, secret)` (HMAC-SHA256). `fetch_diff(owner, repo, number, token)` via GitHub REST API. |
| `core/blast_radius/service.py` | `analyze_pr(db, pr_id)`. Reads cached diff → delegates to `ai.orchestrator` → writes `blast_reports`, updates `PR.status`. |
| `core/blast_radius/code_parser.py` | Preprocesses GitHub diff data into a structured format for the Blast Radius Agent. Initial implementation relies on LLM reasoning, with optional AST-based parsing planned for future iterations. |
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

### Workers (in-process BackgroundTasks)

| File | Responsibility |
|------|----------------|
| `workers/retry.py` | `with_io_retry(coro_factory, max_tries=3, retry_delay=30)` for GitHub/LLM timeouts. Marks `PR.status = error` after exhaustion. |
| `workers/prioritization.py` | `score_pr_task(pr_id, owner, repo, number)`. Opens a **new** DB session; wraps `core.prioritization.service.score_pr`. |
| `workers/blast_radius.py` | `analyze_pr_task(pr_id)`. Opens a **new** DB session; wraps `core.blast_radius.service.analyze_pr`. |

There is **no** separate `worker.py` process and **no** Redis queue.

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
| **Command** | Background task functions (`score_pr_task`, `analyze_pr_task`) scheduled via FastAPI `BackgroundTasks` | Encapsulates I/O-bound work so the request path stays fast (`202`) while scoring/analysis continues in-process. |
| **Data Access Layer** | SQLAlchemy session management through dependency injection | Provides a clear boundary between business logic and persistence. Database implementation details remain isolated from the core system. |
| **DTO / Schema** | Pydantic models in `schemas.py` and shared schemas | Defines strict data contracts for API communication, validation, serialization, and AI model outputs. |
| **Idempotent Consumer** | Task checks PR processing status before executing duplicate work | Protects against duplicate GitHub webhook deliveries and safe in-task retries. |
| **Claim Check** | Task args carry `pr_id` (and owner/repo/number) only | Heavy payloads (diffs, scores) live in PostgreSQL, not in the scheduled task arguments. |


## 5. Module Boundaries (Hard Rules)

```
┌─────────────────────────────────────────┐
│  api/webhooks.py                        │
│  api/prs.py                             │
│  api/dashboard.py                       │
└─────────────┬───────────────────────────┘
              │ BackgroundTasks / Depends()
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
           │  database.py (PostgreSQL)   │
           └─────────────────────────────┘
```

**Rules:**
1. `core/prioritization/` **never** imports from `core/blast_radius/` and vice versa.
2. Both modules **read** `common/models.PR` but **write only to their own** tables (`priority_scores`, `blast_reports`).
3. `core/ai/orchestrator.py` is the **only** cross-domain coordinator. Services do not call agents directly — they ask the orchestrator.
4. Agents **never** import from services. They receive pure data (diff text, parsed graphs) and return structured results.
5. `api/dashboard.py` is the **only** join point allowed to query both module tables in one SQL statement.
6. `api/` never runs long I/O writes inline — it schedules `workers/*` via `BackgroundTasks` (or uses `Depends` for read-only endpoints).

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

## 7. Background Task Architecture

### Why BackgroundTasks?

Jobs are **I/O-bound** (GitHub REST + OpenAI-compatible LLM). FastAPI `BackgroundTasks` runs after the response is sent, on the **same asyncio event loop** as the API.

- **One process / one container** — simpler hackathon deploy (no Redis, no `arq` worker).
- Native `async/await` — same paradigm as FastAPI and httpx.
- Enough durability for a demo: accept that **killing the API process loses in-flight jobs**.

Do **not** use BackgroundTasks for CPU-bound work. If multi-instance durable queues become required later, migrate to ARQ/Celery without changing `core/`.

### Concurrency cap

```python
# main.py (app state) or workers/retry.py
llm_semaphore = asyncio.Semaphore(5)  # max concurrent LLM/scoring jobs
```

Replaces a separate worker `max_jobs` setting. Tune via `LLM_CONCURRENCY` env if needed.

### Task definition example

```python
# workers/prioritization.py
from app.core.prioritization.service import score_pr
from app.database import AsyncSessionLocal
from app.workers.retry import with_io_retry

async def score_pr_task(pr_id: str, owner: str, repo: str, number: int):
    # New session — never reuse the request's Depends(get_db) session
    async with AsyncSessionLocal() as db:
        async with llm_semaphore:
            await with_io_retry(
                lambda: score_pr(db, pr_id, owner, repo, number),
                max_tries=3,
                retry_delay=30,
            )
```

### Schedule from API

```python
# api/webhooks.py
from fastapi import BackgroundTasks, Depends, Request
from fastapi.responses import JSONResponse

@router.post("/webhooks/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # ... verify signature, upsert PR (status=pending) ...
    background_tasks.add_task(
        score_pr_task,
        pr_id=f"{owner}/{repo}#{number}",
        owner=owner,
        repo=repo,
        number=number,
    )
    return JSONResponse({"accepted": True}, status_code=202)
```

### Rules

1. **New DB session inside the task** — the request session is closed after `202`.
2. **Pass IDs only** (Claim Check) — not full diffs in `add_task` args.
3. **In-task retry** via `workers/retry.py` (`max_tries=3`, `retry_delay=30`) for LLM/GitHub timeouts.
4. **Idempotency** on `PR.status` — skip if already `scored` / `analyzed` / terminal.
5. **Semaphore** caps concurrent LLM calls (default 5).

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
│  3. BackgroundTasks.add_task(       │
│       score_pr_task, pr_id, ...)    │
│  4. Return 202 Accepted ────────────┼──► GitHub
└─────────────────────────────────────┘
  │
  │ same process (after response)
  ▼
┌─────────────────────────────────────┐
│  workers/prioritization.py          │
│  1. Open new DB session             │
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
│  FastAPI (api/…/blast-radius)       │
│  BackgroundTasks.add_task(          │
│    analyze_pr_task, pr_id) → 202    │
└─────────────────────────────────────┘
  │
  │ same process
  ▼
┌─────────────────────────────────────┐
│  workers/blast_radius.py            │
│  1. Open new DB session             │
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

## 9. PostgreSQL + In-Process Tasks: Mitigation Strategy

Background tasks share the **same process and engine pool** as FastAPI. There is no multi-process worker fleet in V1.

### Mitigations Applied

| Technique | Where | Effect |
|-----------|-------|--------|
| **MVCC (Multi-Version Concurrency Control)** | `database.py` — isolation `READ_COMMITTED` | Readers do not block writers. Writers do not block readers. |
| **Shared async pool** | `database.py` — `AsyncAdaptedQueuePool` | Tasks and request handlers borrow from one pool; no cross-process leaks. |
| **LLM concurrency semaphore** | `main.py` / `workers/` — default 5 | Caps simultaneous GitHub+LLM jobs and DB writers. |
| **Claim Check pattern** | `add_task` args = `pr_id` (+ owner/repo/number) | Task args stay tiny. Diffs and scores live in PostgreSQL. |
| **Idempotency** | Tasks skip if `PR.status` already terminal | Duplicate webhooks / retries do not re-write blindly. |
| **New session per task** | `workers/*.py` | Avoids using a closed request session after `202`. |

### Known V1 limit

If the API process is killed mid-job, that job is **lost** (no Redis ack). Replay the webhook or re-trigger analyze. Acceptable for the hackathon demo.

### When to migrate to a durable queue

If you need multi-instance durability or survive process restarts:

1. Introduce ARQ/Celery + Redis (or equivalent).
2. Keep `workers/*.py` callables as the job bodies; only change how they are scheduled.
3. No changes needed in `core/` or agent modules.

---

## 10. API Reference

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

## 11. Environment Variables

```bash
# GitHub
GITHUB_WEBHOOK_SECRET=whsec_...
GITHUB_TOKEN=ghp_...

# LLM
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
LLM_CONCURRENCY=5

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/agentic_team_lead

# App
PORT=8000
```

No `REDIS_URL` in V1.

---

## 12. Failure Handling

| Risk | Symptom | Mitigation |
|------|---------|------------|
| Bad webhook secret | Events ignored | `github_client.verify_signature()` → 401. Log raw body for debugging. |
| LLM timeout / rate limit | PR stuck `pending` | `with_io_retry(max_tries=3, retry_delay=30)`. Task marks `error` after exhaustion. |
| LLM schema drift | UI breaks / parse errors | `response_validator` validates with Pydantic. Rejects bad JSON → `error` status. |
| Connection pool exhausted | `connection pool exhausted` | Connection pooling + MVCC + semaphore. Monitor logs; increase pool size or add PgBouncer if persistent. |
| API process killed mid-job | Job never finishes | Known V1 limit. Replay webhook / re-POST analyze. Idempotency prevents double-write on retry. |
| Tunnel / network drop | No live webhook | `POST /webhooks/github` accepts manual replay. Fixtures in `tests/fixtures/` for local dev. |

---

## 13. Related Decisions

| Decision | Rationale |
|----------|-----------|
| **BackgroundTasks over ARQ/Celery** | I/O-bound work only; one deploy unit; no Redis or second process for the hackathon. |
| **No Redis in V1** | Queue durability not required for demo. Add a durable broker only when multi-instance survival matters. |
| **PostgreSQL kept** | Shared persistence for PR metadata, diffs, and scores. MVCC + pool + semaphore handle in-process concurrency. |
| **Modular monolith** | Clean boundaries without microservices overhead. Can extract to services later if needed. |
| **Claim Check** | Task args carry `pr_id` only. Large payloads (diffs) live in PostgreSQL. |
| **Agentic architecture** | `orchestrator` + specialized agents mirrors a real team lead structure. New agents (security, review, docs) can be added without touching existing services. |
