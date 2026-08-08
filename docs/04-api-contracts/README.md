# API & Data Contracts

> Define shapes before code. Frontend mocks from `examples/`; backend validates against `schemas/`.  
> Product scope: [`../_shared/product.yml`](../_shared/product.yml)

---

## How to edit

1. Change a field → update the matching file in [`schemas/`](schemas/).
2. Update the filled sample in [`examples/`](examples/).
3. Keep this README as the endpoint map only (avoid duplicating full JSON trees here).

---

## Contract A — LLM output

Force the model to return strict JSON. Validate every response against:

- Schema: [`schemas/llm-output.schema.json`](schemas/llm-output.schema.json)
- Example: [`examples/llm-output.example.json`](examples/llm-output.example.json)

| Field | Type | Notes |
| --- | --- | --- |
| `risk_score` | integer 1–10 | Higher = more risk |
| `blast_radius_services` | string[] | Logical services / areas |
| `ai_summary` | string | Short explanation for humans / GitHub comment |
| `recommended_reviewers` | string[] | Handles or role ids |

Reject (and optionally re-prompt once) if validation fails.

---

## Contract B — Engine → Glass (REST)

Base path: `/api`. JSON request/response. Errors use [`schemas/error.schema.json`](schemas/error.schema.json).

### `GET /api/prs/active`

Returns the scored PR queue for the dashboard.

| | |
| --- | --- |
| **200 body** | `{ "items": ScoredPR[] }` where each item matches [`scored-pr.schema.json`](schemas/scored-pr.schema.json) |
| **Example item** | [`examples/scored-pr.example.json`](examples/scored-pr.example.json) |

```json
{
  "items": [
    {
      "id": "acme-payments#42",
      "number": 42,
      "title": "Rotate auth token signing and migrate sessions table",
      "author": "dev-alice",
      "html_url": "https://github.com/example/acme-payments/pull/42",
      "status": "scored",
      "risk_score": 8,
      "risk_level": "high",
      "blast_radius_services": ["auth-service", "database-schema"],
      "ai_summary": "PR touches auth token refresh (micro) → blast radius includes auth-service and database-schema → elevates delivery risk for the current sprint (macro). Prefer a backend owner review before merge.",
      "recommended_reviewers": ["backend-lead"],
      "updated_at": "2026-08-02T12:00:00Z"
    }
  ]
}
```

Suggested UI mapping: `risk_score` ≥ 8 → **High Risk** badge (or use `risk_level` when present).

### `GET /api/sprint/health`

Returns **mocked** predictive delivery metrics for Beat 1 of the demo.

| | |
| --- | --- |
| **200 body** | Object matching [`sprint-health.schema.json`](schemas/sprint-health.schema.json) |
| **Example** | [`examples/sprint-health.example.json`](examples/sprint-health.example.json) |

V1 may hard-code or lightly derive these values; do not block the demo on a real forecast model.

---

## Error envelope

Non-2xx responses:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "LLM output failed schema validation."
  }
}
```

Schema: [`schemas/error.schema.json`](schemas/error.schema.json).

---

## Inbound (Engine only — not consumed by Glass)

| Endpoint | Purpose |
| --- | --- |
| `POST /webhooks/github` | GitHub webhook receiver (raw payload + signature). Not a Glass contract. |

Keep webhook verification and LLM orchestration behind the Engine; Glass never talks to GitHub or the LLM directly in V1.

---

## Day-1 frontend mock

Point the React app at static fixtures copied from `examples/` (or a tiny MSW/json-server stub) until the Engine is ready. Schemas are the source of truth if prose and JSON disagree.
