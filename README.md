# AEOS – Autonomous Enterprise Operating System

> AI-powered modular business operating system for companies.

## Architecture

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | Next.js + Tailwind  |
| Backend   | FastAPI (Python)    |
| Database  | PostgreSQL 16       |
| Cache     | Redis 7             |
| Workers   | Celery              |
| Auth      | JWT (access+refresh)|
| AI        | Claude API          |
| Infra     | Docker Compose      |

## Quick Start

### Prerequisites

- Docker & Docker Compose v2+
- Git

### 1. Clone & configure

```bash
git clone <repo-url> aeos && cd aeos
cp .env.example .env
# Edit .env with your values (defaults work for local dev)
```

### 2. Start everything

```bash
docker compose up --build
```

### 3. Access

| Service       | URL                            |
|---------------|--------------------------------|
| Frontend      | http://localhost:3000           |
| Backend API   | http://localhost:8000           |
| API Docs      | http://localhost:8000/docs      |
| ReDoc         | http://localhost:8000/redoc     |

### 4. Verify

```bash
# Backend health
curl http://localhost:8000/api/health

# DB connectivity
curl http://localhost:8000/api/health/db

# Redis connectivity
curl http://localhost:8000/api/health/redis
```

## Project Structure

```
aeos/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py
│       ├── core/           # Config, DB, Redis, Celery
│       ├── auth/           # Phase 2
│       ├── workspaces/     # Phase 2-3
│       ├── rbac/           # Phase 3
│       ├── departments/    # Phase 3
│       ├── subscriptions/  # Phase 4
│       ├── tokens/         # Phase 4
│       ├── integrations/   # Phase 6
│       ├── modules/        # marketing, hr, finance, ops, exec
│       ├── engines/        # Intelligence engines
│       ├── ai/             # AI Gateway, prompts, context
│       ├── graph/          # Business Graph
│       ├── reports/        # Report generation
│       └── api/routers/    # HTTP route handlers
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    └── src/
        ├── app/            # Next.js App Router pages
        ├── components/     # Shared UI components
        ├── lib/            # API client, utils
        └── styles/         # Global styles
```

## Development Phases

- **Phase 1** ✅ Project foundation
- **Phase 2** Authentication & Setup Wizard
- **Phase 3** Core SaaS (workspaces, RBAC, Business Graph)
- **Phase 4** Billing & token system
- **Phase 5–18** Modules, engines, AI, reports
- **Phase 19** Production deployment

## License

Proprietary – All rights reserved.
