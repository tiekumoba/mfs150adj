# Awards Adjudication

Monorepo: `frontend/` (React + Vite + TypeScript + React Router + Clerk) and `backend/` (FastAPI + SQLAlchemy 2.x async + Alembic + Pydantic) on Neon PostgreSQL. Clerk handles all authentication. See `README.md` for setup.

## Rules

- Keep it simple. No features, services or infrastructure that haven't been requested.
- No Docker, Redis, background workers or custom auth.
- Keep dependencies to a minimum.
- Backend: type hints everywhere, SQLAlchemy 2.x style, Pydantic schemas separate from models, routers in `app/api/v1/` with logic in `app/services/`.
- Frontend: TypeScript, plain CSS, API calls go through `src/lib/api.ts` via the `useApi` hook.
- API design: read `RESTAPI.md` (Microsoft REST API guidelines) before writing or changing any endpoint, and follow it. Conventions we apply from it:
  - Plural-noun collection URIs (`/nominations`, `/nominations/{id}`), no verbs in paths, nesting no deeper than collection/item/collection, and don't mirror DB tables one to one.
  - Verbs and status codes: GET 200/404; POST 201 with a `Location` header (400 for a POST to an item URI); PUT full and idempotent; PATCH partial (merge-patch style); DELETE 204/404; 409 for state conflicts.
  - Collections take `limit` (default 25, capped) and `offset`, plus explicit filters and `sort` where needed.
  - Versioning is URI-based (`/api/v1`). Adding fields is non-breaking; renaming or removing one needs a new version.
  - Not adopted unless requested: HATEOAS links, XML, async 202 patterns, multitenancy.
- Tables are created only through Alembic, never at app startup.
- Never commit `.env` files. CORS origins are explicit, never `*`.
- Git: work on feature branches, never merge to main, don't push or commit unless asked, no Claude co-author lines.

## Commands

- Frontend (from `frontend/`): `npm install`, `npm run dev`, `npm run build` (typechecks too)
- Backend (from `backend/`, venv active): `uvicorn app.main:app --reload`
- Migrations (from `backend/`): `alembic upgrade head`, `alembic revision --autogenerate -m "msg"`

## Lessons learned

Add an entry whenever we hit something non-obvious. Keep each to a line or two: what happened and what to do instead.

- Neon's `postgresql://...?sslmode=require&channel_binding=...` URL breaks asyncpg. `Settings.sqlalchemy_database_url` in `app/core/config.py` converts it, so paste the URL from Neon unchanged.
- Neon suspends idle compute and drops connections, so the engine uses `pool_pre_ping=True`.
- `get_current_user_id` in `app/api/deps.py` is deliberately a sync `def`. Fetching the JWKS is blocking, so FastAPI runs it in a threadpool.
- Clerk session tokens have no `aud` claim by default, so audience verification is off and the issuer is checked instead.
- `fastapi.testclient` needs `httpx2` for tests. It's not in `requirements.txt` because there's no test suite yet.
- `CLERK_ISSUER` must match the token's `iss` exactly, with no trailing slash. A mismatch shows up as a 401 on `/api/v1/me`.
- New model modules must be imported in `app/models/__init__.py` or Alembic autogenerate won't see them.
