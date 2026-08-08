# Planning docs

Ultra-lean hackathon kit. Read these before writing code. Skim order: **Exploration (optional) → PRD → Competitors → Demo → Architecture → API contracts → Brand**.

## Index

| # | Doc | Purpose |
| --- | --- | --- |
| — | [`_shared/product.yml`](_shared/product.yml) | Single source of truth: pitch, audience, scope, defaults |
| — | [`_shared/exploration.yml`](_shared/exploration.yml) | Broader personas + use-case catalog (not V1 scope) |
| — | [`brand/`](brand/) | Design tokens, Tailwind extend, Logo SVG/TSX |
| 0 | [`00-exploration.md`](00-exploration.md) | All possible users and use cases (discovery) |
| 1 | [`01-prd.md`](01-prd.md) | One-pager product agreement |
| 2 | [`02-demo-use-case.md`](02-demo-use-case.md) | 3-minute pitch script (feature gate) |
| 3 | [`03-architecture.md`](03-architecture.md) | Data flow, stack tradeoffs, failure points |
| — | [`lld.md`](lld.md) | Low-level design: FastAPI modular monolith + BackgroundTasks |
| 4 | [`04-api-contracts/`](04-api-contracts/) | REST endpoints + JSON Schemas + examples |
| 5 | [`05-brand.md`](05-brand.md) | Identity, colors, typography, logo, dashboard theme |
| 6 | [`06-competitors.md`](06-competitors.md) | Gap thesis, matrix, objections, Demo/Pitch/V2 focus |
| 7 | [`07-frontend-pages.md`](07-frontend-pages.md) | Landing, mock auth, Glass routes (triage, link project) |

## How to edit (modular model)

```text
_shared/exploration.yml  →  00-exploration.md  (possible users / use cases)
_shared/product.yml      →  01-prd / 02-demo / 03-architecture  (committed V1 facts)
lld.md                   →  FastAPI module layout + BackgroundTasks (implementation detail)
06-competitors.md        →  positioning language in PRD / demo (does not expand scope)
04-api-contracts/schemas/*.schema.json  →  examples + API README  (wire shapes)
05-brand.md + brand/*    →  Glass UI tokens & logo (visual system)
07-frontend-pages.md     →  Glass route map (triage + product shell)
```

1. **Explore audiences or jobs-to-be-done** → edit [`_shared/exploration.yml`](_shared/exploration.yml); keep [`00-exploration.md`](00-exploration.md) in sync for tables/narrative.
2. **Change pitch, audience, or scope** → edit [`_shared/product.yml`](_shared/product.yml) first, then adjust only the prose that must diverge.
3. **Change API / LLM JSON shapes** → edit the schema under [`04-api-contracts/schemas/`](04-api-contracts/schemas/), update the matching file in `examples/`, leave markdown pointing at those paths.
4. **Change backend layout / job model** → edit [`lld.md`](lld.md); keep [`03-architecture.md`](03-architecture.md) as the high-level map.
5. **Pick a backend stack** → fill the decision slot in [`03-architecture.md`](03-architecture.md). Contracts stay stack-agnostic. Default lean: FastAPI + BackgroundTasks.
6. **Change competitive positioning** → edit [`06-competitors.md`](06-competitors.md) and `positioning` / `out_scope` in product.yml; keep the [demo script](02-demo-use-case.md) as the feature gate.
7. **Change API / LLM JSON shapes** → edit the schema under [`04-api-contracts/schemas/`](04-api-contracts/schemas/), update the matching file in `examples/`, leave markdown pointing at those paths.
8. **Pick a backend stack** → fill the decision slot in [`03-architecture.md`](03-architecture.md). Contracts stay stack-agnostic.
9. **Change brand / theme / logo** → edit [`05-brand.md`](05-brand.md) and files under [`brand/`](brand/).
10. **Change Glass routes / product shell pages** → edit [`07-frontend-pages.md`](07-frontend-pages.md) and `frontend/src/pages/`.

## Defaults (locked for V1)

| Concern | Choice |
| --- | --- |
| Product name | VeloX |
| LLM | OpenAI-compatible API (`LLM_API_KEY`, `LLM_BASE_URL`) |
| Storage | SQLite (Postgres later) |
| Frontend | TypeScript / React |
| Backend | Python (FastAPI) lean — see [`lld.md`](lld.md); BackgroundTasks, no Redis worker |
| Visual system | Dark-mode VeloX tokens ([`05-brand.md`](05-brand.md)) |

## Rule

If a feature is not required by the [demo script](02-demo-use-case.md), do not build it in the hackathon.
