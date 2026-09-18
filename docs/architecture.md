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

## Authentication plan (Clerk)

Not implemented. Scaffolding:
- Backend: `middleware/auth.ts` has `requireAuth` (currently fails closed with 501) and `requireRole(...)`; `req.auth` is typed in `types/express.d.ts`.
- Frontend: `lib/auth.tsx` has `RequireRole` / `useCurrentRole` stubs. Frontend guards are UX only; the API must enforce roles.

## Deployment

**Cloudflare Pages** (frontend): the app depends on `shared`, so build from the repo root:
- Build command: `npm ci && npm run build -w shared && npm run build -w frontend`
- Output directory: `frontend/dist`
- Env: `VITE_API_URL` = Render service URL
- Pages serves `index.html` for unknown paths when there is no `404.html`, so client-side routes work.

**Render Web Service** (backend): see `render.yaml`.
- Build: `npm ci && npm run build -w shared && npm run build -w backend`
- Start: `npm run start -w backend`
- Health check path: `/health`
- Env: `NODE_ENV=production`, `DATABASE_URL`, `CORS_ORIGINS` (the Pages URL)
- Run `npm run db:migrate` against Neon before first use.
