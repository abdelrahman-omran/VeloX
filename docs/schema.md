# Database Schema

> **Stack:** PostgreSQL · FastAPI BackgroundTasks · Modular Monolith  
> **Generated:** 2026-08-08

---

## Table of Contents

1. [Enums](#enums)
2. [Tables](#tables)
   - [`repositories`](#repositories)
   - [`prs`](#prs--shared-kernel)
   - [`priority_scores`](#priority_scores--prioritization-module)
   - [`blast_reports`](#blast_reports--blast-radius-module)
   - [`pr_files`](#pr_files--blast-radius-file-breakdown)
   - [`sprint_forecasts`](#sprint_forecasts--sprint-forecast-module)
   - [`sprint_prs`](#sprint_prs--sprint-to-pr-junction)
   - [`ai_runs`](#ai_runs--ai-execution-history)
   - [`agent_configs`](#agent_configs--user-configurable-ai-settings)
   - [`job_logs`](#job_logs--background-task-observability)
3. [Views](#views)
4. [Triggers](#triggers)
5. [Row-Level Security](#row-level-security)
6. [Relationship Summary](#relationship-summary)
7. [Module Boundary Rules](#module-boundary-rules)

---

## Enums

Custom PostgreSQL enums enforce valid values at the database level.

| Enum | Values | Used By |
|------|--------|---------|
| `pr_status` | `pending`, `scored`, `analyzed`, `error` | `prs.status` |
| `risk_level` | `low`, `medium`, `high`, `critical` | `blast_reports.risk_level` |
| `job_type` | `score_pr`, `analyze_pr`, `forecast_sprint` | `job_logs.job_type` |
| `job_status` | `pending`, `running`, `success`, `failed`, `cancelled` | `job_logs.status` |
| `file_change_type` | `added`, `modified`, `removed` | `pr_files.change_type` |
| `agent_type` | `prioritization`, `blast_radius`, `sprint_forecast` | `ai_runs.agent_type`, `agent_configs.agent_type` |

---

## Tables

### `repositories`

GitHub repository registry. Tracks installation context for the GitHub App.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Internal ID |
| `github_repo_id` | `BIGINT` | **UQ** | Stable GitHub repository ID |
| `owner` | `TEXT` | `NOT NULL` | Repo owner (org or user) |
| `name` | `TEXT` | `NOT NULL` | Repo name |
| `full_name` | `TEXT` | `NOT NULL`, **UQ** | `owner/name` |
| `installation_id` | `BIGINT` | | GitHub App installation ID |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | First seen |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Last updated |

**Indexes:** `github_repo_id`, `full_name`

---

### `prs` — Shared Kernel

Central registry for every pull request ingested via GitHub webhook.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Internal surrogate key |
| `repo_id` | `INTEGER` | **FK -> repositories** | Parent repository |
| `github_pr_id` | `BIGINT` | `NOT NULL`, **UQ** | Stable GitHub PR ID |
| `repo` | `TEXT` | `NOT NULL` | Repository full name |
| `number` | `INTEGER` | `NOT NULL` | PR number |
| `title` | `TEXT` | | PR title |
| `author` | `TEXT` | | GitHub username |
| `branch` | `TEXT` | | Source branch |
| `diff_text` | `TEXT` | | Cached raw diff blob (MVP) |
| `status` | `pr_status` | `DEFAULT 'pending'` | Pipeline state |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | First seen |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated by trigger |

**Indexes:** `status`, `repo`, `created_at DESC`, `repo_id`, `github_pr_id`

**Module Rule:** Read by all modules. Written only by webhook ingestion.

---

### `priority_scores` — Prioritization Module

LLM scoring output from the prioritization agent. One row per PR (1:1 with `prs`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `pr_id` | `INTEGER` | **PK**, **FK -> prs** CASCADE | Parent PR |
| `overall_score` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Aggregate score |
| `readability` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Readability dimension |
| `security` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Security dimension |
| `performance` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Performance dimension |
| `architecture` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Architecture dimension |
| `reasoning` | `JSONB` | | Per-dimension LLM narrative |
| `rank` | `INTEGER` | | Relative rank across open PRs |
| `ai_run_id` | `INTEGER` | **FK -> ai_runs** SET NULL | Links to the AI execution that produced this score |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When scored |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated |

**JSONB Structure — `reasoning`:**
```json
{
  "readability": "string explaining the readability assessment",
  "security": "string explaining security concerns or confidence",
  "performance": "string explaining performance impact analysis",
  "architecture": "string explaining architectural fit or debt",
  "overall": "string summarizing the aggregate scoring rationale"
}
```

**Indexes:** `overall_score DESC`, `rank`, `ai_run_id`

**Module Rule:** Written only by `core/prioritization/`. Never imports from `core/blast_radius/`.

---

### `blast_reports` — Blast Radius Module

Impact analysis output from the blast radius agent. One row per PR (1:1 with `prs`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `pr_id` | `INTEGER` | **PK**, **FK -> prs** CASCADE | Parent PR |
| `files_changed` | `INTEGER` | `DEFAULT 0` | Total files modified |
| `lines_added` | `INTEGER` | `DEFAULT 0` | Insertions |
| `lines_removed` | `INTEGER` | `DEFAULT 0` | Deletions |
| `modules_touched` | `JSONB` | | Affected module names |
| `entry_points` | `JSONB` | | Entry-point files |
| `downstream_files` | `JSONB` | | Potentially impacted files |
| `impact_score` | `INTEGER` | `CHECK 0-100` | Computed severity |
| `risk_level` | `risk_level` | | `low` to `critical` |
| `ai_run_id` | `INTEGER` | **FK -> ai_runs** SET NULL | Links to the AI execution that produced this report |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When analyzed |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated |

**JSONB Structures:**

**`modules_touched`** — array of module identifiers extracted from changed files:
```json
["core.prioritization", "api.webhooks", "common.schemas"]
```

**`entry_points`** — array of files that serve as application entry points:
```json
["src/main.py", "backend/app/main.py"]
```

**`downstream_files`** — array of files potentially impacted by the change (computed via import graph):
```json
["src/consumer.py", "tests/test_auth.py", "docs/api.md"]
```

**Indexes:** `impact_score DESC`, `risk_level`, `ai_run_id`

**Module Rule:** Written only by `core/blast_radius/`. Never imports from `core/prioritization/`.

---

### `pr_files` — Blast Radius File Breakdown

Normalized file-level diff records. 1:N child of `prs`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Surrogate key |
| `pr_id` | `INTEGER` | **FK -> prs** CASCADE | Parent PR |
| `file_path` | `TEXT` | `NOT NULL`, **UQ** with `pr_id` | Full file path |
| `change_type` | `file_change_type` | `NOT NULL` | `added` / `modified` / `removed` |
| `lines_added` | `INTEGER` | `DEFAULT 0` | Per-file insertions |
| `lines_removed` | `INTEGER` | `DEFAULT 0` | Per-file deletions |
| `module_name` | `TEXT` | | Extracted module boundary |

**Indexes:** `pr_id`, `module_name`

---

### `sprint_forecasts` — Sprint Forecast Module

Aggregate health snapshots. Linked to PRs via `sprint_prs`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Surrogate key |
| `sprint_name` | `TEXT` | `NOT NULL` | Sprint identifier |
| `total_prs` | `INTEGER` | `DEFAULT 0` | PRs in scope |
| `scored_count` | `INTEGER` | `DEFAULT 0` | Scored PR count |
| `analyzed_count` | `INTEGER` | `DEFAULT 0` | Analyzed PR count |
| `health_score` | `INTEGER` | `CHECK 0-100` | Sprint health prediction |
| `forecast` | `TEXT` | | LLM narrative |
| `risk_distribution` | `JSONB` | | Risk breakdown by level |
| `ai_run_id` | `INTEGER` | **FK -> ai_runs** SET NULL | Links to the AI execution that produced this forecast |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Snapshot time |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated |

**JSONB Structure — `risk_distribution`:**
```json
{
  "low": 5,
  "medium": 2,
  "high": 1,
  "critical": 0
}
```

**Indexes:** `sprint_name`, `created_at DESC`, `ai_run_id`

---

### `sprint_prs` — Sprint to PR Junction

Links sprints to the PRs that contributed to the forecast.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sprint_id` | `INTEGER` | **FK -> sprint_forecasts** CASCADE | Parent sprint |
| `pr_id` | `INTEGER` | **FK -> prs** CASCADE | Member PR |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When linked |

**PK:** `(sprint_id, pr_id)`

---

### `ai_runs` — AI Execution History

Single source of truth for all AI agent invocations. Tracks model, prompt, tokens, latency, and structured output for debugging, cost analysis, and reproducibility.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Run ID |
| `pr_id` | `INTEGER` | **FK -> prs** SET NULL | Related PR (nullable for sprint forecasts) |
| `agent_type` | `agent_type` | `NOT NULL` | `prioritization` / `blast_radius` / `sprint_forecast` |
| `agent_config_id` | `INTEGER` | **FK -> agent_configs** SET NULL | Which user-configured settings were used |
| `model_name` | `TEXT` | `NOT NULL` | LLM model (e.g., `gpt-4o-mini`) |
| `prompt_version` | `TEXT` | | Prompt template version |
| `temperature` | `NUMERIC(3,2)` | | Sampling temperature |
| `input_tokens` | `INTEGER` | | Tokens sent to LLM |
| `output_tokens` | `INTEGER` | | Tokens received from LLM |
| `latency_ms` | `INTEGER` | | Response time in milliseconds |
| `result_json` | `JSONB` | | Structured output from the agent |
| `error_message` | `TEXT` | | Failure reason if applicable |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When run |

**JSONB Structure — `result_json` by agent type:**

**Prioritization agent:**
```json
{
  "overall_score": 85,
  "readability": 90,
  "security": 70,
  "performance": 80,
  "architecture": 88,
  "rank": 3
}
```

**Blast radius agent:**
```json
{
  "impact_score": 75,
  "risk_level": "high",
  "files_changed": 12,
  "modules_touched": ["core.auth", "api.webhooks"],
  "entry_points": ["src/main.py"],
  "downstream_files": ["tests/test_auth.py"]
}
```

**Sprint forecast agent:**
```json
{
  "health_score": 82,
  "risk_distribution": {"low": 5, "medium": 2, "high": 1, "critical": 0},
  "total_prs": 15,
  "scored_count": 12,
  "analyzed_count": 8
}
```

**Indexes:** `pr_id`, `agent_type`, `created_at DESC`, `model_name`, `agent_config_id`

---

### `agent_configs` — User-Configurable AI Settings

Stores per-repository or global AI agent configuration. Users specify model, prompt version, temperature, and other parameters here. Every `ai_runs` record references the config used, enabling reproducibility and A/B testing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Config ID |
| `repository_id` | `INTEGER` | **FK -> repositories** CASCADE | Scope to a repo; `NULL` means global default |
| `agent_type` | `agent_type` | `NOT NULL` | Which agent this config applies to |
| `model_name` | `TEXT` | `NOT NULL` | LLM model (e.g., `gpt-4o-mini`, `claude-3-sonnet`) |
| `prompt_version` | `TEXT` | | Prompt template version/tag |
| `temperature` | `NUMERIC(3,2)` | `DEFAULT 0.70` | Sampling temperature (0.00 – 2.00) |
| `max_tokens` | `INTEGER` | | Max output tokens |
| `system_prompt` | `TEXT` | | Custom system prompt override |
| `is_default` | `BOOLEAN` | `DEFAULT false` | Whether this is the fallback when no repo-specific config exists |
| `enabled` | `BOOLEAN` | `DEFAULT true` | Whether this config is active |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When created |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When last modified |

**Indexes:** `repository_id`, `agent_type`, `is_default`, `(repository_id, agent_type)`

**Resolution logic (application layer):**
```
1. Look for config where repository_id = {repo} AND agent_type = {agent} AND enabled = true
2. If not found, look for config where repository_id IS NULL AND agent_type = {agent} AND is_default = true
3. If not found, use hardcoded fallback
```

---

### `job_logs` — Background Task Observability

Lightweight tracking for FastAPI BackgroundTasks. Handles idempotency, deduplication, retry state, and correlation to AI executions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Log entry ID |
| `idempotency_key` | `TEXT` | **UQ** | Dedupe key: `{job_type}:{entity_type}:{entity_id}` (e.g., `score_pr:pr:42`) |
| `correlation_id` | `TEXT` | | Same value across all retries of the same logical job |
| `job_type` | `job_type` | `NOT NULL` | `score_pr` / `analyze_pr` / `forecast_sprint` |
| `entity_type` | `TEXT` | | Target entity class: `pr`, `sprint` |
| `entity_id` | `TEXT` | | Target entity identifier |
| `status` | `job_status` | `DEFAULT 'pending'` | Execution state |
| `attempt_count` | `INTEGER` | `DEFAULT 0` | How many times this job has been attempted |
| `max_attempts` | `INTEGER` | `DEFAULT 3` | Retry ceiling |
| `error_message` | `TEXT` | | Failure reason from last attempt |
| `ai_run_id` | `INTEGER` | **FK -> ai_runs** SET NULL | Links to the AI execution attempt |
| `worker_id` | `TEXT` | | Process or container identifier (e.g., hostname + PID) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When first queued |
| `started_at` | `TIMESTAMPTZ` | | When current attempt began |
| `completed_at` | `TIMESTAMPTZ` | | When current attempt finished |

**Indexes:**
- `idempotency_key` — prevents duplicate enqueue
- `correlation_id` — traces a logical job across retries
- `status, attempt_count` — finds jobs eligible for retry
- `status, started_at` — detects stuck `running` jobs
- `entity_type, entity_id` — history for a specific PR or sprint
- `worker_id` — debug which process handled a job
- `created_at DESC` — activity feed

**Usage patterns:**

```
-- Prevent duplicate enqueue
INSERT INTO job_logs (idempotency_key, job_type, entity_type, entity_id, status)
VALUES ('score_pr:pr:42', 'score_pr', 'pr', '42', 'pending')
ON CONFLICT (idempotency_key) DO NOTHING;

-- Find stuck jobs (running longer than expected)
SELECT * FROM job_logs
WHERE status = 'running'
  AND started_at < now() - interval '5 minutes';

-- Find failed jobs eligible for retry
SELECT * FROM job_logs
WHERE status = 'failed'
  AND attempt_count < max_attempts;

-- Trace all attempts of one logical job
SELECT * FROM job_logs
WHERE correlation_id = 'abc-123-def'
ORDER BY created_at;
```

---

## Views

### `v_pr_overview`

The **only sanctioned cross-module join point**.

| Rule | Enforcement |
|------|-------------|
| Who queries it | `api/dashboard.py` only |
| Who does not | Domain services in `core/` |

Joins `prs` + `priority_scores` + `blast_reports` + `ai_runs` (via `ai_run_id`) for dashboard consumption.

---

## Triggers

### `trg_prs_updated_at`

Auto-updates `updated_at` on every `UPDATE`.

Applied to: `prs`, `priority_scores`, `blast_reports`, `sprint_forecasts`, `agent_configs`.

---

## Row-Level Security

Enabled on `prs`, `priority_scores`, and `blast_reports` with permissive defaults (`USING (true)`).

Replace with tenant-scoped filters when adding multi-tenancy.

---

## Relationship Summary

```
repositories
      |
      | 1:N
      ▼
     prs
      |
      +-- 1:1 -- priority_scores       [Prioritization module]
      |         |
      |         +-- FK ai_run_id ------► ai_runs
      |
      +-- 1:1 -- blast_reports         [Blast Radius module]
      |         |
      |         +-- FK ai_run_id ------► ai_runs
      |
      +-- 1:N -- pr_files              [Blast Radius file breakdown]
      |
      +-- 1:N -- job_logs              [Task observability]
      |         |
      |         +-- FK ai_run_id ------► ai_runs
      |
      +-- 1:N -- ai_runs               [AI execution history]
      |         |
      |         +-- FK agent_config_id ► agent_configs
      |
      +-- N:M -- sprint_prs -- sprint_forecasts   [Sprint membership]
                    |
                    +-- FK ai_run_id --► ai_runs

agent_configs                       [User-configurable AI settings]
      |
      | 1:N
      ▼
   ai_runs

v_pr_overview (view)                [Dashboard-only cross-module join]
```

---

## Module Boundary Rules

| # | Rule |
|---|------|
| 1 | `core/prioritization/` **never** imports from `core/blast_radius/` and vice versa |
| 2 | Both modules **read** `common/models.PR` but **write only to their own** tables |
| 3 | `core/ai/orchestrator.py` is the **only** cross-domain coordinator |
| 4 | Agents **never** import from services — they receive pure data and return structured results |
| 5 | `api/dashboard.py` is the **only** join point allowed to query both module tables |
| 6 | `api/` never calls `core/` directly for writes — always through `BackgroundTasks` |
