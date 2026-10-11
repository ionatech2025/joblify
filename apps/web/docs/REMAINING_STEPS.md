# Remaining steps

Single source of truth for what's NOT done. Cross-references every `TODO(week-N)` in code, every manual provisioning item, and every deferred V1.5 / V2 scope item.

Updated 2026-10-10 (hardening pass — see the first section).

---

## 2026-10-10 hardening pass — what changed, and what is still on you

A full audit (security, privacy/compliance, AI, supply chain, ops) was run against the code and the
current standards, and the repository-side findings were fixed. Everything below is in the working
tree; **the items under "Needs you" cannot be closed by a code change** and are what is left before
real traffic.

### Closed in code (verified: typecheck, lint incl. type-aware `no-floating-promises`, 667 unit tests, production `next build`, bundle budget)

| Area                 | Change                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data exposure        | Résumés / generated CVs moved to a **private** Blob store, served only by the authenticated `/api/v1/resumes/[id]/file`. GDPR export is streamed to the requester (no stored copy, no link). Deleting a résumé / account removes the **file**.                                                                                                                                                                                      |
| SSRF / arbitrary URL | Client URLs are names, not fetch targets: host + prefix pinned, existence confirmed via the store, persisted values come from the store. Workflow reads via SDK. Logo URLs in the profile form are ignored unless ours.                                                                                                                                                                                                             |
| Dependencies         | `next` 16.2.7→16.4.0 (3 critical, 5 high advisories), `@vercel/blob` 0.27→2.8, `file-type` 19→22, `vitest` 2→5 (+`vite`), `mammoth`/`pdf-parse`/`@ai-sdk/gateway` removed (→ `fflate`, `unpdf`, `createGateway` from `ai`). Production closure: 74 advisories (3 critical, 33 high) → 0 critical, 2 acknowledged high (build/CLI-time; no compatible fix) and 8 moderate (OpenTelemetry via `@sentry/nextjs@9`, `uuid` via `svix`). |
| AI correctness       | Embeddings are now 1536-wide and **validated** (the previous `text-embedding-3-large` returned 3072 and every write failed silently); model slugs use the Gateway's canonical dotted ids; provenance columns; no cross-model comparison; sweeps fill in missing/stale scores.                                                                                                                                                       |
| AI safety            | Résumé/JD/bio text fenced + sanitised; heuristic fallback no longer invents titles/years and is re-parsed by the model later; bio coach has a body schema, role allow-list and size caps.                                                                                                                                                                                                                                           |
| Email                | Explicit `digestOptIn` (cookie banner no longer enrols anyone), signed one-click unsubscribe + RFC 8058 headers, preference toggle, suppression honoured on status mail, CAN-SPAM postal line; digest refuses to send without an unsubscribe.                                                                                                                                                                                       |
| Authz / integrity    | Verification gates fail closed (post, update-publish, apply); Clerk org membership no longer promotes to COMPANY; WITHDRAWN is candidate-owned; chat no longer shows other candidates' e-mail; chat links https-only.                                                                                                                                                                                                               |
| XSS                  | JSON-LD escaped (`safeJsonLd`); `'unsafe-eval'` dev-only in CSP.                                                                                                                                                                                                                                                                                                                                                                    |
| Ops                  | Rate limiter never "off" (in-process fallback); health report gated; view beacon limited + consent-aware + keyed/salted IP hash; previews no longer run `migrate deploy`; reconcile window matches the daily cron; floating promises fixed.                                                                                                                                                                                         |
| Privacy              | Audit log purged (IP/UA 90 d, events 1 y — was never purged); deleted companies' jobs close at once; drafts cleared on identity change; Sentry Replay waits for consent; honest processors/privacy/AI pages.                                                                                                                                                                                                                        |
| SEO / pay            | Pay period + country on postings; JobPosting markup emits the right `unitText`, `addressCountry`, `applicantLocationRequirements`, `directApply`; search filters compare annualised pay; `robots.txt` blocks AI-training crawlers (flip with `ROBOTS_ALLOW_AI_TRAINING`).                                                                                                                                                           |
| Trust & safety       | "Report this job" on postings (rate-limited, one report per reporter per job); admin queue on `/admin` to dismiss or remove (archives the job, tells the company, de-indexes it); both audited.                                                                                                                                                                                                                                     |
| Platform             | `middleware.ts` → `proxy.ts`; `runtime='edge'` removed from OG routes (Next 16.4 rejects it with `cacheComponents`); `partialPrefetching` pinned `false`; Server Action body limit 4 MB (logos up to 2 MB were being rejected by the 1 MB default).                                                                                                                                                                                 |
| CI                   | Actions pinned to SHAs, least-privilege token, Node 24 + Bun pinned, `bun audit` gate, Dependabot, no shell interpolation of event data.                                                                                                                                                                                                                                                                                            |

