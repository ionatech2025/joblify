# Architecture

How Joblify is structured. Read this once on day one; revisit when a decision feels arbitrary.

## One-line summary

A single Next.js 16 App Router app on Vercel Fluid Compute, fronted by Clerk auth and Vercel BotID, backed by Neon Postgres + Upstash Redis + Algolia + Vercel Blob, with AI features routed through Vercel AI Gateway and background work run off the response path via Next's `after()` (durable Workflow DevKit steps are a planned upgrade).

## Top-down system diagram

```
                       ┌─────────────────────────────────────────────┐
                       │                  VERCEL EDGE                 │
                       │                                              │
                       │  BotID Pro  │  Middleware  │  Rolling        │
                       │  on apply   │  (Clerk +    │  Releases       │
                       │             │   role gate) │  (canary)       │
                       │                                              │
                       │  Speed Insights · Analytics · Observability  │
                       └─────────────────────────────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
   │  PUBLIC (PPR)        │  │  AUTHENTICATED       │  │  COMPANY (role)      │
   │  'use cache'         │  │  auth().protect()    │  │  org:company gate    │
   │  cacheTag-keyed      │  │  RSC + TanStack      │  │  + MFA               │
   │                      │  │  Query streams       │  │                      │
   │  /                   │  │                      │  │  /company/jobs       │
   │  /jobs               │  │  /dashboard          │  │  /company/jobs/new   │
   │  /jobs/[slug]        │  │  /jobseeker/...      │  │  /company/jobs/[id]  │
   │  /companies/[slug]   │  │  /account/export     │  │  /company/applicants │
   │  /legal/...          │  │  /account/delete     │  │                      │
   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
              │                           │                           │
              └───────────────────────────┼───────────────────────────┘
                                          ▼
                       ┌─────────────────────────────────────────────┐
                       │             FLUID COMPUTE (Node 24)           │
                       │                                              │
                       │  Server Components  ·  Server Actions        │
                       │  Route Handlers     ·  Cron jobs             │
                       │  Workflow steps     ·  Webhook handlers      │
                       └─────────────────────────────────────────────┘
                                          │
        ┌───────────┬─────────────┬─────────────┬────────────┬──────────────┐
        ▼           ▼             ▼             ▼            ▼              ▼
   ┌────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐
   │  Neon  │  │ Upstash │  │  Vercel  │  │ AI       │  │ Algolia  │  │ Resend │
   │  PG    │  │ Redis   │  │  Blob    │  │ Gateway  │  │  search  │  │ email  │
   │ + pg-  │  │ rate +  │  │ resume / │  │ Haiku /  │  │ jobs +   │  │        │
   │ vector │  │ runtime │  │ logo     │  │ Sonnet / │  │ companies│  │        │
   │ + PG-  │  │ cache   │  │          │  │ embed-3  │  │ + skills │  │        │
   │ IS     │  │         │  │          │  │          │  │          │  │        │
   └────────┘  └─────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │  Sentry  ·  Vercel    │
                              │  Observability        │
                              └──────────────────────┘
```

## Route group layout

| Group | Purpose | Auth | Rendering |
|---|---|---|---|
| `(marketing)` | Public, SEO-critical, indexed | None | PPR: `'use cache' + cacheTag + cacheLife('hours')` |
| `(auth)` | Clerk SignIn / SignUp | Public | Dynamic (Clerk widget) |
| `(authenticated)` | Jobseeker dashboards + account | `auth().protect()` in layout | Dynamic RSC, no cache |
| `company` | Company dashboards (real `company/` segment, not a group) | `auth().protect((has) => has({ role: 'org:company' }))` in layout | Dynamic RSC, no cache |
| `(admin)` | Admin (not in V1) | — | — |

## Request lifecycle examples

### Public JD page (`/jobs/[slug]`)

