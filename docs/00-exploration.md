# Exploration — Users & Use Cases

> **Broad discovery doc.** Lists possible actors and jobs-to-be-done.  
> **Not a build commitment.** V1 stays gated by [`01-prd.md`](01-prd.md) and [`02-demo-use-case.md`](02-demo-use-case.md).  
> **Editable source:** [`_shared/exploration.yml`](_shared/exploration.yml) (personas + use cases).  
> **V1 primary audience** remains `target_audience` in [`_shared/product.yml`](_shared/product.yml).

| Field | Value |
| --- | --- |
| Status | Exploration |
| Purpose | Map who might benefit and what they could do — before narrowing scope |
| How to edit | Add/change rows in `exploration.yml`, then mirror here only if prose needs a narrative |

---

## How to use this doc

1. Brainstorm with the full lists below.
2. Promote only what the demo/PRD needs into [`product.yml`](_shared/product.yml) `in_scope`.
3. Keep everything else as `v2` / `future` horizon — resist scope creep.
4. Market / competitor framing (CodeRabbit vs LinearB gap) lives in [`06-competitors.md`](06-competitors.md); exploration only carries V2 UCs that fall out of that analysis.

```text
exploration.yml  →  this page (human view)
                 ↛  automatically expand hackathon scope
product.yml      →  what we actually commit to for V1
```

---

## Possible users (personas)

Canonical IDs and details: `personas` in [`exploration.yml`](_shared/exploration.yml).

| ID | Persona | Primary jobs | Core pains |
| --- | --- | --- | --- |
| `eng_manager` | Engineering Manager | Delivery visibility; capacity/risk with stakeholders | Stale meeting status; overload hard to see |
| `team_lead` | Team Lead | Daily PR/delivery triage; route reviews | Manual risk analysis; review bottlenecks |
| `tech_lead` | Tech Lead / Staff+ | Guard critical paths; high-impact reviews | Missed blast radius; low-signal review time |
| `developer` | Developer / IC | Ship safely; get timely reviews | Unclear reviewers; post-merge surprises |
| `scrum_master` | Scrum Master / Agile Facilitator | Protect sprint goal; evidence-based facilitation | Burndown ≠ engineering reality; late blockers |
| `product_manager` | Product Manager | Align roadmap with delivery; milestone risk | Eng↔business gap; late slip notice |
| `qa_engineer` | QA / SDET | Focus tests on risk; evidence for gates | Unclear deep-regression targets |
| `devops_platform` | DevOps / Platform | Healthy pipelines; actionable CI | Green CI ≠ safe change; weak failure↔impact link |
| `sre_oncall` | SRE / On-call | Reduce merge-born incidents; change context | Hard to find high-blast recent merges |
| `security_engineer` | Security / AppSec | Catch sensitive-path changes; prioritize review | Auth/secrets buried in the queue |
| `release_manager` | Release Manager | Go/no-go; hotfix/rollback readiness | Opaque high-risk work in the train |
| `engineering_director` | Director / Head of Eng | Portfolio health; systemic patterns | Stale or vanity metrics |
| `architect` | Software Architect | Boundaries & critical services | Live PRs not tied to service maps |

**Hackathon focus (V1):** `team_lead` and `eng_manager` as primary; others inform roadmap language only.

---

## Possible use cases

Canonical entries: `use_cases` in [`exploration.yml`](_shared/exploration.yml).  
**Horizon** is guidance only (`v1_demo` = serves the stage script; `v2` / `future` = later).

### V1 / demo-aligned

| ID | Use case | Actors | Trigger → outcome |
| --- | --- | --- | --- |
| `uc_triage_risky_prs` | Triage active PR queue by risk | Team Lead, EM, Tech Lead | New PR/CI → prioritized risk queue |
| `uc_blast_radius_before_merge` | Estimate blast radius before merge | Team Lead, Tech Lead, Architect, Dev, QA | Critical-path PR → services + extra-review hints |
| `uc_recommend_reviewers` | Recommend suitable reviewers | Team Lead, Dev, Tech Lead | Needs assignment → suggested reviewers |
| `uc_ai_pr_summary` | AI summary of intent and risk | Team Lead, Dev, EM, Security | Open/review PR → short summary |
| `uc_mock_sprint_confidence` | View mocked sprint confidence & blockers | Team Lead, SM, EM, PM | Daily check → confidence, burndown, blockers |
| `uc_github_risk_comment` | Post risk comment on GitHub | Team Lead, Dev | High-risk score → PR comment |

### V2 candidates