### Needs you (cannot be done from the repo)

1. **Provision the two Blob stores** — `vercel blob create-store <name> --access private` (résumés) and a
   **public** one connected with env prefix `BLOB_PUBLIC` (logos). Résumé and logo uploads **fail closed
   in production until these exist** (there is no base64 fallback there any more). Then delete the old
   public store after confirming nothing needs it (it holds earlier résumés/exports at public URLs).
2. **Apply the six new migrations** (all expand-only; they run on the next _production_ deploy):
   `20261010120000_embedding_provenance_and_match_audit`, `…121000_email_digest_opt_in`,
   `…122000_job_salary_period_and_country`, `…123000_audit_action_job_reported`,
   `…123100_audit_action_job_report_resolved`, `…123200_job_reports`. Everyone starts with `digestOptIn = false` (correct — no
   one gave valid consent), so the digest sends nothing until people opt in.
3. **Production env** (see `.env.example`): `KV_REST_API_*` (Upstash), `CLERK_WEBHOOK_SECRET`,
   `RESEND_API_KEY` + `EMAIL_FROM`, `SENTRY_DSN`, `AI_GATEWAY_API_KEY`, `ALGOLIA_SEARCH_API_KEY` (a
   search-only key), `EMAIL_UNSUBSCRIBE_SECRET`, `EMAIL_POSTAL_ADDRESS`, `HEALTH_TOKEN`, the
   `NEXT_PUBLIC_*_EMAIL` / controller / region values. `reportCriticalEnv` prints one `[config]` line per
   missing item in production.
4. **Clerk production instance** (still on development keys — see §0b). Add the `clerk.<domain>` origin
   to the CSP `script/connect/frame-src` at the same time.
5. **Database region ↔ function region.** The configured Neon host is `us-east-1`; docs previously said
   EU. Pick deliberately, co-locate, then publish via `NEXT_PUBLIC_REGION_*`.
6. **Per-preview Neon branches** (Neon integration setting). Until then previews no longer migrate,
   so a preview built against a database that is behind the new schema will error on the new columns.
   Set `ALLOW_PREVIEW_MIGRATE=1` only on previews that have their own branch.
7. **Vercel plan.** Daily cron + single region is the Hobby plan, which is non-commercial; Pro is also
   what unlocks `AI_GATEWAY_ZDR` and multi-region.
8. **Rotate the credentials leaked in git history** (§1 below) — a history rewrite does not revoke them.
9. **Legal**: DPIA, DPAs, controller identity, counsel review of `legal/*`, bias test of the match
   score (see COMPLIANCE.md "Open items").
10. **Run `next build`/e2e with real Clerk + DB secrets** — this pass verified everything that can be
    verified without them (unit, type, lint, build, bundle budget). Authenticated Playwright suites
    still self-skip without `E2E_*`.

### Found by the live verification, not fixed in code (2026-10-10)

Measured against the production URL; the fixed items are in the changelog. These are the ones
that need a decision or a feature-sized change:

| Finding                                                                                            | Evidence                                                                                                                                                                                                                  | Suggested fix                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`<title>`/description are streamed into `<body>` for browsers**                                  | Lighthouse SEO flags `meta-description` on JD pages (92). Googlebot and the AI answer crawlers now get them in `<head>`; browsers and Lighthouse's UA still stream by design.                                             | Accept, or set `htmlLimitedBots: /.*/` to make metadata blocking for everyone (costs first paint on dynamic routes).                                                                    |
| **Unknown job slug is HTTP 200** (404 UI + `noindex`)                                              | Documented contract in `critical-paths.spec.ts`: PPR commits the shell before the streamed body can `notFound()`.                                                                                                         | Accept; `noindex` covers the soft-404 risk.                                                                                                                                             |
| **Forms render empty in the server HTML** (react-hook-form fills uncontrolled fields on hydration) | Live probe on `/company/settings`: the "About" textarea is `""` until ~1 s after load; text typed before then is overwritten/merged with the saved value. Same pattern on the profile, edit-job and résumé-builder forms. | Pass the saved value as `defaultValue` (and `defaultChecked`) next to `register()`, or disable the fieldset until hydrated. Matters most on slow phones, where hydration takes seconds. |

### Deliberately deferred (with the reason)

