# @joblify/web

The Joblify production app — Next.js 16 App Router on Vercel Fluid Compute.
The legacy Express API (`Joblify-backend/`) and Vite SPA (`joblify-frontend/`)
have been removed from the repo now that the strangler-fig migration is
complete; both remain available in git history only.

> Reference plan: `/home/distantlife/.claude/plans/analyse-codebase-and-close-tranquil-penguin.md`

**Toolchain:** Bun ≥ 1.1 (package manager + script runner). Node 24 LTS is
still the Vercel Function runtime — Bun is used for `install`, `build`, and
local dev only.

**Docs:** start with [`docs/README.md`](./docs/README.md). It indexes
[SETUP](./docs/SETUP.md), [ARCHITECTURE](./docs/ARCHITECTURE.md),
[FRONTEND](./docs/FRONTEND.md), [BACKEND](./docs/BACKEND.md),
[DATABASE](./docs/DATABASE.md), [AUTH](./docs/AUTH.md), [AI](./docs/AI.md),
[SEARCH](./docs/SEARCH.md), [SECURITY](./docs/SECURITY.md),
[COMPLIANCE](./docs/COMPLIANCE.md), [OBSERVABILITY](./docs/OBSERVABILITY.md),
[TESTING](./docs/TESTING.md), [DEPLOYMENT](./docs/DEPLOYMENT.md),
[OPERATIONS](./docs/OPERATIONS.md), [CUTOVER_RUNBOOK](./docs/CUTOVER_RUNBOOK.md),
and the live [REMAINING_STEPS](./docs/REMAINING_STEPS.md) checklist.

---

## Current status

The platform compiles and ships green: `bun install` → `prisma validate` → `typecheck` → `lint` → `test` → `build` all pass, and `next build` emits PPR output (static shells + server-streamed dynamic content).

What landed:

- Full app surface: `(marketing)` (PPR), `(auth)` (Clerk), `(authenticated)`, and the `company/` segment; 12-model Postgres schema (`pgvector` + PostGIS).
- Real Server Actions (apply, post-job, profile, status, account) wrapped in `withAudit`; AI workflows (resume parse, JD skills, match score, bio coach) triggered off the response path via `after()`.
- Auth (Clerk middleware + `lib/auth`), Algolia search, Blob uploads, Upstash rate limits, Sentry (DSN-gated + client Replay), consent-gated analytics, email bounce/complaint suppression, GDPR export/delete + retention.
- CI (lint/typecheck/test/build, gitleaks, axe), Playwright + Clerk e2e harness, Lighthouse CI on preview deploys, and `docs/`.

Runs on Next 16 **Cache Components** — see the conventions in [FRONTEND.md](./docs/FRONTEND.md). Outstanding work (vendor provisioning, history scrub, deferred features) is tracked in [docs/REMAINING_STEPS.md](./docs/REMAINING_STEPS.md).

---

## What you (human) need to do

These steps require browser-based actions or external account creation that
the local toolchain can't do.

### 1. Install Bun, then bootstrap the workspace

```bash
# Install Bun once on your machine (skip if already installed)
curl -fsSL https://bun.sh/install | bash

cd apps/web
bun install
```

### 2. Link to a Vercel project

```bash
bunx vercel link
```

Pick **Create new project**, name it `joblify-web`, set the root directory to
`apps/web/` when prompted. Production branch: `main`. Vercel detects Bun
from `package.json` `packageManager` and `vercel.ts` `installCommand`.

### 3. Install Vercel Marketplace integrations

In the Vercel dashboard for the `joblify-web` project → **Integrations** →
install each of the following. Each install auto-injects its env vars into
Production + Preview + Development scopes; no manual copy-paste required.

| Order | Integration       | Plan to start                        | Env vars injected                                                                                             |
| ----- | ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1     | **Neon Postgres** | Free (Scale plan when going to prod) | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`                                                                       |
| 2     | **Upstash Redis** | Pay-as-you-go                        | `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`                                         |
| 3     | **Clerk**         | Free → Pro at GA                     | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`                               |
| 4     | **Sentry**        | Team                                 | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`                                             |
| 5     | **Resend**        | Free → Pro at email volume           | `RESEND_API_KEY`                                                                                              |
| 6     | **Algolia**       | Build → Grow at 100K MAU             | `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_API_KEY`, `NEXT_PUBLIC_ALGOLIA_APP_ID`, `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` |

Neon + Upstash + Clerk are required for Week 2. The rest can wait until their
respective weeks.

### 4. Set up LinkedIn OAuth (start now — review is slow)

LinkedIn OAuth review typically takes 2–4 weeks. Submit the app on Week 1 even
though it doesn't ship until Week 2.

1. Go to <https://www.linkedin.com/developers/apps/new>.
2. App name: **Joblify**. Logo: 200×200 PNG. LinkedIn page: your company page.
3. Products: request **Sign In with LinkedIn using OpenID Connect**.
4. Auth → Redirect URLs: add `https://<your-clerk-frontend-api>/v1/oauth_callback`
   (Clerk shows this in **User & Authentication → Social Connections → LinkedIn**).
