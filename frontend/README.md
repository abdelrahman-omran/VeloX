# VeloX Glass (frontend)

Marketing landing + React triage dashboard for Team Leads — risk-sorted PR queue, AI summary, blast radius, recommended reviewers, and mocked sprint confidence.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (VeloX tokens)
- Zod (API response validation)
- TanStack Query (polling)
- React Router

## Develop

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 — landing at `/`, Glass at `/app`.

### Env

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_USE_FIXTURES` | `true` | Use demo fixtures instead of Engine |
| `VITE_API_PROXY_TARGET` | `http://127.0.0.1:8000` | Vite `/api` proxy when fixtures are off |

Set `VITE_USE_FIXTURES=false` once the FastAPI Engine serves `GET /api/prs/active` and `GET /api/sprint/health`.

## Scripts

- `npm run dev` — local app with HMR
- `npm run build` — production bundle
- `npm run preview` — serve the build
- `npm run lint` — oxlint

## Layout

Routes (see [`docs/07-frontend-pages.md`](../docs/07-frontend-pages.md)):

| Path | Page |
| --- | --- |
| `/` | Marketing landing |
| `/login` · `/signup` | Mock auth → `/app` |
| `/app` | Triage inbox |
| `/connect` | Link project |
| `/projects` | Manage projects |
| `/prs/:id` | Deep-linked PR |

Glass chrome: Top navbar (Logo · Sprint confidence · Repo switcher) → left priority queue → center PR intelligence.
