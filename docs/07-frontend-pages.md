# Frontend pages (Glass + marketing)

> Product demo gate remains [`02-demo-use-case.md`](02-demo-use-case.md).  
> Brand layout for triage: [`05-brand.md`](05-brand.md) §5.  
> Implementation: [`../frontend/`](../frontend/).

Page map for the React app: marketing entry at `/`, Glass product shell under `/app`.

---

## Routes

| Route | Page | Role |
| --- | --- | --- |
| `/` | Marketing landing | Brand hero, gap thesis, impact chain, CTAs |
| `/login` | Mock login | Placeholder auth → toast → `/app` |
| `/signup` | Mock signup | Placeholder auth → toast → `/app` |
| `/app` | Glass Triage | Risk-sorted PR queue + detail + sprint confidence (demo P0) |
| `/connect` | Link project | Paste `owner/repo`, webhook checklist; local project store |
| `/projects` | Projects | List / activate / remove linked repos |
| `/prs/:id` | PR deep link | Same Glass layout; preselects scored PR |
| `/?pr=` on `/app` | Query deep link | Use `/app?pr=` (or `/prs/:id`) |
| `*` | Not found | Links to home + Glass |

---

## Explicitly deferred (V2 / out of scope)

| Idea | Why deferred |
| --- | --- |
| `/inbox` Morning Action Feed | V2 ([06-competitors.md](06-competitors.md)) |
| Real auth / settings / billing | Multi-org SaaS auth kill-listed in PRD |
| Full-screen blast graph | Keep tree inside PR detail |

Auth on `/login` and `/signup` is **mocked** for the hackathon — no tokens, no account persistence.

---

## Client project store

Until Engine exposes project APIs, Glass persists:

```json
{
  "projects": [
    {
      "id": "uuid",
      "full_name": "owner/repo",
      "linked_at": "ISO-8601",
      "webhook_status": "unknown | pending | ok"
    }
  ],
  "activeProjectId": "uuid | null"
}
```

Storage key: `velox.projects.v1` (localStorage). Zod: `frontend/src/schemas/project.ts`.

Webhook secrets stay in Engine env — `/connect` only documents `POST /webhooks/github`.

---

## Flows

```text
Marketing
  → / Open Glass → /signup (mock) → /app triage
  → Skip to demo dashboard → /app

Cold start in Glass (no active project)
  → /app empty queue + “Link a project”
  → /connect Save project
  → /app triage (fixtures filtered to active repo)
```

Navbar repo switcher reads the same store; **Manage projects** → `/projects`.
