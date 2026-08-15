# VeloX Backend

AI-powered PR analysis backend built with FastAPI, SQLAlchemy (async), and Gemini.

## Quick Start (Local)

### 1. Prerequisites

- Python 3.12+
- PostgreSQL 15+ running locally
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in `backend/`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/velox

# LLM (Gemini)
GEMINI_API_KEY=your-gemini-api-key

# GitHub (optional — for diff fetching)
GITHUB_TOKEN=your-github-pat
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

### 4. Create the database

```bash
psql -U user -d postgres -c "CREATE DATABASE velox;"
```

Tables are auto-created on startup by `init_db()`.

### 5. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### 6. Run tests

```bash
# Full test suite (mocked LLM, real database)
pytest tests/ -v

# Integration test with real Gemini API
RUN_INTEGRATION_TESTS=1 pytest tests/integration/ -v
```

---

## Docker

### Build

```bash
docker build -t velox-backend .
```

### Run

```bash
docker run -p 8000:8000 --env-file .env velox-backend
```

### Docker Compose

A `docker-compose.yml` is provided at the project root. It spins up both PostgreSQL and the API with a healthcheck dependency:

```bash
cd ..
docker-compose up --build
```

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/webhooks/github` | POST | GitHub PR webhook (HMAC verified) |
| `/api/prs/active` | GET | List active PRs with scores |
| `/api/prs/{id}` | GET | Get PR detail |
| `/api/prs/{id}/score` | POST | Queue PR scoring |
| `/api/sprint/health` | GET | Sprint health metrics |

---

## Project Structure

```
backend/
├── app/
│   ├── api/           # FastAPI routers
│   ├── common/        # Models & schemas
│   ├── config.py      # Settings
│   ├── core/          # AI agents & business logic
│   ├── database.py    # SQLAlchemy engine & session
│   ├── dependencies.py
│   └── main.py        # App factory
├── tests/
│   ├── conftest.py
│   ├── test_*.py      # Unit & integration tests
│   └── integration/
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## LLM Output Schema

The prioritization agent expects Gemini to return JSON conforming to:

```json
{
  "risk_score": 87,
  "readability": 90,
  "security": 85,
  "performance": 80,
  "architecture": 92,
  "reasoning": "..."
}
```

See `docs/04-api-contracts/schemas/priority-score-output.schema.json` for the formal JSON Schema.
