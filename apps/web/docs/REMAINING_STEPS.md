# Remaining steps

Single source of truth for what's NOT done. Cross-references every `TODO(week-N)` in code, every manual provisioning item, and every deferred V1.5 / V2 scope item.

Updated 2026-07-18.

---

## P0 — must do before ANY production traffic

### 1. Rotate the leaked credentials and scrub git history

The Mongo Atlas URI + JWT secret from the legacy `Joblify-backend/.env.example` are still recoverable from git history. The Mongo URI shared earlier in our conversation is also in the chat transcript.

Steps:

```bash
# 1. Rotate the Atlas password in MongoDB Atlas dashboard
#    Database Access → user `joblify` → Edit Password → generate new
#    Update Joblify-backend/.env (gitignored) with the new password
#    Also rotate any prior Atlas user (`allan`) that may still exist.

# 2. Rotate the JWT secret
openssl rand -base64 48
# Replace JWT_SECRET in Joblify-backend/.env and Vercel envs

# 3. Scrub history
#    Populate /tmp/replacements.txt with the OLD values you want removed,
#    one per line in this shape (do NOT commit this file):
#       <old-secret-value>==>REDACTED
#    The old values to scrub live in your local Joblify-backend/.env and in
#    prior git revisions of Joblify-backend/.env.example.
pipx install git-filter-repo
git filter-repo --replace-text /tmp/replacements.txt --force
git push --force-with-lease origin main
rm /tmp/replacements.txt

# 4. Tell collaborators to re-clone
```

> The literal secret strings to scrub are intentionally not pasted here — putting
> them in this committed doc would just create a new copy of the leak.

Done? Mark on the security tracker.

### 2. Install Bun and install deps

```bash
curl -fsSL https://bun.sh/install | bash
cd apps/web
bun install
```

### 3. Vercel project + Marketplace installs

See [SETUP.md](./SETUP.md) §2–§3. Order matters — Neon, Upstash, Clerk first.

### 4. Submit LinkedIn OAuth app

Review takes 2–4 weeks. Submit now even though it doesn't gate Week 2 work.

---

## P1 — required for Week 2+ work to compile and run

### Manual env

Beyond what Marketplace auto-injects, set in Vercel:

- `NEXT_PUBLIC_SITE_URL` (Production / Development scopes).
- `CRON_SECRET` (random 48-byte base64, Production + Preview).
- `RESEND_WEBHOOK_SECRET` (after configuring Resend webhook).
- `EMAIL_FROM`.
- `AI_GATEWAY_API_KEY` (for local dev only — auto-injected in deploys).

### Clerk webhook

Configure in Clerk dashboard with URL `${NEXT_PUBLIC_SITE_URL}/api/v1/webhooks/clerk` and events:
- `user.created`, `user.updated`, `user.deleted`
- `organization.created`, `organization.updated`, `organization.deleted`
- `organizationMembership.created`, `organizationMembership.deleted`

Copy signing secret to `CLERK_WEBHOOK_SECRET` in Vercel.

### Resend webhook + domain verification

In Resend:
- Verify the email-from domain (DKIM, SPF, DMARC).
- Configure webhook at `${NEXT_PUBLIC_SITE_URL}/api/v1/webhooks/resend` for `email.bounced`, `email.complained`, `email.delivered_delayed`.
- Copy signing secret to `RESEND_WEBHOOK_SECRET`.

### Algolia indexes

Create `jobs`, `companies`, `skills` indexes in Algolia. Configure searchable attributes + custom ranking for `jobs` per [SEARCH.md](./SEARCH.md).

Add two `jobs` replicas to back the search sort dropdown (the `/api/v1/jobs/search` route falls back to relevance until they exist):
- `jobs_recent` — ranking by `publishedAt` desc
- `jobs_salary_desc` — ranking by `salaryMax` desc

### Postgres extensions + initial migration

```bash
bunx prisma db execute --stdin <<SQL
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
SQL

bunx prisma migrate dev --name init
bun run seed:skills
```

Add a follow-up SQL migration for the manual indexes ([DATABASE.md](./DATABASE.md) §"Indexes"):
- HNSW on `resumes.embedding` + `job_posts.embedding`
- GIN on `job_posts.tsv` + `job_posts.title gin_trgm_ops`
- GIST on `job_posts.geo`

---

## P2 — TODOs left in code

Grep: `git grep "TODO(week-"` to see them all in context.

> **Gap Remediation Sprint (2026-06-08)** closed the Week-5 AI triggers, Week-6
> Sentry init, Week-9 email suppression, the Week-10 consent + account-deletion
> follow-ups, and the Week-11 LHCI / CSP / Playwright-fixture items. What remains:

### Week 4 follow-up — search outbox

| File | What |
|---|---|
| `lib/search/index-job.ts` | Implement a real `index_outbox` table + writer; cron drains it. Current behavior is fire-and-forget + reconcile-only. |

### Week 11 — hardening (remaining)

