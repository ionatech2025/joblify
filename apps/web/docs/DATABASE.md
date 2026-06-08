# Database

Postgres on Neon. Schema in `prisma/schema.prisma`. Extensions for full-text, geo, and vector search are colocated in the same database — no separate vector DB until 1M+ rows.

## Provider

**Neon Postgres** via Vercel Marketplace. Auto-injects `DATABASE_URL` (pooled, for serverless) and `DATABASE_URL_UNPOOLED` (direct, for migrations / long connections).

Preview deploys get their own Neon DB branch automatically — created in seconds, destroyed on PR close. Production runs against the default branch.

## Required extensions

Run once on a fresh DB before the first migration:

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

- `citext` — case-insensitive email column.
- `pgcrypto` — `gen_random_uuid()` for default IDs.
- `pg_trgm` — fuzzy text matching (e.g. typo-tolerant search fallback).
- `postgis` — geo columns + radius queries.
- `vector` (pgvector) — embeddings for resume + JD match scoring.

The Prisma schema declares them in the `datasource db.extensions` block, but Neon doesn't auto-install them — the `bunx prisma db execute --stdin` step in [SETUP.md](./SETUP.md) is required.

## Model graph

```
                    ┌────────────┐
                    │   User     │
                    └────────────┘
                    /      |      \
            ┌──────┘       │       └──────┐
            ▼              ▼              ▼
   ┌─────────────────┐  ┌──────────┐  ┌─────────────────┐
   │ JobSeekerProfile│  │  Resume  │  │  CompanyProfile │
   └─────────────────┘  └──────────┘  └─────────────────┘
            │              │              │
            ▼              │              ▼
   ┌─────────────────┐     │       ┌─────────────┐
   │ JobSeekerSkill  │     │       │   JobPost   │
   └─────────────────┘     │       └─────────────┘
            │              │              │
            ▼              ▼              ▼
        ┌────────┐    ┌──────────────┐  ┌──────────────┐
        │ Skill  │ ◄──┤ JobApplication│  │ JobPostSkill │
        └────────┘    └──────────────┘  └──────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   ┌──────────────┐                    ┌──────────────┐
   │ Notification │                    │  AuditEvent  │
   └──────────────┘                    └──────────────┘
```

Plus: `Invitation`, `JobView`.

## Identity & access

| Field | Purpose |
|---|---|
| `User.clerkUserId` | The Clerk-side ID. Mirrored on `user.created` webhook. Unique. |
| `User.email` | `citext` (case-insensitive). Unique. |
| `User.userType` | `JOB_SEEKER` / `COMPANY` / `ADMIN`. Drives route gating. |
| `User.deletedAt` | Soft delete. Hard-deleted by `retention.workflow.ts` after 30 d. |

`User` has two 1:1 profile rows (`JobSeekerProfile`, `CompanyProfile`) — they exist for the user's `userType`. Look up via `db.user.findUnique({ include: { jobSeekerProfile: true } })`.

## Jobs

| Field | Purpose |
|---|---|
| `JobPost.slug` | Unique URL slug. Generated from title + random suffix. |
| `JobPost.companyId` | FK to `User.id` (the owner). |
| `JobPost.status` | `DRAFT` / `PENDING_REVIEW` / `PUBLISHED` / `CLOSED` / `ARCHIVED`. Only `PUBLISHED` shows on /jobs. |
| `JobPost.embedding` | 1536-dim `vector` for match scoring. Written by `resume-parse` + `match-score` workflows. |
| `JobPost.geo` | PostGIS `geography(Point, 4326)` for radius queries. Optional. |
| `JobPost.tsv` | `tsvector` for FTS fallback. Optional — Algolia handles primary search. |
| `JobPost.deletedAt` | Soft delete. |

`JobApplication` joins jobseeker × jobPost × resume with a `@@unique([jobPostId, jobSeekerId])` so a user can't apply twice.

## Skills taxonomy

`Skill` is canonical (slug-unique). Seeded by `scripts/seed-skills.ts` with ~30 starter skills; expand to the full ESCO catalogue (~13k entries) when search relevance demands it.

`JobPostSkill` and `JobSeekerSkill` are join tables with extra columns:
- `JobPostSkill.weight` — 1 (nice-to-have) or 2 (required).
- `JobSeekerSkill.proficiency` 1–5, `JobSeekerSkill.years` integer.

These power the Jaccard skill overlap in `lib/search/ranking.ts`.

## Notifications + invitations

| Model | Use |
|---|---|
| `Notification` | In-app feed for jobseeker + company. Polled every 30 s by TanStack Query. Cleared by retention cron (read >6 months or unread >90 days). |
| `Invitation` | Company → jobseeker invitations. PENDING / ACCEPTED / DECLINED / EXPIRED / REVOKED. Purged 90 d after expiry. |

## Audit log

`AuditEvent` is the immutable trail. Written by `withAudit` on every state change. Never delete rows — retention sets a 1-year TTL via the `retention` workflow.

| Field | Notes |
|---|---|
| `actorId` | FK to User; nulled when the user is hard-deleted (GDPR keeps the audit, drops PII). |
| `action` | `AuditAction` enum. Add new values via migration. |
| `entity` + `entityId` | Subject of the action. |
| `before` / `after` | JSON snapshots. Diff is the truth. |

## Indexes (defined in `schema.prisma`)

