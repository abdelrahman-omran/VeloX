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
| 4 | [`04-api-contracts/`](04-api-contracts/) | REST endpoints + JSON Schemas + examples |
| 5 | [`05-brand.md`](05-brand.md) | Identity, colors, typography, logo, dashboard theme |
| 6 | [`06-competitors.md`](06-competitors.md) | Gap thesis, matrix, objections, Demo/Pitch/V2 focus |

## How to edit (modular model)

```text
_shared/exploration.yml  →  00-exploration.md  (possible users / use cases)
_shared/product.yml      →  01-prd / 02-demo / 03-architecture  (committed V1 facts)
06-competitors.md        →  positioning language in PRD / demo (does not expand scope)
04-api-contracts/schemas/*.schema.json  →  examples + API README  (wire shapes)
05-brand.md + brand/*    →  Glass UI tokens & logo (visual system)
```

1. **Explore audiences or jobs-to-be-done** → edit [`_shared/exploration.yml`](_shared/exploration.yml); keep [`00-exploration.md`](00-exploration.md) in sync for tables/narrative.
2. **Change pitch, audience, or scope** → edit [`_shared/product.yml`](_shared/product.yml) first, then adjust only the prose that must diverge.
3. **Change competitive positioning** → edit [`06-competitors.md`](06-competitors.md) and `positioning` / `out_scope` in product.yml; keep the [demo script](02-demo-use-case.md) as the feature gate.
4. **Change API / LLM JSON shapes** → edit the schema under [`04-api-contracts/schemas/`](04-api-contracts/schemas/), update the matching file in `examples/`, leave markdown pointing at those paths.
5. **Pick a backend stack** → fill the decision slot in [`03-architecture.md`](03-architecture.md). Contracts stay stack-agnostic.
6. **Change brand / theme / logo** → edit [`05-brand.md`](05-brand.md) and files under [`brand/`](brand/).

## Defaults (locked for V1)

| Concern | Choice |
| --- | --- |
| Product name | Mergent |
| LLM | OpenAI-compatible API (`LLM_API_KEY`, `LLM_BASE_URL`) |
| Storage | SQLite (Postgres later) |
| Frontend | TypeScript / React |
| Backend | TBD — Go vs Node/TS vs Python (see architecture) |
| Visual system | Dark-mode Mergent tokens ([`05-brand.md`](05-brand.md)) |

## Rule

If a feature is not required by the [demo script](02-demo-use-case.md), do not build it in the hackathon.