| Item | What |
|---|---|
| DB migration in CI | Run `prisma migrate deploy` before Vercel promotes. **Blocked:** no public Postgres image bundles both PostGIS and pgvector — use a custom image or a managed Neon CI branch. |
| CSP enforce | Flip `Content-Security-Policy-Report-Only` → `Content-Security-Policy` in `next.config.ts` once the violation report is clean. |
| Lighthouse budgets (enforce) | LHCI runs **report-only** (`warn`) on preview deploys today. After the Week-11 polish, flip `lighthouserc.json` assertions to `error`. Current gaps to close first: accessibility 0.90→0.95, SEO 0.82→0.95. (INP is a field-only metric, omitted from the lab assertions.) This also covers a11y coverage, since Lighthouse's accessibility category is axe-core. |
| Synthetic check + PagerDuty | Vercel Cron hitting `/api/v1/health` every 5 min, paging on 3 consecutive failures. |
| Rolling Release auto-rollback | Configure auto-rollback policy in Vercel based on error rate. |
| AV scan | Cloudmersive integration in `resume-parse.workflow.ts` if resume volume crosses 1k/day. |
| Re-index script | `scripts/reindex-all.ts` to rebuild Algolia from scratch. |
| `middleware.ts` → `proxy.ts` | Next 16 deprecated the `middleware` file convention in favour of `proxy` (build prints a warning). Rename + adjust the export when convenient. |
| `turbopack.root` | Set it in `next.config.ts` (or drop the root `package-lock.json`) to silence the multi-lockfile workspace-root warning. |

---

## V1.5 — explicitly deferred features

Don't sneak these into V1. They land after Week 12 cutover + 4-week stability period.

| Feature | Why deferred | Notes |
|---|---|---|
| Realtime chat transport | Chat areas (job-specific + virtual-intern) shipped 2026-07-03 as request/response Server Actions | Only the push transport (SSE/WebSocket) remains deferred; messages currently appear on submit/reload |
| Recruiter AI screening summaries | Most expensive AI feature | Defer until paying recruiter customers exist |
| Saved-search alerts with diff | Cron + diff complexity | V1 has a simple daily digest of new jobs |
| AI vector reranking on search | Marginal gain at 10k MAU | Add when search CTR plateaus |
| Public `/jobseekers` listing | Company-facing directory shipped 2026-07-03 (`/company/jobseekers`: PUBLIC profiles + subscribers, type filters, invite/share actions) | An unauthenticated public listing still needs UX + SEO thought |
| Mobile native client | `/api/v1/*` is ready when this ships | iOS + Android with shared Route Handlers |
| Personalization ("jobs like ones you applied to" — behavioral) | Needs behavioral data | Collect via `JobView` for V1; mine in V1.5. Note: a *content*-based variant (resume↔job embedding similarity) shipped as `/jobseeker/matches` — this line is specifically about interaction/behavioral signals, which is a separate, still-open gap |
| Feature flags / A/B test framework | Need traffic first | Use Algolia A/B for search ranking; build app-side later |
| Per-user TZ for daily digest | Single 08:00 UTC is good enough at beta scale | V1 sends all at the same time |
| i18n (es, fr, pt, ar with RTL) | English-only for beta | When markets demand it, see [FRONTEND.md](./FRONTEND.md) §i18n |
| Radix (accessible primitives) | The hand-rolled primitives in `app/components/ui/` cover current needs | Tailwind 4 is already adopted; add Radix only if a future component (combobox, accessible modal) outgrows the hand-rolled version |

---

## V2 — bigger product moves

| Feature | Why later |
|---|---|
| Stripe billing | The `PlanTier` model + real gates (chat area creation, chat/share outreach, application tracking) shipped — everyone defaults to `PRO` since there's no checkout yet. Actual payment collection needs a sustained user base first |
| Agentic multi-tool AI features (interview prep coach, application-quality reviewer, multi-turn chat) | Every AI feature today (resume parse, JD skill extraction, bio coach, match scoring) is single-shot — no tool-calling/looping. A real agentic feature needs conversation history + state + a new UI surface, which is more scope than a point fix |
| Job-board syndication (ATS integrations) | Partner integrations |
| White-label for enterprise | Multi-tenancy in route group + theming |
| Talent pool / sourcing | New product surface |
| SOC 2 Type 1 audit | Annual, after first revenue |

---

## Documentation gaps

| Doc | Status |
|---|---|
| `apps/web/docs/README.md` | Done — index |
| `SETUP.md` | Done |
| `ARCHITECTURE.md` | Done |
| `FRONTEND.md` | Done |
| `BACKEND.md` | Done |
| `DATABASE.md` | Done |
| `AUTH.md` | Done |
| `AI.md` | Done |
| `SEARCH.md` | Done |
| `SECURITY.md` | Done |
| `COMPLIANCE.md` | Done |
| `OBSERVABILITY.md` | Done |
| `TESTING.md` | Done |
| `DEPLOYMENT.md` | Done |
| `OPERATIONS.md` | Done (pre-existing) |
| `CUTOVER_RUNBOOK.md` | Done (pre-existing) |
| `REMAINING_STEPS.md` | This file |
| `postmortems/<date>-<slug>.md` | Created on first incident |
| `decisions/<date>-<slug>.md` (ADRs) | Optional; add when a non-obvious decision sticks |

---

## How to update this file

When you tick off an item, **delete the line** (don't strike-through). This file is the to-do list, not the changelog. Keep it short and current. If the team adds new TODOs in code, add them here in the same PR.

Quick audit:

```bash
git grep -n "TODO(week-" apps/web/
```

Any output above should be reflected as a row in this doc.