| Item                                                                             | Why not now                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma 7, Clerk 7, Sentry 11, AI SDK 7, Zod 4, TypeScript 7, ESLint 10, Resend 6 | Each is a breaking major that needs live verification against its service (auth flows, DB adapters, Replay/tracing config). None carries a known high/critical advisory after this pass; the residual moderates are `@sentry/nextjs@9`'s OpenTelemetry instrumentation and `svix`'s `uuid`. Do them one PR at a time. Dependabot is configured to leave Prisma/Clerk/Zod majors to you. |
| Hash/SRI-based strict CSP                                                        | Needs build-time hashes for Next's inline bootstrap; the Report-Only policy is collecting the list. A blind switch would break the site.                                                                                                                                                                                                                                                |
| `partialPrefetching: true`                                                       | Changes prefetch behaviour; pin is explicit. Enable with the e2e + payload budget re-run.                                                                                                                                                                                                                                                                                               |
| Company seats / roles / SSO                                                      | A product feature (needs an Organization model), not a fix; the authorisation model today is one `User` per company.                                                                                                                                                                                                                                                                    |
| AV scanning of uploads                                                           | Needs a vendor/integration decision; mitigated by attachment-only serving + isolated, budgeted parsing.                                                                                                                                                                                                                                                                                 |
| Global Privacy Control, `security.txt`, Google Indexing API                      | Need a policy decision / real contact / Google credentials respectively.                                                                                                                                                                                                                                                                                                                |
| Workflow DevKit (durable steps)                                                  | `after()` jobs are idempotent and swept; the GA runtime is the right next step but is a rewrite of every workflow's trigger.                                                                                                                                                                                                                                                            |

## P0 — must do before ANY production traffic

### 0a. Production is missing most of its service env — the app 500s on every dynamic route

**Found 2026-08-28 from the live console + `vercel logs`.** Every server-rendered
route on `joblify-tau.vercel.app` returns 500. The browser only shows React's redacted
"An error occurred in the Server Components render" paragraph; the real error is in the
function log:

```
Error: An error occurred while loading instrumentation hook:
  Missing security-critical env vars: CLERK_WEBHOOK_SECRET,
  UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
Node.js process exited with exit status: 128
```

Two separate faults, both now fixed in code — but the env is still missing and must be
provisioned:

1. `lib/env.ts` threw from `instrumentation.ts#register()`. That hook runs on every
   serverless **cold start**, not at build time, so instead of "failing the deploy" as its
   comment claimed it killed the process on every request. An onboarding submit was
   observed writing the profile and logging `job seeker onboarding completed` — and then
   exiting 128 before the redirect, so the user's data changed and they saw an error. It
   now reports and returns; every consumer of these secrets already fails closed on its
   own (cron auth 500s, both webhooks 500 before signature verification, rate limiting
   degrades to a no-op).
2. The schema demanded `UPSTASH_REDIS_REST_*` while `.env.example` and `lib/ratelimit.ts`
   both use `KV_REST_API_*` — so following this repo's own example file could never
   satisfy the check. Either naming is now accepted, in both places.

**`vercel env ls production` currently has only:** `DATABASE_URL`,
`DATABASE_URL_UNPOOLED`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `CRON_SECRET`,
`RESEND_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`.

Still to add (Production scope):

