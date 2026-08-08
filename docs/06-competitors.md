# Competitor Analysis & Positioning

> **Product:** Mergent ([`_shared/product.yml`](_shared/product.yml))  
> **Feature gate:** [`02-demo-use-case.md`](02-demo-use-case.md) — positioning does not expand V1 scope.  
> Labels: **Demo now** = stage-provable · **Pitch carefully** = say it, don’t oversell · **V2 later** = roadmap only.

---

## 1. Positioning one-liner

**Mergent sits in the gap between AI PR reviewers and engineering-management platforms:** it connects *micro* code-level diffs and blast radius to *macro* Team Lead delivery triage — without spamming inline nits or shipping passive DORA charts.

Canonical gap (SoT): `positioning.gap` in [`product.yml`](_shared/product.yml).

```text
┌────────────────────────────────────────────────────────┐
│  Category A: AI PR Reviewers                           │
│  (CodeRabbit, Qodo, Greptile)                          │
│  • Focus: Micro (line-by-line code quality)            │
│  • Output: PR comments, nitpicks, syntax bugs          │
│  • Missing: Sprint deadlines / system impact           │
└───────────────────────────┬────────────────────────────┘
                            │
                        THE GAP:
           "How does this change affect
             our delivery date & system?"
                            │
┌───────────────────────────▼────────────────────────────┐
│  Category B: Engineering Management Platforms          │
│  (LinearB, Jellyfish, Swarmia)                         │
│  • Focus: Macro (DORA, burndown, cycle time)           │
│  • Output: Passive charts, retrospective metrics       │
│  • Missing: Understanding of actual code diffs         │
└────────────────────────────────────────────────────────┘

                    ★ Mergent ★
         Micro risk + blast → Team Lead triage
```

---

## 2. Competitive landscape

### Category A — AI PR reviewers & automated developers

#### CodeRabbit

| | |
| --- | --- |
| **What** | Automated AI code reviews on GitHub PRs; summarizes diffs; inline suggestions |
| **Strengths** | Adoption, GitHub UX, line-by-line feedback |
| **Weaknesses** | Noise fatigue; no delivery awareness; siloed per PR |
| **Pitch angle** | They win *developer LOC*. We win *managerial triage*. |

#### Qodo (ex-Codium / PR-Agent) & Greptile

| | |
| --- | --- |
| **What** | Context-aware PR review agents; Greptile emphasizes codebase embeddings; Qodo leans tests |
| **Strengths** | Strong IC workflow; deeper repo context (esp. Greptile) |
| **Weaknesses** | Built for the IC, not Team Lead resource allocation |
| **Honesty** | Do **not** claim full-codebase embeddings in V1 |

### Category B — Engineering management & DORA

#### LinearB (and GitStream)

| | |
| --- | --- |
| **What** | Git + Jira → cycle time / DORA; GitStream = YAML workflow rules |
| **Strengths** | Industry metrics; Jira + GitHub integration |
| **Weaknesses** | Rule-based, not semantic; passive “cycle time is bad” without *which PR* or *why* |
| **Honesty** | V1 sprint confidence is **mocked** for the demo story — not a LinearB replacement |

#### Jellyfish / Swarmia / Faros.ai

| | |
| --- | --- |
| **What** | Exec-level engineering investment / headcount reporting |
| **Strengths** | CTO / VP reporting |
| **Weaknesses** | Expensive; far from Tuesday-morning PR triage |
| **Pitch angle** | Reinforces our buyer = Team Lead / EM, not portfolio finance |

### Category C — Code mapping & dependencies

#### AppMap / legacy CodeSee-class tools

| | |
| --- | --- |
| **What** | Visual dependency / service maps |
| **Strengths** | Architecture diagrams |
| **Weaknesses** | Setup cost; maps without agentic “who reviews / what’s the risk?” |
| **Pitch angle** | We ship **semantic blast + next action**, not a full architecture product |

---

## 3. Competitive matrix (honest V1)

