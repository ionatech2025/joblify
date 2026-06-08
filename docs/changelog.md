# Changelog

## 2026-06-08 — Next.js 16 platform: feature completion, money-path tests, design system (PR #19)

Branch `feat/web-nextjs16-replatform` takes the production `apps/web` platform to
a launch-ready state. Every change was verified per commit — **typecheck · lint ·
Vitest (46 unit tests) · `next build`** — and CI (`web` + `gitleaks`) is green.

### Product loops — both sides complete end-to-end

- **Jobseeker:** résumé upload (Vercel Blob client-upload + `registerResume`
  action so it works without the webhook in dev), search → JD → apply → track,
  **saved jobs**, **saved searches + digest alerts**, **recently-viewed**,
  profile (+ AI bio coach), notifications.
- **Company (self-serve):** onboarding (`/employer-setup` → CompanyProfile,
  promotes `userType=COMPANY`), post → **edit** job, **applicant pipeline board**
  (stages, cover letter, recruiter notes), settings + logo upload.

### Discovery / SEO

- URL-driven `/jobs` search: shareable/bookmarkable filters, pagination, sort
  (Algolia replicas w/ relevance fallback), salary range, rich result cards.
- JD enrichment: company logo, skill pills (in the cached PPR shell, indexable),
  Suspense-streamed "similar jobs".
- Fixed the applications list to link by **slug** (was job id → 404).

### AI money paths + test coverage

- apply → `runResumeParse` + `runMatchScore` via `after()`; match badge on the JD.
- New CI-runnable integration tests (mocked db/vendors) closing the audit's
  ~5%-coverage gap on the critical spine:
  `tests/unit/{ranking,match-score,apply,webhooks-resend,digest-email,retention,saved-search}.test.ts`.

### Design system

- **Tailwind 4** + primitives (`Button/Container/Card/Badge/Input/Textarea/
  Select/Field`), preflight + a base-typography layer, responsive throughout
  (mobile hamburger, stacking grids, scrollable tables/boards). Entire app
  migrated off inline `style={}` except `global-error.tsx` (intentionally inline
  — it replaces the root layout when that crashes, so it can't rely on the CSS).

### Security

- `gitleaks` allowlist (`.gitleaks.toml`, path-scoped) for the **format-valid CI
  dummy auth keys** in `ci.yml`/`DEPLOYMENT.md` (the build needs a decodable
  `pk_test_` for the `<ClerkProvider>` prerender; `sk_test_…` is a placeholder
  that trips the Stripe rule) — false positives, not real secrets.
- **Open action (repo owner, out-of-band):** rotate the historical `ce37671`
  MongoDB Atlas + JWT/SESSION dev credentials — runbook in `docs/SECURITY.md`.
  HEAD is already placeholdered; the value survives only in history.

### Schema additions

Fold into the initial `prisma migrate dev` (greenfield): `JobApplication.recruiterNotes`,
`AuditAction.APPLICATION_NOTE_SAVED`, `SavedJob`, `SavedSearch`.

### Invariants established

Every state-changing Server Action is `requireRole`/tenancy-gated, Zod-validated,
`withAudit`-wrapped, and invalidates caches via `updateTag`. The apply path adds
BotID + per-user rate limiting. Workflows are idempotent and run via `after()`.

**PR:** #19.