| Var                                     | Source                      | Without it                                                                                            |
| --------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Marketplace install | **No rate limiting at all** — apply, post-job, invite, chat, search and the AI routes are unthrottled |
| `CLERK_WEBHOOK_SECRET`                  | Clerk dashboard → Webhooks  | User mirroring falls back to lazy `provisionFromClerk`; profile edits in Clerk never reach Postgres   |
| `RESEND_API_KEY`, `EMAIL_FROM`          | Resend                      | No application confirmations, no digest                                                               |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`  | Sentry                      | No error reporting — which is why this outage had to be found by hand                                 |
| `AI_GATEWAY_API_KEY`                    | Vercel AI Gateway           | Resume parse, JD skills, bio coach, match score all fail                                              |
| `BLOB_READ_WRITE_TOKEN`                 | Vercel Blob                 | Resume and logo uploads fail                                                                          |
| `ALGOLIA_*`                             | Algolia                     | Search falls back to Postgres                                                                         |

### 0b. Clerk is running on development keys in production

The live console shows _"Clerk has been loaded with development keys"_, and the OAuth
callback logs six `postMessage` origin mismatches — the frontend API is
`*.clerk.accounts.dev` while the app is served from `joblify-tau.vercel.app`. Development
instances carry strict usage limits. See [CLERK-PRODUCTION.md](../../docs/CLERK-PRODUCTION.md);
remember to add the production `clerk.<domain>` to `script-src`/`connect-src`/`frame-src`
in `next.config.ts` at the same time.

**Measured on the live site, 2026-10-10 (Lighthouse 13.5, mobile preset, 14 runs).** This is
now the single largest item on the performance and Best Practices scores, not a licensing
footnote:

- **Every first visit is a four-hop redirect** — `/` → `…clerk.accounts.dev/v1/client/handshake`
  → `/?__clerk_handshake=…` → `/` — which Lighthouse's `redirects` audit prices at
  **1.9–2.5 s** of the critical path on every page. It is why LCP is 3.9–4.3 s on `/jobs`,
  `/sign-in` and `/sign-up` (TTFB 1.6–2.4 s of that). A production instance serves the
  frontend API from `clerk.<domain>` on the same site, so a signed-out first visit needs no
  handshake.
- **Two third-party cookies** are set whenever clerk-js runs, which is what held Best Practices
  at **77** (`third-party-cookies`, `inspector-issues`; 100 is otherwise within reach). Since
  2026-10-10 clerk-js no longer runs on pages without a Clerk widget, so they are gone from
  those; they remain on `/sign-in`, `/sign-up` and for signed-in visitors. First-party on a
  production instance.
- **Fixed in code (2026-10-10):** `clerk-js` was ~0.8–1.1 s of main-thread time at 4× CPU and
  305 KB over eight requests on every public page, because `ClerkProvider` wrapped the whole
  tree. Clerk now loads only on pages with a Clerk widget (sign-in, sign-up, and the avatar menu
  of a signed-in visitor) — see `app/components/clerk-host.tsx`. What the keys still fix: the
  handshake redirect on _every_ document request while the instance is a development one, and
  the cookies on the pages that do load Clerk.

### 0c. Vercel Web Analytics is not enabled for the project

`/_vercel/insights/script.js` 404s and returns the HTML error page, so the browser
reports a MIME-type refusal. `<Analytics />` mounts only after consent, so this is noise
rather than breakage — enable Web Analytics on the project, or drop the component.
Speed Insights loads from the same path shape and is presumably in the same state, which
is worth knowing given `app/components/web-vitals.tsx` now reports field CWV to Sentry
independently.

### 0. Apply pending migrations to the database in `.env.local`

Discovered 2026-07-30. The Neon database that `.env.local` points at is **behind on
migrations** — `users.lastDigestAt` does not exist, so every query that pulls the `company`
→ `User` relation fails at runtime with Prisma `P2022`:

```
The column `users.lastDigestAt` does not exist in the current database.
```

That column comes from `prisma/migrations/20260724120000_digest_watermark_and_parse_attempts`.
Concretely it breaks `getFeaturedJobs()`, so the home page's featured-jobs island and the
JD click-through it feeds cannot render, and two E2E tests fail for that reason alone.

```bash
cd apps/web
bunx prisma migrate status     # confirm which migrations are pending
bunx prisma migrate deploy     # needs DATABASE_URL_UNPOOLED (pooled PgBouncer can't run DDL)
```

**Check which database you are pointed at first.** If `.env.local` was populated by
`vercel env pull`, it holds _production_ credentials — run `prisma migrate status` before
anything, and prefer a Neon branch for local work. Since `prisma migrate deploy` runs in
the Vercel build (`vercel.ts` `buildCommand`), a deployed environment should already be
current; a drifted database means someone is pointing local dev at a database that has
never been through that build.

### 1. Rotate the leaked credentials and scrub git history

The Mongo Atlas URI + JWT secret from the legacy `Joblify-backend/.env.example` are still recoverable from git history (the directory itself has been removed from the working tree, but history retains every prior revision). The Mongo URI shared earlier in our conversation is also in the chat transcript.

Steps:

```bash
# 1. Rotate the Atlas password in MongoDB Atlas dashboard
#    Database Access → user `joblify` → Edit Password → generate new
#    Also rotate any prior Atlas user (`allan`) that may still exist.

# 2. Rotate the JWT secret (if the legacy Render deployment is still live)
openssl rand -base64 48

# 3. Scrub history
#    Populate /tmp/replacements.txt with the OLD values you want removed,
#    one per line in this shape (do NOT commit this file):
#       <old-secret-value>==>REDACTED
#    The old values to scrub live in prior git revisions of
#    Joblify-backend/.env.example (view with: git log --all -p -- 'Joblify-backend/.env.example').
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

| File                      | What                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `lib/search/index-job.ts` | Implement a real `index_outbox` table + writer; cron drains it. Current behavior is fire-and-forget + reconcile-only. |

### Week 12 — Phase 4 UX-completeness audit (2026-07-31, closed out 2026-07-31)

Four flows audited end-to-end (jobseeker core loop + resume, company/hiring,
subscribe→invite→chat, GDPR + notifications) against a 7-point checklist
(toasts, empty states, destructive confirms, inline error surfacing, skeleton
parity, back/forward state, `aria-current`). ~110 findings; see
[changelog.md](./changelog.md) for the full findings table. Every item this
table originally tracked is now fixed:

- **Withdraw application** — `withdrawApplication` (`app/actions/apply.ts`) +
  `useWithdrawApplication` mutation hook + a confirm-gated button on
  `applications-list.tsx`.