| Feature / Metric | CodeRabbit / Qodo | LinearB / Jellyfish | AppMap | **Mergent (V1)** |
| --- | --- | --- | --- | --- |
| **Primary user** | Developer | VP / Executive | Architect | **Team Lead / Eng Manager** |
| **Line-by-line code review** | Excellent | None | None | **Out of scope** — high-level summary only |
| **Blast radius & service impact** | None | None | Visual map | **Paths + LLM services + narrative** |
| **Sprint health & delivery risk** | None | Historical / DORA | None | **Demo: live-looking confidence tied to PR story; not a real forecast model** |
| **Smart reviewer routing** | Basic blame | Hardcoded rules | None | **LLM recommendations from PR context** (workload-aware = V2) |
| **Noise level** | High (inline spam) | Low | Low | **Low — triage dashboard, not inline nitpicks** |

---

## 4. Four differentiators — Demo / Pitch / V2

| Differentiator | Demo now | Pitch carefully | V2 later |
| --- | --- | --- | --- |
| **1. Micro-to-Macro Impact Chain** | Risky PR → High Risk + blast chips → sprint confidence moves (mock) | “Connects the diff to delivery” | Real forecast drivers from history + load |
| **2. Context-aware reviewer matching** | Recommended reviewers visible + Assign CTA | “Domain-aware suggestion from PR context” | Ownership + **workload** balancing |
| **3. Morning Action Feed** | **Not a separate UI** — same intent via risk-sorted queue + CTA | Slides may call the queue a “morning triage inbox” | Dedicated action inbox (fast-track / split / descope) |
| **4. Blameless blast narrative** | AI summary + blast services (executive-readable prose) | “Why it matters,” not blame | Richer service graphs + test-gap evidence |

**Impact Chain example (spoken / fixture copy):**

> PR modifies `/auth/tokens.py` → touches 3 downstream services → risks the billing path → sprint confidence drops.

Use existing `ai_summary` + `blast_radius_services` fields — **no new API** required.

---

## 5. Judge objections (stage-ready)

### “How is this different from CodeRabbit or GitHub Copilot for PRs?”

> CodeRabbit operates at the *developer line-of-code* level — it tells you if a function looks wrong. Mergent operates at the *engineering management* level — how a change hits architecture, who should review to avoid bottlenecks, and whether it pressures the sprint. We don’t spam inline comments; we triage decisions.

### “LinearB already gives sprint metrics. Why build this?”

> LinearB is strong at *retrospective* metrics — it shows cycle time after the fact. Mergent is *code-aware*: it reads the diff and blast radius of incoming PRs so a Team Lead can act before the deadline. **In this hackathon**, sprint confidence is a demo signal wired to that story — not a full forecasting product.

---

## 6. Focus tips (3-week prototype)

### Build

1. Micro → blast → sprint-confidence **demo story** (see [demo script](02-demo-use-case.md)).
2. Low-noise Glass: risk-sorted PR queue + detail + Assign reviewer.
3. Blameless, high-level AI summary (not syntax nitpicks).

### Skip

1. Line-by-line / inline PR review (CodeRabbit already owns that).
2. Real DORA / cycle-time analytics platform (LinearB space).
3. Morning Action Feed as a second dashboard (V2; keep queue + CTA).
4. Workload-aware routing, full codebase embeddings, Jira sync (V2 / out of scope).

### Say in 3 minutes

1. Name the **gap** (micro reviewers vs macro metrics).
2. Show the **Impact Chain** live.
3. Close on a **decision** (assign reviewer) — not a chart.

Canonical lists: `positioning`, `in_scope`, `out_scope` in [`product.yml`](_shared/product.yml).

---

## 7. Related docs

| Doc | Role |
| --- | --- |
| [PRD](01-prd.md) | Problem / positioning agreement |
| [Demo use case](02-demo-use-case.md) | Beats + objection rehearsal |
| [Exploration](00-exploration.md) | V2 Action Feed / workload routing UCs |
| [Brand](05-brand.md) | V1 Glass = triage queue (Action Feed = V2 pattern) |
| [API contracts](04-api-contracts/) | Shapes for summary / blast / reviewers |
