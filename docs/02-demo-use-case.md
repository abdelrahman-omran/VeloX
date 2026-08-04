# Demo-Driven Use Case

> Reverse-engineer development from this pitch.  
> **Feature gate:** if a feature is not required by this script, do not build it.

Product facts: [`_shared/product.yml`](_shared/product.yml) · Agreement: [`01-prd.md`](01-prd.md)

---

## Pitch constraints

| Constraint | Value |
| --- | --- |
| Duration | ~3 minutes on stage |
| Actor | Team Lead (presenter) + one risky PR opened live |
| Repo | Dummy GitHub repository prepared before the talk |
| Win condition | Judges see live risk scoring + clear next action (assign reviewer) |

---

## Script (exact path)

### Beat 1 — The Setup (~30s)

**What the audience sees**

- Team Lead opens the React dashboard.
- Mock **Sprint Confidence** is already dropping (Predictive Delivery panel — mocked data).
- Active PR queue shows a few scored PRs; the room understands “delivery is at risk.”

**Spoken beat (suggested)**

> “Our sprint confidence is slipping, but status meetings are always late. Here’s the live engineering signal.”

**Owning components**

| Layer | Responsibility |
| --- | --- |
| Glass (React) | Render sprint health from `GET /api/sprint/health` |
| Storage / API | Serve mocked sprint metrics (no real forecasting in V1) |

---

### Beat 2 — The Trigger (~30s)

**What the audience sees**

- Presenter (or co-presenter) opens a **risky PR** in the dummy GitHub repo (e.g. auth / schema / critical path change).
- GitHub fires a webhook to the backend.

**Spoken beat (suggested)**

> “A developer just opened a PR that touches authentication. Watch what happens without a status meeting.”

**Owning components**

| Layer | Responsibility |
| --- | --- |
| Event Source | GitHub `pull_request` webhook |
| Engine (backend) | Verify signature, normalize payload, enqueue scoring |

---

### Beat 3 — The Magic (~90s)

**What the audience sees**

- Dashboard updates without a refresh circus: new PR appears with a red **High Risk** badge.
- AI summary + **blast radius** services (e.g. `auth-service`, `database-schema`) are visible.
- Optionally: the agent posts a short comment on the GitHub PR with the same summary (nice-to-have if time; not a blocker if UI alone is crisp).

**Spoken beat (suggested)**

> “Risk score, blast radius, and why it matters — generated from the actual diff and CI context, not a spreadsheet.”

**Owning components**

| Layer | Responsibility |
| --- | --- |
| Brain (LLM) | Strict JSON per `llm-output` schema |
| Engine | Persist score; expose via `GET /api/prs/active` |
| Glass | Risk badge, summary, blast-radius chips |
| GitHub API (optional) | Leave PR comment |

---

### Beat 4 — The Resolution (~30s)

**What the audience sees**

- UI shows **recommended reviewers** (e.g. `backend-lead`).
- Team Lead assigns (or simulates assign) the PR to that reviewer — clear decision, closed loop.

**Spoken beat (suggested)**

> “We don’t guess who should review. We route to the person with the right history — and unblock the sprint.”

**Owning components**

| Layer | Responsibility |
| --- | --- |
| Glass | Show recommended reviewers; CTA / assign affordance |
| Engine | Persist recommendation fields from LLM output |

---

## Beat → build checklist

Use this as the only build backlog filter.

| Beat | Must ship | Explicitly skip if time-boxed |
| --- | --- | --- |
| Setup | Dashboard shell + mocked sprint health | Real forecasting, Jira sync |
| Trigger | Webhook + signature verify | Every GitHub event type |
| Magic | LLM JSON score + blast radius on UI | Perfect comment formatting, multi-model voting |
| Resolution | Recommended reviewers visible | Full GitHub assign API + permissions UX |

---

## Staging prep (day-of)

- [ ] Dummy repo with known “risky” file paths that map to demo services
- [ ] Webhook URL reachable from GitHub (tunnel or deployed URL)
- [ ] At least one warm LLM call completed (cold-start avoided on stage)
- [ ] Dashboard open on projector; fallback: recorded clip of webhook path if network fails
- [ ] Fixture responses available from [`04-api-contracts/examples/`](04-api-contracts/examples/) if live LLM flakes

---

## Related docs

- [Architecture](03-architecture.md) — data flow for each beat  
- [API contracts](04-api-contracts/) — shapes the Glass and Brain must honor  