- **Resume parse failure UX** — `Resume.parseFailedAt`/`parseError` columns
  (migration `20260730234110_resume_parse_failure_tracking`), written by the
  algolia-reconcile cron once `MAX_PARSE_ATTEMPTS` is hit, surfaced in
  `resume-manager.tsx` as a real "couldn't parse" state with recovery
  guidance instead of infinite "Processing…".
- **PlanTier gating inconsistency** — `assertPlan(user, 'PRO')` added to
  `inviteJobseeker`, `openJobChatArea`, `openVirtualInternChatArea`, matching
  `share-job.ts`/`addChatParticipant`'s existing enforcement. No live effect
  today (every account still defaults to `PRO`). Note this is narrower than
  issue #52, which is specifically about _application tracking_ having no
  gate — that's still open, unrelated to this fix.
- **Remaining bare-form mutations** — chat-area creation, `addChatParticipant`,
  and invite/share/add-to-VI-chat all converted to client components with
  toast + pending state (`chat-area-button.tsx`, `add-participant-button.tsx`,
  `share-job-form.tsx`, `invite-buttons.tsx`).
- **Draft persistence** — added to `post-job-form.tsx`, `profile-form.tsx`,
  `employer-setup-form.tsx`, `company-settings-form.tsx`, mirroring
  `apply-draft.ts` but with a flat (non-keyed) store per form and RHF
  `watch`/`reset` wiring instead of controlled inputs.
- **Skeleton shape mismatches** — dedicated `loading.tsx` added for all 10
  routes originally listed (employer-setup, post-job, edit-job, company
  settings, applicants board, both chat-detail routes, onboarding, profile,
  resume builder), reusing shared skeleton components where the real page
  itself reuses a component (`job-form-fields-skeleton.tsx`,
  `chat-thread-skeleton.tsx`, `applicants-board-skeleton.tsx`).
- **`applicants-board.tsx` sort/filter state** — now URL-synced via
  `useSearchParams`/`router.replace`, matching `company/jobseekers/page.tsx`'s
  existing pattern.
- **Sign-up/sign-in Suspense fallback** — replaced `fallback={null}` with a
  shared `AuthFormSkeleton`.

### Week 11 — hardening (remaining)