| Index | Purpose |
|---|---|
| `User: [userType, deletedAt]` | Fast filter for jobseekers / companies / admins, skipping soft-deleted. |
| `JobPost: [companyId, status, deletedAt]` | Company dashboard listing. |
| `JobPost: [status, publishedAt desc]` | Public /jobs feed. |
| `JobPost: [industry, status]` | Industry-faceted browse. |
| `JobApplication: [jobSeekerId, appliedAt desc]` | Jobseeker applications list. |
| `JobApplication: [jobPostId, status]` | Company applicants list. |
| `JobView: [jobPostId, createdAt]` | Per-JD analytics. |
| `Notification: [userId, readAt, createdAt desc]` | Notifications feed; the readAt-in-key lets us pull unread fast. |
| `AuditEvent: [actorId, createdAt desc]` | "What did user X do?" |
| `AuditEvent: [entity, entityId]` | "Who touched this thing?" |

Manual indexes for vector / FTS columns are added via raw SQL migrations:

```sql
-- HNSW for cosine ANN search on resume × job_post
CREATE INDEX IF NOT EXISTS job_posts_embedding_hnsw
  ON job_posts USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS resumes_embedding_hnsw
  ON resumes USING hnsw (embedding vector_cosine_ops);

-- GIN for tsvector FTS fallback
CREATE INDEX IF NOT EXISTS job_posts_tsv_gin
  ON job_posts USING gin (tsv);

-- GIN trigram for fuzzy title search
CREATE INDEX IF NOT EXISTS job_posts_title_trgm
  ON job_posts USING gin (title gin_trgm_ops);

-- Geo
CREATE INDEX IF NOT EXISTS job_posts_geo_gist
  ON job_posts USING gist (geo);
```

Drop these into a Prisma migration (`prisma/migrations/<ts>_search_indexes/migration.sql`) once the schema is stable.

## Raw SQL escape hatches

Prisma's `Unsupported()` types can't be set via the client; use tagged-template raw SQL:

```ts
const vectorLiteral = `[${embedding.join(',')}]`;
await db.$executeRaw`
  UPDATE resumes SET embedding = ${vectorLiteral}::vector WHERE id = ${id}::uuid
`;
```

```ts
// Cosine similarity
const result = await db.$queryRaw<{ score: number }[]>`
  SELECT 1 - (r.embedding <=> j.embedding) AS score
  FROM resumes r, job_posts j
  WHERE r.id = ${resumeId}::uuid AND j.id = ${jobId}::uuid
`;
```

Use the tagged-template form (`db.$queryRaw`...`) for parameter safety. Never concatenate strings.

## Migrations

```bash
bun run prisma:migrate -- --name <descriptive_name>
```

Migrations are committed under `prisma/migrations/`. CI runs `bunx prisma validate` on every PR.

Production migrations: `bun run prisma:deploy` is invoked by Vercel before promoting a deploy. Configure that hook via Vercel project settings → **Settings → Build & Development → Build Command** override only if you need the migration to run pre-build. The default is to run migrations manually before promotion.

## Soft deletes

Models with `deletedAt`:

- `User`
- `JobPost`
- `Resume`

Convention: queries always filter `deletedAt: null` unless explicitly fetching soft-deleted rows for admin / compliance reasons. The `retention` workflow hard-deletes after 30 days.

## Retention

`retention.workflow.ts` runs daily at 02:00 UTC. See [COMPLIANCE.md](./COMPLIANCE.md) for the data-retention contract.

## Data flow for AI features

```
Resume uploaded ──> resume-parse.workflow
                     │
                     ├──> parsedJson (Jsonb)
                     └──> embedding   (pgvector 1536)

Job posted ──> post-job Server Action
                  ├──> JD skill extraction (Haiku → JobPostSkill rows)
                  └──> [TODO Week 8] embed JD via match-score workflow

Application submitted ──> match-score.workflow
                            └──> JobApplication.matchScore (Float)
```

The match badge on `/jobs/[slug]` reads `matchScore` from the application row or computes `1 - (resume.embedding <=> jobPost.embedding)` inline if both embeddings exist but no application yet.

## Backups + DR

Neon takes daily snapshots automatically; Point-in-Time Recovery (PITR) is included on the Scale plan. Test the DR drill once per quarter:

1. Spin a new Neon branch from a 4-hour-old PITR snapshot.
2. Point a staging Vercel preview at it.
3. Hit `/api/v1/health` + run the Playwright smoke.
4. Tear down.

Target: full restore in < 4 h.

## Tenancy invariants

These are the contracts that protect against IDOR. Code reviews must enforce them.

| Resource | Who can read | Who can write |
|---|---|---|
| `User.id` | self + admin | self + admin |
| `JobSeekerProfile` | self; `visibility: PUBLIC` profiles are listable | self |
| `CompanyProfile` | anyone (public) | the owning user |
| `JobPost` | anyone if `status: PUBLISHED && deletedAt: null` | the owning company |
| `JobApplication` | the jobseeker + the company that owns the job | jobseeker creates; company changes status |
| `Resume` | self; visible to companies through applications | self |
| `Notification` | self | system writes; self marks read |
| `AuditEvent` | admin only | system writes (immutable) |

Every controller that reads or writes from these tables must include the right `where` clause. Never use `findUnique({ where: { id } })` for a resource that has a tenancy boundary — use `findFirst({ where: { id, ownerId: user.id } })`.
