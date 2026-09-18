# Awards Adjudication System

Internal system for nominating, assigning, evaluating and scoring award nominations.

| Concern | Choice |
| --- | --- |
| Frontend | React + TypeScript + Vite, Tailwind CSS v4, shadcn/ui-style components — Vercel |
| Backend | Express 5 + TypeScript — Render Web Service |
| Database | Neon PostgreSQL (plain SQL migrations) |
| Auth | Clerk (scaffolded only — not wired up yet) |
| Later | WordPress file storage, Brevo email, Render Cron Jobs, Turnstile |

## Structure

```
frontend/   React app (Vercel)
backend/    HTTP API (Render) — routes → controllers → services → db
  db/migrations/   SQL schema
shared/     Types/constants used by both (roles, statuses, API shapes)
docs/       Architecture and deployment notes
```

npm workspaces monorepo. `shared` compiles to `shared/dist` (done automatically by `npm install`).

## Local development

Requires Node 22+.

```bash
npm install

# Backend  → http://localhost:4000
cp backend/.env.example backend/.env      # then edit DATABASE_URL (optional to boot)
npm run dev:backend

# Frontend → http://localhost:5173  (second terminal)
cp frontend/.env.example frontend/.env.local
npm run dev:frontend

# Database (needs DATABASE_URL in backend/.env)
npm run db:migrate
```

Check the API: `curl localhost:4000/health`

Routes: `/`, `/login`, `/admin`, `/adjudicator`, `/adjudicator/evaluations/a-1001`

If you edit `shared/src`, run `npm run build -w shared` (the `typecheck`/`build` scripts do this for you).

## Checks

```bash
npm run typecheck && npm run lint && npm run build   # or: npm run check
```

## Environment variables

Backend (`backend/.env`):

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | no | `development` (default) / `production` |
| `PORT` | no | default `4000` (Render sets this) |
| `CORS_ORIGINS` | no | comma-separated allowed origins; default `http://localhost:5173` |
| `DATABASE_URL` | production | Neon connection string (`?sslmode=require`) |
| `CLERK_SECRET_KEY` | later | unused for now |

Frontend (`frontend/.env.local`, `VITE_` values are public — never put secrets here):

| Variable | Notes |
| --- | --- |
| `VITE_API_URL` | backend base URL, default `http://localhost:4000` |
| `VITE_CLERK_PUBLISHABLE_KEY` | later |

See [docs/architecture.md](docs/architecture.md) for schema, auth plan and deployment settings.