1. Vercel edge receives request, runs `middleware.ts`.
2. `middleware.ts` falls through (public path, no auth required).
3. Cached JD shell is served from Vercel edge cache, keyed on `cacheTag('job:'+id)`.
4. `<Suspense>` boundary streams `<ApplyPanel>` — a dynamic island that reads the Clerk session and renders one of three CTAs (sign-in, apply, already-applied).
5. JSON-LD `JobPosting` injected into HTML for Google Jobs.
6. Page invalidation: when company edits the JD via Server Action, `updateTag('job:'+id)` clears the cache.

### Apply Server Action (`/jobs/[slug]/apply` submit)

1. Form submits to `actions/apply.ts:submitApplication`.
2. BotID Pro check → 403 on bot.
3. `requireRole('JOB_SEEKER')` validates session.
4. `applyLimit(userId)` against Upstash → 429 if exceeded.
5. Zod validation of FormData.
6. Ownership check: resume belongs to user; job is published.
7. `withAudit` wraps the `jobApplication.create` in a tx that also writes an `AuditEvent`.
8. `updateTag(user:<id>:applications, job:<id>:applicants)`.
9. Best-effort: Resend confirmation email.
10. Best-effort: trigger `resume-parse.workflow.ts` + `match-score.workflow.ts`.

### Daily digest cron

1. Vercel Cron hits `GET /api/v1/cron/digest-email` at `0 8 * * *` UTC.
2. Route Handler verifies `Authorization: Bearer ${CRON_SECRET}`.
3. Calls `runDigest()` workflow → query Postgres for active jobseekers + new jobs in last 24h → batch send via Resend.
4. Returns `{ ok, ran, at, sent, skipped }` for cron logs.

## Data flow: apply → match badge

```
Apply Server Action ───┐
                       ├──> resume-parse.workflow (PDF/DOCX → Haiku → parsedJson + embedding)
                       └──> match-score.workflow (cosine via pgvector)
                                      │
                                      ▼
                            job_applications.matchScore = X
                                      │
                                      ▼
                            /jobs/[slug] MatchBadge RSC reads matchScore
```

When an authenticated jobseeker views a JD they haven't applied to and both embeddings exist already, the badge computes inline via a single `WITH r AS (...), j AS (...) SELECT 1 - (r.embedding <=> j.embedding)` query — no AI Gateway hit on the hot path.

## Caching strategy

| Layer | Tool | Use |
|---|---|---|
| HTML / RSC | Next 16 `'use cache'` directive | JD shell, company profile shell, marketing pages |
| Tag invalidation | `cacheTag` + `updateTag` | All mutations call `updateTag` on the right keys |
| Server runtime | Upstash Redis (`@upstash/ratelimit` + ad-hoc K/V) | Rate-limit counters; future runtime cache for hot reads |
| Client | TanStack Query (`staleTime: 30s`, `gcTime: 5min`) | All client-side fetches |
| CDN | Vercel edge | Static assets, OG images |

Tag namespace is centralized in `lib/cache.ts`. Never inline a tag string — always go through `tags.*`.

## Auth flow

```
Browser ──> /sign-in (Clerk component) ──> Clerk hosted flow ──> session cookie set
                                                    │
                                                    ▼
                                          webhook: user.created
                                                    │
                                                    ▼
                                          POST /api/v1/webhooks/clerk
                                                    │
                                                    ▼
                                          db.user.upsert  (mirror)
```

Subsequent requests:

```
Browser ──> /jobseeker/applications ──> middleware.ts (auth.protect)
                                              │
                                              ▼
                                      layout.tsx (requireUser)
                                              │
                                              ▼
                                      page.tsx (Server Component, db.* queries)
```

`requireUser()` reads `clerkAuth().userId`, looks up the mirrored row, and returns the `User`. Server Actions reuse the same helper.

## Workflows

`workflows/*.workflow.ts` are plain async functions. Each is invoked off the response path via Next's `after()` (apply Server Action + upload route) or directly from a Cron Route Handler (retention, digest-email). They are idempotent and best-effort — failures are logged, and the algolia-reconcile cron reconciles search. Durable steps + automatic retries arrive when the Vercel Workflow DevKit is enabled on the account; the idempotent design makes that a drop-in.

