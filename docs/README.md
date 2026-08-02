# Planning docs

Ultra-lean hackathon kit. Read these before writing code. Skim order: **PRD → Demo → Architecture → API contracts**.

## Index

| # | Doc | Purpose |
| --- | --- | --- |
| — | [`_shared/product.yml`](_shared/product.yml) | Single source of truth: pitch, audience, scope, defaults |
| 1 | [`01-prd.md`](01-prd.md) | One-pager product agreement |
| 2 | [`02-demo-use-case.md`](02-demo-use-case.md) | 3-minute pitch script (feature gate) |
| 3 | [`03-architecture.md`](03-architecture.md) | Data flow, stack tradeoffs, failure points |
| 4 | [`04-api-contracts/`](04-api-contracts/) | REST endpoints + JSON Schemas + examples |

## How to edit (modular model)

```text
_shared/product.yml  →  01-prd / 02-demo / 03-architecture  (product facts)
04-api-contracts/schemas/*.schema.json  →  examples + API README  (wire shapes)
```

1. **Change pitch, audience, or scope** → edit [`_shared/product.yml`](_shared/product.yml) first, then adjust only the prose that must diverge.
2. **Change API / LLM JSON shapes** → edit the schema under [`04-api-contracts/schemas/`](04-api-contracts/schemas/), update the matching file in `examples/`, leave markdown pointing at those paths.
3. **Pick a backend stack** → fill the decision slot in [`03-architecture.md`](03-architecture.md). Contracts stay stack-agnostic.

## Defaults (locked for V1)

| Concern | Choice |
| --- | --- |
| LLM | OpenAI-compatible API (`LLM_API_KEY`, `LLM_BASE_URL`) |
| Storage | SQLite (Postgres later) |
| Frontend | TypeScript / React |
| Backend | TBD — Go vs Node/TS vs Python (see architecture) |

## Rule

If a feature is not required by the [demo script](02-demo-use-case.md), do not build it in the hackathon.
