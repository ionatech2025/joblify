# Changelog

## 2026-06-10 — Design-consistency sweep: ambient hero style app-wide

Palette audit findings: indigo accents were already consistent (Button/links/
focus/Badge); the landing hero's ambient canvas existed only there; `/jobs` +
the two dashboard sub-navs used a flat indigo tint; three off-palette spots —
the base `a` color in globals.css was blue-700, the Clerk widget rendered its
default blue, and the bio-coach user bubble was blue-50. Semantic colors
(green=success, red=error/danger, amber=mid-match, blue status badges, emerald
"live" dot, dark cookie banner) are intentional and unchanged.

Changes (commit in PR #19):
- New `app/components/ui/ambient.tsx` — `AmbientCanvas` (`hero`/`band`
  variants; pure CSS, aria-hidden, CLS-neutral), `AmbientBand`, `PageHeader`
  (title/subtitle/actions/width). The landing hero now renders the shared
  `hero` variant (dedupe, visual no-op).
- Every interior page title now sits in a full-width ambient **header band**
  (~25 pages: marketing, legal, jobseeker, company, account, apply); the JD and
  company-profile pages wrap their custom headers in `AmbientBand` (PPR shape
  untouched — `/jobs/[slug]` still prerenders `◐`).
- Full hero canvas on sign-in/up, error, 404, and offline pages.
- Dashboard sub-navs reverted to neutral so the title band is the single
  tinted element per screen.
- Palette fixes: base link color → indigo-700 (#4338ca); ClerkProvider
  `appearance.variables.colorPrimary = #4f46e5` (Clerk widgets on-palette);
  bio-coach bubble → indigo-50.

Verified: typecheck · lint · build green; band/canvas markup curl-verified on
11 routes locally (200s, 404 page correct, JD/company content intact).

## 2026-06-09 — First Vercel production deploy, JD prerender fix, branding + PWA

First live production deploy of `apps/web` to Vercel (`joblify` project, aliased
`joblify-virid.vercel.app`), provisioned end-to-end and verified. Typecheck · lint ·
`next build` green per change.

### Deploy / infra (Vercel)

- Provisioned **Neon Postgres** + **Clerk** via Vercel Marketplace (env auto-injected);
  set `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, and Clerk sign-in/up routing vars.
- `prisma migrate deploy` runs in the Vercel build → schema + extensions applied to
  Neon; seeded skills + demo data (`prisma db seed`, `SEED_DEMO=1`).
- `vercel.ts`: dropped `algolia-reconcile` cron to daily and removed the multi-region
  pin — both are Pro-only and blocked the Hobby-plan deploy (comments note the Pro
  values to restore). Algolia + `CLERK_WEBHOOK_SECRET` remain to be set (vendor keys).

### JD / company pages — production prerender fix (the SEO surface)

- `/jobs/[slug]` and `/companies/[slug]` awaited their per-slug DB read at the page
  top, so the build prerendered a **not-found shell** that the CDN then served (200
  body = 404) for every slug. Moved the read behind a runtime `connection()` +
  `<Suspense>` boundary (matching the home page), so the build needs no DB and pages
  render per-slug. Invisible in dev (dev doesn't prerender); only bit on Vercel.

### Branding + PWA

- Brand mark from the legacy app added to the nav and landing hero; generated
  192/512/maskable/apple-touch icons + favicon (`app/icon.png`).
- Installable PWA: `app/manifest.ts` (standalone, theme color, icons), a conservative
  service worker (`public/sw.js`: API + cross-origin bypassed, hashed assets
  cache-first, navigations network-first → `/offline` fallback), registered prod-only.

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
