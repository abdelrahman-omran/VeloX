# One-Pager PRD

> **Source of truth for lists:** [`_shared/product.yml`](_shared/product.yml).  
> Update YAML first when scope or pitch changes; keep this page as the human-readable agreement.

| Field | Value |
| --- | --- |
| Product | Mergent |
| Horizon | 3-week hackathon (demo-first) |
| Status | Draft — pre-code |

---

## Elevator Pitch

Mergent is an AI decision-support agent that turns fragmented GitHub and CI/CD activity into real-time delivery visibility for Team Leads. It scores pull-request risk, estimates blast radius, and surfaces mocked sprint-health signals so leaders act before deadlines slip.

*(Canonical text: `elevator_pitch` in [`product.yml`](_shared/product.yml).)*

---

## Target Audience

Engineering Team Leads and Managers overseeing ~5–15 developers who are bottlenecked by manual PR triage, stale status meetings, and disconnected engineering vs. planning tools.

*(Canonical text: `target_audience` in [`product.yml`](_shared/product.yml).)*

---

## Positioning

Mergent sits in **the gap** between two saturated silos:

1. **AI PR reviewers** (CodeRabbit-class) — micro, line-by-line, IC-facing; no sprint/system impact.
2. **Eng management / DORA platforms** (LinearB-class) — macro, retrospective charts; no understanding of the actual diff.

We bridge **code-level risk + blast radius** with **Team Lead delivery triage** — low-noise decisions, not inline nitpicks or exec dashboards.

*(Canonical: `positioning` in [`product.yml`](_shared/product.yml). Full matrix & objections: [`06-competitors.md`](06-competitors.md).)*

---

## Problem (why this exists)

Modern teams generate engineering signal in GitHub, CI/CD, and trackers, but that data stays fragmented across those two silos. Team Leads lack real-time delivery visibility, struggle to spot high-impact PRs, discover delivery risk late, and operate with a gap between engineering progress and business planning. The result: review bottlenecks, slow decisions, and reactive planning.

---

## Solution (demo-sized)

Three modules, truncated to what the stage demo needs:

| Module | V1 behavior |
| --- | --- |
| **PR Intelligence** | Analyze PR / commits / CI context → risk score, AI summary, recommended reviewers |
| **Blast Radius** | Relate changed paths to services → highlight critical impact before merge |
| **Predictive Delivery** | **Mock** sprint confidence, burndown, and blockers in the dashboard (no real forecasting model) |

Integrations for V1: GitHub webhooks only. Jira and deeper PM sync are V2.

---

## Success Metrics

A hackathon win means all of the following:

- Working GitHub webhook that ingests PR events from a demo repo on stage
- LLM returns valid scored JSON for at least 5 dummy PRs without schema failures
- React dashboard shows live PR risk queue plus mocked sprint confidence
- End-to-end demo path (open risky PR → high-risk badge → recommended reviewer) completes in under 3 minutes

*(Canonical list: `success_metrics` in [`product.yml`](_shared/product.yml).)*

---

## In Scope (Must Haves)

Canonical list: `in_scope` in [`product.yml`](_shared/product.yml). Summary:

- GitHub webhook ingestion (+ signature verification)
- LLM strict-JSON risk scoring (OpenAI-compatible API)
- Blast-radius service hints (paths + LLM)
- React dashboard: PR queue, risk badges, summary, recommended reviewers
- Mocked sprint health panel
- SQLite persistence of PR metadata and AI scores

---

## Out of Scope (Kill List)

Canonical list: `out_scope` in [`product.yml`](_shared/product.yml). Summary:

- Custom ML models
- Jira / PM-tool integration
- Real predictive analytics (mock UI only)
- Line-by-line / inline PR nitpick review (CodeRabbit space)
- Real DORA / cycle-time analytics platform (LinearB space)
- Multi-org SaaS auth, billing, heavy RBAC
- Production HA / multi-region / formal compliance

---

## Non-goals & Assumptions

- Documentation and contracts beat speculative features; reverse-engineer from the [demo script](02-demo-use-case.md).
- One dummy GitHub repo and fixture PRs are enough for judging.
- Backend stack (Go / TypeScript / Python) is chosen before Day 1 coding — see [architecture](03-architecture.md).
- Frontend may mock API responses from [`04-api-contracts/examples/`](04-api-contracts/examples/) on Day 1.

---

## Related docs

| Doc | Role |
| --- | --- |
| [Exploration](00-exploration.md) | Broader users/use cases (do not treat as V1 scope) |
| [Competitors](06-competitors.md) | Gap thesis, matrix, objections, Demo/Pitch/V2 tips |
| [Demo use case](02-demo-use-case.md) | Feature gate for every build decision |
| [Architecture](03-architecture.md) | Boxes, arrows, stack TBD |
| [API contracts](04-api-contracts/) | JSON shapes between LLM, backend, and UI |