| Workflow | Triggered by | Duration p95 | Idempotent? |
|---|---|---|---|
| `resume-parse` | apply Server Action | 8–20s | yes (skips if parsedJson exists) |
| `match-score` | apply Server Action, JD publish | 1–5s | yes (writes to existing application row) |
| `digest-email` | daily cron | 30–120s | no (no watermark in V1) |
| `gdpr-export` | account export endpoint | 5–30s | yes (signed URL, can run twice) |
| `retention` | daily cron | 5–60s | yes (deleteMany is idempotent) |

## What's intentionally simple

- **No outbox table for Algolia.** Server Actions call `algolia.partialUpdateObject` directly; failure path falls back to a 15-min reconcile cron that re-scans recently-updated jobs. Add a real outbox in V1.5 if drift becomes a problem.
- **Chat without a realtime transport.** Job-specific + virtual-intern chat areas shipped 2026-07-03 (flowchart / JOB_UC_11–14: `ChatArea`/`ChatParticipant`/`ChatMessage`, `/company/chats`, `/jobseeker/chats`) as plain request/response Server Actions — new messages appear on submit or reload. A push transport (SSE/WebSocket) is the part still deferred to V1.5.
- **No personalized search ranking yet.** Pure Algolia + the composite signal in `lib/search/ranking.ts`. AI vector reranking is V1.5.
- **No screening summaries.** The most expensive AI feature is deferred until paying recruiter customers exist.
- **No billing.** Stripe is V2. The free `CompanySubscription` follow model (seeker subscribes to a company as EMPLOYABLE or VIRTUAL_INTERN, JOB_UC_07) shipped 2026-07-03; paid/premium gating would layer on top of it.

## What's intentionally cautious

- **PII redaction at the logger.** `lib/observability/logger.ts` redacts `password`, `token`, `authorization`, `cookie`, `refreshToken` even if you log a whole request. Adding a new sensitive field? Update the redact list at the same PR.
- **Tenancy checks in every controller.** Every `prisma.*.findFirst({ where: { id, companyId: user.id } })` exists for a reason — never trust the URL `:id`.
- **`withAudit` on every state-changing op.** If a mutation skips audit, it's a bug.
- **Soft-delete first, hard-delete via cron.** `deletedAt` lets us recover from honest mistakes and stays within GDPR's 30-day window.

## File-tree map

```
apps/web/
├── app/
│   ├── (marketing)/        # public, indexed, PPR
│   ├── (auth)/             # Clerk sign-in/sign-up
│   ├── (authenticated)/    # jobseeker + account
│   ├── company/          # company role-gated
│   ├── api/v1/             # stable HTTP surface (Route Handlers)
│   ├── actions/            # 'use server' mutations
│   ├── components/         # shared client components (cookie banner, etc.)
│   ├── layout.tsx          # ClerkProvider + Providers + Analytics + SpeedInsights
│   ├── providers.tsx       # TanStack QueryClientProvider
│   ├── sitemap.ts
│   └── robots.ts
├── lib/                    # domain libs (auth, db, audit, ratelimit, cache, ai, search, storage, email, query, stores, seo, observability)
├── workflows/              # async jobs invoked via after(); DevKit-ready
├── prisma/schema.prisma    # Postgres schema (12+ models)
├── prisma/seed.ts          # reproducible seed (prisma db seed): skills + demo
├── scripts/                # one-shot: migrate-mongo-to-neon
├── tests/                  # vitest unit, playwright e2e + a11y, k6 load
├── middleware.ts           # Clerk + BotID + security headers
├── instrumentation.ts      # Sentry boot
├── next.config.ts
└── vercel.ts               # regions + crons + install/build commands
```

Every file's role should be inferable from its path. If it isn't, the file is in the wrong place.