5. Wait for approval. While you wait, ship Week 2 with Google + email/password
   only; flip LinkedIn on once approved.

### 5. Pull env to local dev

After the Marketplace installs:

```bash
cd apps/web
bunx vercel env pull .env.local
```

Inspect the file — `.env.local` is gitignored. Never paste env values into the
chat or commit them. The pull covers the **Development** scope only (Neon,
Clerk keys, site URL, Clerk paths, dev `CRON_SECRET`); Algolia keys and the
Clerk webhook secret still need manual adds — see `docs/SETUP.md` §5.

### 6. First Prisma migration

Once `DATABASE_URL` is in `.env.local`:

```bash
cd apps/web
# Enable extensions once on the fresh Neon DB
bunx prisma db execute --stdin <<SQL
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
SQL

bunx prisma migrate dev --name init
```

### 7. Verify locally

```bash
bun run dev
# open http://localhost:3000
# open http://localhost:3000/api/v1/health → { status: "ok", ... }
```

### 8. First deploy

```bash
bunx vercel deploy            # preview deploy on your branch
# inspect the preview URL
bunx vercel deploy --prod     # production deploy when ready
```

---

## Day-to-day commands

```bash
bun run dev                  # Next.js dev with Turbopack
bun run build                # Production build (used by Vercel)
bun run lint                 # ESLint
bun run typecheck            # tsc --noEmit
bun run test                 # Vitest unit
bun run test:e2e             # Playwright
bun run prisma:generate      # regenerate client after schema change
bun run prisma:migrate       # create + apply a dev migration
bun run prisma:studio        # GUI to inspect data
bunx vercel env pull         # refresh local env from Vercel
bun add <pkg>                # add a dependency
bun add -d <pkg>             # add a dev dependency
bun update                   # update all packages
```

---

## State management

Two layers, picked for the standard Joblify use cases:

- **TanStack Query (server state)** — anything fetched from the API: applications list, notifications poll, search results client-refresh, mutation + optimistic UI for status changes. Configured in `lib/query/client.ts`, provider wired in `app/providers.tsx`.
- **Zustand (client state)** — ephemeral UI state that never round-trips: mobile menu, theme, search-filters draft before submission, multi-step form drafts. Stores live in `lib/stores/`.

Decision rules:

1. If the data lives on the server, use **TanStack Query**. Don't mirror server data into Zustand.
2. If the data is purely client UI state, use **Zustand**. Don't put it in a React context.
3. For Server Components, fetch directly with Prisma — no client lib needed. Use Server Actions + `useOptimistic` for mutations from forms.
4. Use TanStack Query's `useMutation` only when the mutation lives in client code (e.g. a button click that calls a Route Handler) — Server Actions are the default mutation path.

See `lib/stores/ui.ts` and `lib/stores/search.ts` for the store template, and `lib/query/notifications.ts` for the query template.

---

## Coming in Week 2

- Clerk fully wired: middleware enforces `auth.protect()` on `(authenticated)`
  and `(company)` route groups; MFA required for `org:company`.
- Clerk webhook handler mirrors users → Postgres `users` table.
- `lib/auth.ts` replaces the stub with real `currentUser()` / `requireRole()`.
- First seed data imported from the legacy Mongo via
  `scripts/migrate-mongo-to-neon.ts`.

---

## Security guardrails

- `.env*` are gitignored except `.env.example`.
- All secrets live in Vercel Project Environment Variables or your local
  `.env.local`. Never in code, never in chat, never in `.env.example`.
- `lib/observability/logger.ts` redacts `password`, `token`, `authorization`,
  `cookie`, and `refreshToken` paths.
- `gitleaks` runs on every CI push.
- The legacy `Joblify-backend/.env.example` has been cleared of leaked values,
  but git history still contains them — rotate those credentials externally
  and scrub history per the Week 0 instructions in the plan.
