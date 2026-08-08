  # Database Schema

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
| `agent_type` | `prioritization`, `blast_radius`, `sprint_forecast` | `ai_runs.agent_type` |

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
| `id` | `TEXT` | **PK** | Composite: `owner/repo#number` |
| `repo_id` | `INTEGER` | **FK -> repositories** | Parent repository |
| `github_pr_id` | `BIGINT` | **UQ** | Stable GitHub PR ID |
| `repo` | `TEXT` | `NOT NULL` | Repository full name |
| `number` | `INTEGER` | `NOT NULL` | PR number |
| `title` | `TEXT` | | PR title |
| `author` | `TEXT` | | GitHub username |
| `branch` | `TEXT` | | Source branch |
| `diff_text` | `TEXT` | | Cached raw diff blob (MVP) |
| `status` | `pr_status` | `DEFAULT 'pending'` | Pipeline state |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | First seen |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated by trigger |

**Indexes:** `status`, `repo`, `created_at DESC`, `repo_id`

**Module Rule:** Read by all modules. Written only by webhook ingestion.

---

### `priority_scores` — Prioritization Module

LLM scoring output from the prioritization agent. One row per PR (1:1 with `prs`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `pr_id` | `TEXT` | **PK**, **FK -> prs** CASCADE | Parent PR |
| `overall_score` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Aggregate score |
| `readability` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Readability dimension |
| `security` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Security dimension |
| `performance` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Performance dimension |
| `architecture` | `INTEGER` | `NOT NULL`, `CHECK 0-100` | Architecture dimension |
| `reasoning` | `JSONB` | | Per-dimension LLM narrative |
| `rank` | `INTEGER` | | Relative rank across open PRs |
| `model_name` | `TEXT` | | LLM model used (e.g., `gpt-4o-mini`) |
| `prompt_version` | `TEXT` | | Prompt template version |
| `input_tokens` | `INTEGER` | | Tokens sent to LLM |
| `output_tokens` | `INTEGER` | | Tokens received from LLM |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When scored |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated |

**Indexes:** `overall_score DESC`, `rank`

**Module Rule:** Written only by `core/prioritization/`. Never imports from `core/blast_radius/`.

---

### `blast_reports` — Blast Radius Module

Impact analysis output from the blast radius agent. One row per PR (1:1 with `prs`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `pr_id` | `TEXT` | **PK**, **FK -> prs** CASCADE | Parent PR |
| `files_changed` | `INTEGER` | `DEFAULT 0` | Total files modified |
| `lines_added` | `INTEGER` | `DEFAULT 0` | Insertions |
| `lines_removed` | `INTEGER` | `DEFAULT 0` | Deletions |
| `modules_touched` | `JSONB` | | Affected module names |
| `entry_points` | `JSONB` | | Entry-point files |
| `downstream_files` | `JSONB` | | Potentially impacted files |
| `impact_score` | `INTEGER` | `CHECK 0-100` | Computed severity |
| `risk_level` | `risk_level` | | `low` to `critical` |
| `model_name` | `TEXT` | | LLM model used |
| `prompt_version` | `TEXT` | | Prompt template version |
| `input_tokens` | `INTEGER` | | Tokens sent |
| `output_tokens` | `INTEGER` | | Tokens received |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When analyzed |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated |

**Indexes:** `impact_score DESC`, `risk_level`

**Module Rule:** Written only by `core/blast_radius/`. Never imports from `core/prioritization/`.

---

### `pr_files` — Blast Radius File Breakdown

Normalized file-level diff records. 1:N child of `prs`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Surrogate key |
| `pr_id` | `TEXT` | **FK -> prs** CASCADE | Parent PR |
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
| `risk_distribution` | `JSONB` | | `{"low": 5, "high": 1}` |
| `model_name` | `TEXT` | | LLM model used |
| `prompt_version` | `TEXT` | | Prompt template version |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Snapshot time |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT now()` | Auto-updated |

**Indexes:** `sprint_name`, `created_at DESC`

---

### `sprint_prs` — Sprint to PR Junction

Links sprints to the PRs that contributed to the forecast.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `sprint_id` | `INTEGER` | **FK -> sprint_forecasts** CASCADE | Parent sprint |
| `pr_id` | `TEXT` | **FK -> prs** CASCADE | Member PR |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When linked |

**PK:** `(sprint_id, pr_id)`

---

### `ai_runs` — AI Execution History

Tracks every AI agent invocation for debugging, cost analysis, and reproducibility.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Run ID |
| `pr_id` | `TEXT` | **FK -> prs** SET NULL | Related PR (nullable for sprint forecasts) |
| `agent_type` | `agent_type` | `NOT NULL` | `prioritization` / `blast_radius` / `sprint_forecast` |
| `model_name` | `TEXT` | `NOT NULL` | LLM model (e.g., `gpt-4o-mini`) |
| `prompt_version` | `TEXT` | | Prompt template version |
| `temperature` | `NUMERIC(3,2)` | | Sampling temperature |
| `input_tokens` | `INTEGER` | | Tokens sent |
| `output_tokens` | `INTEGER` | | Tokens received |
| `latency_ms` | `INTEGER` | | Response time in milliseconds |
| `result_json` | `JSONB` | | Structured output (score, impact, etc.) |
| `error_message` | `TEXT` | | Failure reason if applicable |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When run |

**Indexes:** `pr_id`, `agent_type`, `created_at DESC`, `model_name`

---

### `job_logs` — Background Task Observability

Lightweight tracking for FastAPI BackgroundTasks. Replaces ARQ monitoring.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PK** | Log entry ID |
| `pr_id` | `TEXT` | **FK -> prs** SET NULL | Nullable — retains audit if PR deleted |
| `job_type` | `job_type` | `NOT NULL` | `score_pr` / `analyze_pr` / `forecast_sprint` |
| `status` | `job_status` | `DEFAULT 'pending'` | Execution state |
| `error_message` | `TEXT` | | Failure reason |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now()` | When queued |
| `started_at` | `TIMESTAMPTZ` | | When began |
| `completed_at` | `TIMESTAMPTZ` | | When finished |

**Indexes:** `pr_id`, `status`, `created_at DESC`

---

## Views

### `v_pr_overview`

The **only sanctioned cross-module join point**.

| Rule | Enforcement |
|------|-------------|
| Who queries it | `api/dashboard.py` only |
| Who does not | Domain services in `core/` |

Joins `prs` + `priority_scores` + `blast_reports` for dashboard consumption.

---

## Triggers

### `trg_prs_updated_at`

Auto-updates `prs.updated_at` on every `UPDATE`.

Applied to: `prs`, `priority_scores`, `blast_reports`, `sprint_forecasts`.

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
      |
      +-- 1:1 -- blast_reports         [Blast Radius module]
      |
      +-- 1:N -- pr_files              [Blast Radius file breakdown]
      |
      +-- 1:N -- job_logs              [Task observability]
      |
      +-- 1:N -- ai_runs               [AI execution history]
      |
      +-- N:M -- sprint_prs -- sprint_forecasts   [Sprint membership]

v_pr_overview (view)                  [Dashboard-only cross-module join]
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
