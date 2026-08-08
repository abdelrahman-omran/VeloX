# Frontend pages (Glass)

> Product demo gate remains [`02-demo-use-case.md`](02-demo-use-case.md).  
> Brand layout for triage: [`05-brand.md`](05-brand.md) §5.  
> Implementation: [`../frontend/`](../frontend/).

Page map for the React app. Keeps the hackathon **triage inbox** as the primary surface while documenting the small product shell around it.

---

## Routes

| Route | Page | Role |
| --- | --- | --- |
| `/` | Glass Triage | Risk-sorted PR queue + detail + sprint confidence (demo P0) |
| `/connect` | Link project | Paste `owner/repo`, webhook checklist; local project store |
| `/projects` | Projects | List / activate / remove linked repos |
| `/prs/:id` | PR deep link | Same Glass layout; preselects scored PR |
| `/?pr=` | Query deep link | Same as `/prs/:id` via search param |
| `*` | Not found | Minimal 404 → triage |

---

## Explicitly not routes (V2 / out of scope)

| Idea | Why deferred |
| --- | --- |
| `/inbox` Morning Action Feed | V2 ([06-competitors.md](06-competitors.md)); brand forbids rebuild for hackathon |
| `/login`, `/settings`, `/billing` | Multi-org SaaS auth kill-listed in PRD |
| Marketing landing | Pitch deck / brand kit — not an app surface |
| Full-screen blast graph | Keep tree inside PR detail |

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

## Flow

```text
Cold start (no active project)
  → / empty queue + “Link a project”
  → /connect Save project
  → / triage (fixtures filtered to active repo)
```

Navbar repo switcher reads the same store; **Manage projects** → `/projects`.
