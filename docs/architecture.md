# Architecture notes

## Data model

```
categories ─< criteria
    │
    └─< nominations ─< assignments >─ users (ADJUDICATOR)
                            │
                            └─ evaluations ─< evaluation_scores >─ criteria

roles ─< users          audit_logs (actor_user_id → users)
```

- `users.role_id` → `roles` (`ADMIN`, `ADJUDICATOR`). One role per user; switch to a join table if someone ever needs both.
- `users.clerk_user_id` links a Clerk identity to the local row (set on first sign-in).
- `criteria` belong to a category; `weight` is a placeholder — the scoring algorithm is not decided.
- `assignments` are unique per (nomination, adjudicator); `evaluations` are one per assignment.
- `evaluation_scores.score` is constrained to 1–10; one score per criterion per evaluation.
- Status columns use `CHECK` constraints mirrored by `shared/src/statuses.ts`.

Schema lives in `backend/db/migrations/*.sql`; `npm run db:migrate` applies new files in order and records them in `schema_migrations`.

## Authentication (Clerk)

Clerk proves *who* someone is; our `users` table decides *whether* they get in and *which role* they have.

1. An admin adds a person to `users` (email + role). First admin: `npm run db:seed-admin -- email "Name"`.
2. That person signs in through Clerk (turn public sign-ups off in the Clerk dashboard).
3. The frontend sends the Clerk session token as `Authorization: Bearer ...`. `requireAuth` (`backend/src/middleware/auth.ts`) verifies it, then finds the user by `clerk_user_id`. On first sign-in it links the Clerk account to the invited row by **verified** primary email.
4. No matching active row → 403 `NOT_INVITED`. `requireRole(...)` enforces roles per route.
5. Every `/api` route requires sign-in. The frontend guards (`lib/auth.tsx`) are UX only.

The token's authorized party must be one of `CORS_ORIGINS`, so the deployed frontend origin must be listed there.

## Deployment

**Vercel** (frontend): the app depends on `shared`, so it builds from the repo root. `vercel.json` holds the settings:
- Build: `npm run build -w shared && npm run build -w frontend`; output `frontend/dist`
- Project settings: Root Directory = repo root, Application Preset = Other
- Env: `VITE_API_URL` = Render service URL (no trailing slash)
- `vercel.json` rewrites all paths to `index.html` so client-side routes survive a refresh.
- Vercel preview deployments get their own URLs, which `CORS_ORIGINS` does not allow; only the production URL works against the API unless added.
- Cloudflare can still manage the domain/DNS.

**Render Web Service** (backend): see `render.yaml`.
- Build: `npm ci --include=dev && npm run build -w shared && npm run build -w backend`
- Start: `npm run start -w backend`
- Health check path: `/health`
- Env: `NODE_ENV=production`, `DATABASE_URL`, `CORS_ORIGINS` (the Pages URL)
- Run `npm run db:migrate` against Neon before first use.
