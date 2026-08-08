# Demo-Driven Use Case

> Reverse-engineer development from this pitch.  
> **Feature gate:** if a feature is not required by this script, do not build it.

Product facts: [`_shared/product.yml`](_shared/product.yml) · Agreement: [`01-prd.md`](01-prd.md) · Positioning: [`06-competitors.md`](06-competitors.md)

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

- Team Lead opens the React dashboard (morning **triage inbox** metaphor — risk-sorted PR queue, not a separate Action Feed UI).
- Mock **Sprint Confidence** is already dropping (Predictive Delivery panel — mocked data).
- Active PR queue shows a few scored PRs; the room understands “delivery is at risk.”

**Spoken beat (suggested)**

> “Our sprint confidence is slipping, but status meetings are always late. Here’s the live engineering triage inbox — not another metrics chart.”

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

**Spoken beat (suggested) — Impact Chain spine**

> “Watch the chain: this diff touches auth tokens — micro. Blast radius hits three services. That pressure shows up on sprint confidence — macro. Risk score, blast radius, and why it matters — from the actual diff, not a spreadsheet.”

**Owning components**

| Layer | Responsibility |
| --- | --- |
| Brain (LLM) | Strict JSON per `llm-output` schema |
| Engine | Persist score; expose via `GET /api/prs/active` |
| Glass | Risk badge, summary, blast-radius chips; sprint panel may update (mock) |
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

## Judge objections (rehearse)

Full Q&A: [`06-competitors.md`](06-competitors.md). Short versions for stage:

### “Isn’t this CodeRabbit / Copilot?”

> They review *lines of code* for developers. We triage *engineering decisions* for Team Leads — blast radius, who should review, sprint pressure. No inline nitpick spam.

### “Isn’t this LinearB?”

> LinearB shows retrospective metrics after the fact. We are code-aware on the incoming PR. Sprint confidence here is a **demo signal** tied to that story — not a full forecasting product.

---

## Staging prep (day-of)

- [ ] Dummy repo with known “risky” file paths that map to demo services
- [ ] Webhook URL reachable from GitHub (tunnel or deployed URL)
- [ ] At least one warm LLM call completed (cold-start avoided on stage)
- [ ] Dashboard open on projector; fallback: recorded clip of webhook path if network fails
- [ ] Fixture responses available from [`04-api-contracts/examples/`](04-api-contracts/examples/) if live LLM flakes
- [ ] Objection answers rehearsed (CodeRabbit / LinearB)

---

## Related docs

- [Competitors](06-competitors.md) — gap, matrix, what to say vs skip  
- [Architecture](03-architecture.md) — data flow for each beat  
- [API contracts](04-api-contracts/) — shapes the Glass and Brain must honor  