| Item                                | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Collapse the `/dashboard` hop       | `/dashboard` exists only to read `User.userType` (plus, for job seekers, whether a `JobSeekerProfile` exists) and redirect. Every sign-in, every sign-up, and every click of the header's "Dashboard" link therefore pays a whole extra navigation — middleware, layout gate, page, database, redirect — to render nothing. Clerk's documented pattern removes it: mirror `userType` and an `onboarded` flag into the user's `publicMetadata` (from the existing `user.created`/`user.updated` webhook, plus `after()` in `completeJobSeekerOnboarding` and `createCompanyProfile`), expose them on the session token, and have `middleware.ts` redirect straight to the right workspace. **Not done in the 2026-08-28 payload pass**, deliberately: session claims only carry `publicMetadata` once a custom claim is added in Clerk Dashboard → Sessions → Customize session token, which is a console change, not a code one — shipping the code alone would add a Backend API write per onboarding and change nothing. Treat the claim as an optimisation hint only, never as authorization: keep the `/dashboard` page as the fallback for missing or stale claims (a user who just onboarded may still hold a token that says otherwise), and keep every real check on the database. |
| DB migration in CI                  | Run `prisma migrate deploy` before Vercel promotes. **Blocked:** no public Postgres image bundles both PostGIS and pgvector — use a custom image or a managed Neon CI branch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| CSP hardening                       | **Stale row corrected (2026-08-28):** the flip to enforced `Content-Security-Policy` shipped long ago — this row said otherwise, which is what stopped anyone asking _what_ got enforced. The enforced policy carries `'unsafe-inline'` **and** `'unsafe-eval'` on `script-src`, the pair that makes a CSP stop mattering for XSS. The textbook fix (per-request nonce + `strict-dynamic`) is **incompatible with `cacheComponents`**: Next reads the nonce off the request's CSP header, so a nonce is request data and opts every route out of prerendering. The exit path is therefore **hashes**, not nonces (a hash also disables `'unsafe-inline'`, and is static so it survives a prerender) — needs stable build-time hashes for Next's inline bootstrap plus `ThemeScript`. Done meanwhile: `img-src` no longer allows every https origin, and the strict target policy now ships as `Content-Security-Policy-Report-Only` reporting to Sentry, so the list of inline scripts that would break is being collected.                                                                                                                                                                                                                                                                |
| Lighthouse budgets (enforce)        | Accessibility now asserts `error` at a 0.90 floor and the blocking `axe` job runs the Playwright axe spec on every preview (2026-07-24, #42). **Correction (2026-07-30):** that job had never actually tested the app — every preview deployment sat behind Vercel Deployment Protection (SSO), so both the axe spec and LHCI were scoring/scanning Vercel's own auth-gate redirect page, not the real content. `playwright.config.ts` and `lighthouserc.js` now send `x-vercel-protection-bypass` from a `VERCEL_AUTOMATION_BYPASS_SECRET` repo secret when set; no-op locally. First-ever real result on PR #49. Remaining: raise the a11y floor to 0.95 and flip performance/best-practices/SEO to `error` once their gaps close (SEO 0.82→0.95). (INP is a field-only metric, omitted from the lab assertions — and since 2026-08-28 it _is_ collected in the field: `app/components/web-vitals.tsx` reports Core Web Vitals to Sentry as metric-name-and-number only, outside the consent gate that keeps Vercel Speed Insights on the accepting minority of sessions.)                                                                                                                                                                                                               |
| A11y on authenticated surfaces      | **Done (2026-07-30):** `tests/e2e/a11y.spec.ts` now scans every page in **both themes**, and adds `/jobseeker/*` + `/company/*` + the resume builder via the `setup` project + `storageState`. They skip without `E2E_TEST_*`, so wiring those creds into CI (see the row above) is what actually turns the gate on. Remaining: the applicants board needs a stable seeded job id to be a static path. Refs #42.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `next/image` migration              | `images.remotePatterns` is already configured for Vercel Blob + Clerk avatars + Pixabay, and the design system has landed, so nothing blocks it. ~5 raw `<img>` with `eslint-disable @next/next/no-img-element` remain (header/footer brand mark, company logos, avatars).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Synthetic check + PagerDuty         | Vercel Cron hitting `/api/v1/health` every 5 min, paging on 3 consecutive failures.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Rolling Release auto-rollback       | Configure auto-rollback policy in Vercel based on error rate.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| AV scan                             | Cloudmersive integration in `resume-parse.workflow.ts` if resume volume crosses 1k/day.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Re-index script                     | `scripts/reindex-all.ts` to rebuild Algolia from scratch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `middleware.ts` → `proxy.ts`        | **Done 2026-10-10** — renamed; the build no longer warns.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Clerk v7 upgrade                    | `app/components/clerk-provider.tsx` exists only because @clerk/nextjs v6's provider reads `usePathname()` during render, which under cacheComponents forced the entire tree dynamic (#38). v7 dropped that read — upgrade `@clerk/nextjs`, delete the wrapper (and the now-direct `@clerk/clerk-react` dep), and restore the library's own provider. Carry the light/dark `appearance` sets over when you do.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Verify Clerk dark mode on a preview | `clerk-provider.tsx` now ships light + dark `appearance` variable sets (2026-07-30), but **this cannot be checked locally**: a no-vendor run uses a placeholder publishable key that clerk-js rejects, so no Clerk markup renders on `/sign-in` or `/sign-up` at all. On the next preview with a live key, eyeball `<SignIn>`, `<SignUp>` and the `<UserButton>` popover in dark mode and confirm the axe dark scan of those two routes still passes with the form actually present. The values are concrete hex duplicated from `globals.css` — see the token-coupling note in [DESIGN.md](./DESIGN.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

---

### Audit remediation, 2026-08-28 — closed

A full-project engineering + UX audit found sixteen gaps that every existing
gate reported as green. All sixteen are closed; the ones that changed a shared
contract are worth knowing about before writing new code:

| Gap                                                                                                               | What changed                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server-action error messages were replaced in production by React's redaction paragraph                           | **New contract.** Expected failures RETURN `ActionResult` (`lib/action-result.ts`); only auth/DB faults throw. 13 actions converted, 14 call sites use `unwrap()`. `app/actions/chat.ts` had already written this rule down and was the only file following it. |
| BotID guarded the apply funnel with no client half                                                                | `withBotId()` in `next.config.ts` + `initBotId()` in `instrumentation-client.ts`. It had been forming a verdict on no signal.                                                                                                                                   |
| CSP permitted inline script and eval                                                                              | See the CSP row above.                                                                                                                                                                                                                                          |
| `/company/*` prerendered an empty skeleton on all 8 routes                                                        | Layout made sync with a sibling `RoleGate`, same transform as `(authenticated)` and `jobseeker`. "Recruitment"/"Talent" now appear in the built HTML; they appeared 0 times before.                                                                             |
| Every keystroke wrote to `localStorage` synchronously, re-rendered the form, and rebuilt its own RHF subscription | `lib/use-form-draft.ts` — selectors, stable deps, debounced write, flush on unmount. Use it for any new draft-backed form.                                                                                                                                      |
| React Compiler was off while lint reported its bailouts                                                           | `reactCompiler: true`. All five bailouts (react-hook-form `watch()`) were cleared first. Keep them at zero.                                                                                                                                                     |
| The applicants board loaded every application with three joins, unpaginated                                       | `BOARD_CAP` + `select` instead of `include`. Caps added to five other growth-unbounded lists.                                                                                                                                                                   |
| WCAG 2.2 SC 1.3.5 — two `autoComplete` attributes app-wide, both `"off"`                                          | Tokens on every field about the user. axe cannot catch a _missing_ autocomplete; `tests/unit/components.test.tsx` asserts it instead.                                                                                                                           |
| WCAG 2.2 SC 2.4.11 — three stacked sticky bars, no scroll padding                                                 | `scroll-padding-top` on `html`, with a `:has(.o-console)` override for the console's three bars.                                                                                                                                                                |
| Locale-less dates: hydration mismatch in 5 client components, UTC for everyone elsewhere                          | `app/components/ui/timestamp.tsx`. There were zero `<time>` elements in the app.                                                                                                                                                                                |
| Three rate limiters defined and never called                                                                      | Removed (`signup`/`signin` are Clerk-hosted; a global cap belongs at the edge). `bioCoachLimit` and `uploadSignLimit` added and wired.                                                                                                                          |
| 277 tests, none rendering a component                                                                             | jsdom + testing-library; `tests/unit/components.test.tsx`. **It immediately found a real defect:** `Field` and `SheetField` wrapped the control in `<label>`, folding the hint and error text into every control's accessible name. Fixed to `htmlFor`/`id`.    |
| Coverage configured but ungated                                                                                   | `bun run test:coverage`, thresholds in `vitest.config.ts`, wired into CI. A ratchet, not a target.                                                                                                                                                              |
| Command palette had `aria-modal` but no focus trap                                                                | Tab containment added. Everything else about it was already correct.                                                                                                                                                                                            |

### Console (Odoo register) — deliberately not built, 2026-08-26

Landed with the console design pass; each was skipped for a stated reason, not
missed. See [DESIGN.md](./DESIGN.md#console-primitives).

| Item                              | Why not now                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List-view row selection           | Odoo's checkboxes exist to drive bulk actions. No bulk mutation exists server-side, so the control would render and do nothing. Add both together.               |
| Chatter / activity log on records | `JobApplication.recruiterNotes` is a single overwritten string. A threaded log needs a model (`ApplicationNote`) plus a writer — a data change, not a component. |
| Drag-and-drop kanban              | Skipped in favour of the one-click stage stepper, which is keyboard-operable without a parallel a11y implementation. Revisit only with a real keyboard story.    |
| Clickable kanban progress bars    | Odoo's segments filter the column. Presentational here; needs URL plumbing per board.                                                                            |
| Console surfaces in the axe gate  | `a11y.spec.ts` already lists them, but they only run where Clerk creds exist. Unverified locally — see the note below.                                           |

**`tests/e2e/console-design.spec.ts` has still never executed.** It is written (9
tests) and now wired into the `e2e` job in `.github/workflows/lighthouse.yml`, but that
job — and the 20 authenticated scans in the `axe` job — self-skip until these repo
secrets exist:

| Secret                              | Needed by                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `E2E_TEST_PASSWORD`                 | `auth.setup.ts` password sign-in                                                                                                             |
| `E2E_TEST_EMAIL_JOBSEEKER`          | jobseeker fixture account (must be a `+clerk_test` address)                                                                                  |
| `E2E_TEST_EMAIL_COMPANY`            | company fixture account (same)                                                                                                               |
| `CLERK_SECRET_KEY`                  | `clerkSetup()` minting the dev-instance testing token                                                                                        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | same                                                                                                                                         |
| `E2E_DATABASE_URL`(`_UNPOOLED`)     | `fixtures.ts` seeding cross-account rows — **must be the database the preview deployment reads**, or the fixtures aren't the rows under test |
| `BLOB_READ_WRITE_TOKEN`             | optional; only the GDPR-export test needs it                                                                                                 |

Locally the `setup` project cannot complete at all — `Clerk.loaded` never becomes true,
and `setup` is a hard `dependencies` entry, so one failure means every spec reports "did
not run". The
unauthenticated `design-regression.spec.ts` was run serially against a local prod build:
10 pass, 3 fail on the pre-existing PPR duplicate-DOM pattern (`.first()` resolving to
the copy inside React's `<div hidden>` streaming placeholder) in spec code this pass did
not touch.

## V1.5 — explicitly deferred features

Don't sneak these into V1. They land after Week 12 cutover + 4-week stability period.

| Feature                                                        | Why deferred                                                                                                                           | Notes                                                                                                                                                                                                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Realtime chat transport                                        | Chat areas (job-specific + virtual-intern) shipped 2026-07-03 as request/response Server Actions                                       | Only the push transport (SSE/WebSocket) remains deferred; messages currently appear on submit/reload                                                                                                                                                |
| Recruiter AI screening summaries                               | Most expensive AI feature                                                                                                              | Defer until paying recruiter customers exist                                                                                                                                                                                                        |
| Saved-search alerts with diff                                  | Cron + diff complexity                                                                                                                 | V1 has a simple daily digest of new jobs                                                                                                                                                                                                            |
| AI vector reranking on search                                  | Marginal gain at 10k MAU                                                                                                               | Add when search CTR plateaus                                                                                                                                                                                                                        |
| Public `/jobseekers` listing                                   | Company-facing directory shipped 2026-07-03 (`/company/jobseekers`: PUBLIC profiles + subscribers, type filters, invite/share actions) | An unauthenticated public listing still needs UX + SEO thought                                                                                                                                                                                      |
| Mobile native client                                           | `/api/v1/*` is ready when this ships                                                                                                   | iOS + Android with shared Route Handlers                                                                                                                                                                                                            |
| Personalization ("jobs like ones you applied to" — behavioral) | Needs behavioral data                                                                                                                  | Collect via `JobView` for V1; mine in V1.5. Note: a _content_-based variant (resume↔job embedding similarity) shipped as `/jobseeker/matches` — this line is specifically about interaction/behavioral signals, which is a separate, still-open gap |
| Feature flags / A/B test framework                             | Need traffic first                                                                                                                     | Use Algolia A/B for search ranking; build app-side later                                                                                                                                                                                            |
| Per-user TZ for daily digest                                   | Single 08:00 UTC is good enough at beta scale                                                                                          | V1 sends all at the same time                                                                                                                                                                                                                       |
| i18n (es, fr, pt, ar with RTL)                                 | English-only for beta                                                                                                                  | When markets demand it, see [FRONTEND.md](./FRONTEND.md) §i18n                                                                                                                                                                                      |
| Radix (accessible primitives)                                  | The hand-rolled primitives in `app/components/ui/` cover current needs                                                                 | Tailwind 4 is already adopted; add Radix only if a future component (combobox, accessible modal) outgrows the hand-rolled version                                                                                                                   |

---

## V2 — bigger product moves

| Feature                                                                                              | Why later                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe billing                                                                                       | The `PlanTier` model + real gates (chat area creation, chat/share outreach, application tracking) shipped — everyone defaults to `PRO` since there's no checkout yet. Actual payment collection needs a sustained user base first                 |
| Agentic multi-tool AI features (interview prep coach, application-quality reviewer, multi-turn chat) | Every AI feature today (resume parse, JD skill extraction, bio coach, match scoring) is single-shot — no tool-calling/looping. A real agentic feature needs conversation history + state + a new UI surface, which is more scope than a point fix |
| Job-board syndication (ATS integrations)                                                             | Partner integrations                                                                                                                                                                                                                              |
| White-label for enterprise                                                                           | Multi-tenancy in route group + theming                                                                                                                                                                                                            |
| Talent pool / sourcing                                                                               | New product surface                                                                                                                                                                                                                               |
| SOC 2 Type 1 audit                                                                                   | Annual, after first revenue                                                                                                                                                                                                                       |

---

## Documentation gaps

| Doc                                 | Status                                           |
| ----------------------------------- | ------------------------------------------------ |
| `apps/web/docs/README.md`           | Done — index                                     |
| `SETUP.md`                          | Done                                             |
| `ARCHITECTURE.md`                   | Done                                             |
| `FRONTEND.md`                       | Done                                             |
| `BACKEND.md`                        | Done                                             |
| `DATABASE.md`                       | Done                                             |
| `AUTH.md`                           | Done                                             |
| `AI.md`                             | Done                                             |
| `SEARCH.md`                         | Done                                             |
| `SECURITY.md`                       | Done                                             |
| `COMPLIANCE.md`                     | Done                                             |
| `OBSERVABILITY.md`                  | Done                                             |
| `TESTING.md`                        | Done                                             |
| `DEPLOYMENT.md`                     | Done                                             |
| `OPERATIONS.md`                     | Done (pre-existing)                              |
| `CUTOVER_RUNBOOK.md`                | Done (pre-existing)                              |
| `REMAINING_STEPS.md`                | This file                                        |
| `postmortems/<date>-<slug>.md`      | Created on first incident                        |
| `decisions/<date>-<slug>.md` (ADRs) | Optional; add when a non-obvious decision sticks |

---

## How to update this file

When you tick off an item, **delete the line** (don't strike-through). This file is the to-do list, not the changelog. Keep it short and current. If the team adds new TODOs in code, add them here in the same PR.

Quick audit:

```bash
git grep -n "TODO(week-" apps/web/
```

Any output above should be reflected as a row in this doc.
