# Awards Adjudication

React + Vite frontend, FastAPI backend, Neon PostgreSQL, Clerk authentication.

This is the foundation only: sign-in, a protected dashboard placeholder, a protected `/api/v1/me` endpoint and migration tooling. No awards features yet.

## 1. Project structure

```
frontend/            React + Vite + TypeScript
  src/
    components/      Shared components (ProtectedRoute)
    layouts/         AppLayout (header + outlet)
    pages/           SignIn, Dashboard, NotFound
    hooks/           useApi (API client bound to the Clerk token)
    lib/             api.ts (fetch wrapper + error handling)
    routes/          Route table
backend/             FastAPI
  app/
    main.py          App, CORS, error handler
    api/             deps.py (auth dependency) and v1/ routers
    core/            Settings from environment variables
    db/              SQLAlchemy base + async session
    models/          SQLAlchemy models (none yet)
    schemas/         Pydantic schemas
    services/        Business logic (Clerk JWT verification)
  alembic/           Migrations
```

## 2. Requirements

- Node.js 20+ and npm
- Python 3.10+
- A [Neon](https://neon.tech) project
- A [Clerk](https://clerk.com) application

## 3. Environment variables

Copy each `.env.example` to `.env` (`.env` files are git-ignored).

| File | Variable | Purpose |
| --- | --- | --- |
| `frontend/.env` | `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| | `VITE_API_URL` | Backend base URL, e.g. `http://localhost:8000` |
| `backend/.env` | `DATABASE_URL` | Neon connection string |
| | `CLERK_JWKS_URL` | Clerk JWKS endpoint |
| | `CLERK_ISSUER` | Clerk Frontend API URL (token `iss` claim) |
| | `CORS_ORIGINS` | Comma-separated allowed origins, e.g. `http://localhost:5173` |

## 4. Local frontend setup

```bash
cd frontend
cp .env.example .env   # then fill in values
npm install
npm run dev            # http://localhost:5173
```

## 5. Local backend setup

```bash
cd backend
cp .env.example .env   # then fill in values
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000
```

Interactive API docs: http://localhost:8000/docs

## 6. Neon database setup

1. Create a project in the Neon console.
2. Click **Connect** and copy the connection string.
3. Put it in `backend/.env` as `DATABASE_URL`. The standard `postgresql://...?sslmode=require` form works; the app converts it for the async driver.

## 7. Clerk setup

1. Create an application in the Clerk dashboard and enable your sign-in methods.
2. **API keys** → copy the publishable key into `VITE_CLERK_PUBLISHABLE_KEY`.
3. **API keys → Show API URLs** (or Domains) → find your Frontend API URL, e.g. `https://your-app.clerk.accounts.dev`.
   - `CLERK_ISSUER` = that URL, with no trailing slash.
   - `CLERK_JWKS_URL` = that URL + `/.well-known/jwks.json`.

## 8. Running migrations

From `backend/` with the venv active:

```bash
alembic upgrade head                            # apply migrations
alembic revision --autogenerate -m "message"    # create one after adding models
```

Tables are only ever created through Alembic, never at app startup. Import new model modules in `app/models/__init__.py` so autogenerate can see them.

## 9. Running the tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

Tests use a locally generated signing key, so they need no Clerk or Neon credentials.

## 10. Running the application

1. Start the backend (section 5) and the frontend (section 4).
2. Check `curl http://localhost:8000/api/v1/health` returns `{"status":"ok"}`.
3. Open http://localhost:5173, sign in, and the dashboard shows the Clerk user ID returned by `GET /api/v1/me`.