| ID | Use case | Actors | Trigger → outcome |
| --- | --- | --- | --- |
| `uc_developer_self_check` | Author self-checks risk before review ask | Developer | PR open/update → author-facing score & hints |
| `uc_focus_qa_on_hotspots` | Focus QA on high-risk / high-blast PRs | QA, Team Lead | Test planning → ordered deep-test list |
| `uc_security_sensitive_paths` | Flag security-sensitive path changes | Security, Tech Lead, Team Lead | Auth/secrets/PII touch → elevated routing |
| `uc_scrum_impediment_radar` | Engineering impediments for Scrum Master | SM, Team Lead | Mid-sprint → blocker feed from PR/CI |
| `uc_pm_milestone_risk` | Milestone language for stakeholders | PM, EM, Director | Planning/update → plain-language risk |
| `uc_jira_alignment` | Align tracker status with GitHub | PM, SM, EM | Status rituals → linked PR/issue drift alerts |
| `uc_workload_overload` | Detect overloaded reviewers/authors | EM, Team Lead, SM | Queue growth → load signals & rebalance |
| `uc_morning_action_feed` | Morning Action Feed (prescriptive triage) | Team Lead, EM | Start of day → ranked actions (V1 = queue + CTA) |
| `uc_workload_aware_routing` | Reviewers by ownership + workload | Team Lead, EM | Needs assignment → load-aware suggestion |

### Future / stretch

| ID | Use case | Actors | Trigger → outcome |
| --- | --- | --- | --- |
| `uc_real_delivery_forecast` | Real completion confidence model | EM, SM, PM, Release | Planning/go-no-go → forecast + drivers |
| `uc_tech_debt_radar` | Technical debt hotspot radar | Tech Lead, Architect, EM | Retro/quarterly → hotspot + follow-ups |
| `uc_release_go_nogo` | Release go/no-go risk inventory | Release, EM, SRE, QA | Cutoff → checklist from scored changes |
| `uc_incident_change_context` | High-blast changes during incident | SRE, Tech Lead, Platform | Page → candidate merge timeline |
| `uc_ci_noise_vs_risk` | Separate flaky CI from true risk | Platform, Team Lead, Dev | Red checks → annotated guidance |
| `uc_cross_team_portfolio` | Multi-team portfolio risk | Director, EM | Leadership review → shared risk language |
| `uc_architecture_boundary_guard` | Guard cross-cutting boundaries | Architect, Tech Lead | Cross-service PR → required reviewers |
| `uc_onboarding_review_norms` | Teach review norms via AI guidance | Developer, Tech Lead | Early PRs → explain-the-score coaching |
| `uc_custom_policy_rules` | Team policy rules in scoring | Team Lead, Architect, Security, Platform | Org rules → policy boosts & routing |

---

## Persona × use case matrix (summary)

Marks show **likely** interest, not implementation priority.

| Use case (short) | EM | Team Lead | Tech Lead | Dev | SM | PM | QA | Platform | SRE | Sec | Release | Director | Architect |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Triage by risk | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Blast radius | ○ | ● | ● | ● | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ● |
| Recommend reviewers | ○ | ● | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| AI PR summary | ● | ● | ○ | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ○ |
| Sprint confidence | ● | ● | ○ | ○ | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| GitHub risk comment | ○ | ● | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Author self-check | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| QA hotspots | ○ | ● | ○ | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ |
| Security paths | ○ | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ | ○ | ○ |
| SM impediments | ○ | ● | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| PM milestone risk | ● | ○ | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| Jira alignment | ● | ○ | ○ | ○ | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Overload detect | ● | ● | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Morning Action Feed | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Workload-aware route | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Real forecast | ● | ○ | ○ | ○ | ● | ● | ○ | ○ | ○ | ○ | ● | ○ | ○ |
| Tech debt radar | ● | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| Release go/no-go | ● | ○ | ○ | ○ | ○ | ○ | ● | ○ | ● | ○ | ● | ○ | ○ |
| Incident context | ○ | ○ | ● | ○ | ○ | ○ | ○ | ● | ● | ○ | ○ | ○ | ○ |
| CI noise vs risk | ○ | ● | ○ | ● | ○ | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ |
| Portfolio view | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● | ○ |
| Boundary guard | ○ | ○ | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| Onboarding norms | ○ | ○ | ● | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| Custom policies | ○ | ● | ● | ○ | ○ | ○ | ○ | ● | ○ | ● | ○ | ○ | ● |

● = primary actor or strong user · ○ = secondary / occasional

---

## Promotion checklist (when a use case graduates)

- [ ] Add or adjust `in_scope` / `out_scope` in [`product.yml`](_shared/product.yml)
- [ ] Ensure a beat exists (or explicitly expand) in [`02-demo-use-case.md`](02-demo-use-case.md) if it must ship for the hackathon
- [ ] Extend schemas/examples under [`04-api-contracts/`](04-api-contracts/) if new data is required
- [ ] Leave the exploration entry in place; set `horizon` appropriately in YAML

---

## Related docs

| Doc | Relationship |
| --- | --- |
| [PRD](01-prd.md) | Narrowed agreement — only promoted scope |
| [Competitors](06-competitors.md) | Market gap, antagonists, Demo/Pitch/V2 differentiators |
| [Demo use case](02-demo-use-case.md) | Feature gate for what we build now |
| [Architecture](03-architecture.md) | How V1 data flows; ignore future UCs until needed |
| [API contracts](04-api-contracts/) | Shapes for promoted V1 use cases |
