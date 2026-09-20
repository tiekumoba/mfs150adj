# Awards Adjudication

React + Vite frontend, FastAPI backend, Neon PostgreSQL, Clerk authentication.

So far: the database schema, sign-in, role-based access control (admin and adjudicator dashboards) and migration tooling. The award workflow itself is not built yet.

## 1. Project structure

```
frontend/            React + Vite + TypeScript
  src/
    components/      ProtectedRoute, CurrentUserGate, RequireRole, AccessDenied
    layouts/         AppLayout (header, sidebar, outlet)
    pages/           SignIn, admin and adjudicator dashboards, AccessDenied, NotFound
    hooks/           useApi (API client bound to the Clerk token), current user, useApiData
    lib/             api.ts (fetch wrapper + error handling)
    routes/          Route table
backend/             FastAPI
  app/
    main.py          App, CORS, error handler
    api/             deps.py (authentication, role and pagination dependencies) and v1/ routers
    core/            Settings from environment variables
    db/              SQLAlchemy base + async session
    models/          SQLAlchemy models
    schemas/         Pydantic schemas
    services/        Business logic (Clerk JWT verification, user lookup and linking)
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
4. **Sessions → Customize session token** → add the claim below. It lets the backend link an invited person to their account the first time they sign in (Clerk's default token carries no email):

   ```json
   { "email": "{{user.primary_email_address}}" }
   ```

5. Restrict sign-ups to invited people, so a Clerk login can only ever belong to someone you have invited. The app also refuses any login that has no active account, but this keeps strangers out of Clerk itself.

### Who can use the app

A Clerk sign-in is not enough. The backend requires an **active** row in `app_users`, and the role decides the routes:

| | Any active user | `admin` | `adjudicator` |
| --- | --- | --- | --- |
| `GET /api/v1/me` | yes | yes | yes |
| `GET /api/v1/users` | | yes | no (403) |
| `GET /api/v1/me/assignments` | | no (403) | yes |

No row, an `invited` row that could not be linked, or a `deactivated` user all get 403. An `invited` user is linked (Clerk ID stored, status set to `active`) the first time they sign in with a token whose `email` claim matches.

**Create the first administrator** once, from `backend/` with the venv active (the Clerk user ID is in the Clerk dashboard under Users):

```bash
python -m app.db.create_admin --email you@example.org --name "Your Name" --clerk-user-id user_2abc...
```

Without `--clerk-user-id` the admin is created as `invited` and linked by email on first sign-in (needs step 4). Re-running is safe.

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

The access-control tests also need a real PostgreSQL, because the rules live in SQL. Create an empty local database whose name ends in `_test` and point `TEST_DATABASE_URL` at it; without it those tests are skipped:

```bash
createdb awards_test
TEST_DATABASE_URL=postgresql://localhost/awards_test pytest
```

The tests create tables in that database and delete its rows between tests. They refuse any database not named `*_test`. Never point this at Neon.

## 10. Running the application

1. Start the backend (section 5) and the frontend (section 4).
2. Check `curl http://localhost:8000/api/v1/health` returns `{"status":"ok"}`.
3. Open http://localhost:5173 and sign in. An admin lands on the admin dashboard, an adjudicator on the adjudicator dashboard, and anyone without an active account sees an access-denied page.
