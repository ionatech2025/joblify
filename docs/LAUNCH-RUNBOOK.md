# Launch runbook

Ordered steps to take `apps/web` from green CI to production.
**[code: done]** = in the repo. **[owner]** = needs your accounts/dashboards;
I can't do these for you.

## 0. Security — do first

- **[owner]** Rotate the historical `ce37671` Atlas + `JWT_SECRET` / `SESSION_SECRET`
  dev credentials — see [SECURITY.md](./SECURITY.md). HEAD is already placeholdered.

## 1. Provision services + env

- **[owner]** Provision (Vercel Marketplace where possible): Neon Postgres
  (eu-central-1), Upstash Redis, Clerk, Algolia, Resend, Sentry, Vercel Blob,
  AI Gateway. Set env vars in the Vercel project (Production + Preview).
  Minimum to boot: `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED`),
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`,
  `CRON_SECRET`. The rest each activate their feature when present, no-op otherwise.
- **[owner]** Configure Clerk providers (Google now; LinkedIn has 2–4wk review),
  MFA, and the user-mirror webhook → `/api/v1/webhooks/clerk`.
- **[owner]** Before real traffic, switch Clerk from the dev instance to a
  **production instance** (`pk_live`, custom domain, own OAuth creds) —
  full runbook: [`docs/CLERK-PRODUCTION.md`](CLERK-PRODUCTION.md).

## 2. Database

- **[code: done]** Initial migration at `prisma/migrations/20260609000000_init`
  (extensions, 16 tables, pgvector HNSW indexes, FTS trigger + GIN, PostGIS GiST,
  pg_trgm) — captures the full schema incl. `SavedJob` / `SavedSearch` /
  `recruiterNotes` / `emailSuppressedAt` / `index_outbox`.
- **[code: done]** `prisma migrate deploy` now runs automatically in the Vercel
  build (`vercel.ts` `buildCommand`). Ensure `DATABASE_URL_UNPOOLED` (the Neon
  **direct** connection — pooled PgBouncer can't run DDL) is set in the Vercel
  env. The first deploy applies the init migration, incl. `CREATE EXTENSION`; the
  Neon role must be allowed to create `postgis` / `vector` / `pg_trgm` (enable in
  the Neon dashboard if the deploy errors). A failed migration fails the deploy
  (so a broken schema never ships). To gate prod migrations manually instead,
  drop `prisma migrate deploy` from `buildCommand` and run it as a release step.
- **[owner]** Seed the skill taxonomy: `bunx prisma db seed` (reference skills;
  add `SEED_DEMO=1` to also plant the flowchart demo — a company + jobs, two
  directory-visible seekers, subscriptions, a pending typed invitation, job +
  virtual-intern chat areas with messages, resumes, job applications, saved
  jobs/searches, and the notifications those flows produce). JD skill
  extraction matches against the skills — search/match quality depends on it.

## 3. Data migration (only if importing legacy Mongo data)

- **[owner]** Dry-run `scripts/migrate-mongo-to-neon.ts` against a Neon branch,
  verify row-count parity per table, then run against production before cutover.

## 4. Algolia

- **[owner]** Create the `jobs` index; set `searchableAttributes` + `customRanking`
  per [SEARCH.md](../apps/web/docs/SEARCH.md). Add replicas `jobs_recent`
  (`publishedAt` desc) and `jobs_salary_desc` (`salaryMax` desc) for the sort
  dropdown (the route falls back to relevance until they exist). Set
  `attributesForFaceting` if you enable facet counts.
- **[code: done]** Indexing is push-based on post/edit, with a durable
  `index_outbox` drained by the `algolia-reconcile` cron (every 15 min). Backfill
  existing jobs by re-saving them (or a one-off reindex over `job_posts`).

## 5. Verify before traffic

- **[owner]** AI: apply to a seeded job → `Resume.parsedJson` +
  `JobApplication.matchScore` populate; the match badge renders on the JD.
- **[owner]** Consent: load pre-consent → no `va.vercel-scripts.com` until "Accept".
- **[owner]** Suppression: POST a synthetic `email.bounced` to
  `/api/v1/webhooks/resend` → `User.emailSuppressedAt` set → digest skips.
- **[owner]** e2e: with Clerk dev users + `E2E_TEST_*` env, `bun run test:e2e`
  (5 critical paths on Chromium/Firefox/WebKit).
- **[owner]** Lighthouse budgets are report-only (`lighthouserc.js`) — enforce
  once the preview is stable. Book a pen test; run a k6 load test on `/jobs`.

## 6. Cutover

- **[owner]** Rolling Release 5 → 25 → 100% over 48 h. DNS apex → Vercel. Then
  decommission the legacy `Joblify-backend` (Render) and archive Mongo Atlas.
