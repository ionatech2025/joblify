# Changelog

## 2026-07-30 — Icon sweep + Radix theme switcher; a real contrast bug found by the axe gate

Two asks: remove every Unicode glyph standing in for an icon and replace with a proper icon
library, and give the header theme control the explicit Light/Dark/System pattern most current
apps use (GitHub, the Vercel dashboard, shadcn/ui) instead of a single button that silently
cycles. lucide-react was already the app's icon set (design system v2, below) — kept it rather
than introducing Material UI icons, which would read as a different product next to Lucide's
stroke-line style. Reached for [Radix UI Primitives](https://www.radix-ui.com/primitives)
specifically for the dropdown's accessible menu mechanics — `docs/FRONTEND.md` had already named
Radix as the intended tool "if you reach for them in the future"; this is that.

**Icon sweep.** 12 sites across 10 files were using `→`/`←`/`↗`/`✓` in JSX text — "Open →",
"Parsed ✓", "Résumé ↗", pagination "← Prev"/"Next →" — replaced with `ArrowRight`/`ArrowLeft`/
`ExternalLink`/`CheckCircle2`, matching the direction each glyph was already standing in for
(chevrons for repeated pagination, arrows for one-off "go to X"). Left alone, deliberately: the
command palette's `Kbd` footer legend (`↑↓ navigate`, `↵ open`) — those represent literal keyboard
keys, which is how every app with a command palette shows a shortcut legend, not an icon-shaped
gap.

**Theme switcher.** `ThemeToggle` was a single button that cycled light → dark → system on click
— functional, but every other place in the app already offered the three choices explicitly (the
command palette's `theme-light`/`theme-dark`/`theme-system` commands predate this change). Now a
Radix `DropdownMenu`: trigger shows the resolved icon, content lists Light/Dark/System with a
checkmark on the active one. Radix supplies roving focus, Escape, typeahead, and focus return to
the trigger — none of that is hand-rolled. `lib/ui/theme.ts`'s `nextTheme`/`themeActionLabel`
existed only to serve the cycle interaction; removed along with their unit tests once the
dropdown made them unreachable, rather than leaving them as dead exports.

**A real bug, found along the way.** The axe a11y gate flagged a serious color-contrast violation
on the home page — 128 nodes at a 1.04:1 ratio against a 4.5:1 requirement, `#fafafa` text on
`#ffffff` background. Root cause: `Badge`'s `dark` tone (the salary chip in the ticket-card
register) referenced `bg-surface-inverse text-fg-inverse` — `surface-inverse` was never a token
defined anywhere in `globals.css`'s `@theme` block. Tailwind drops unknown utility classes
silently rather than erroring, so the badge rendered with no background at all: near-white text
on the page's white canvas. Fixed to `bg-ink text-ink-fg` — the token pair that already means
"inverts with the theme, maximum contrast," which is exactly what the component's own comment
said this tone was for. Confirms the value of running the real axe gate rather than trusting the
token-naming convention by inspection alone.

Verified: typecheck · lint (0 errors) · **vitest 239/239** (244 − 5 for the removed cycle tests)
· `next build` green at 58/58 pages, 40 PPR / 3 static / 16 dynamic (unchanged) · local Chromium
e2e: the two theme-toggle-specific tests and the palette theme-switch test all pass; the home-page
tests flake intermittently on this branch's sandbox, traced to a pre-existing, already-documented
`P1001` Neon connectivity issue specific to this environment's network egress on port 5432 — not
a regression, and unrelated to any change in this entry. The axe home-page contrast failure did
**not** recur across repeated runs once the badge fix landed.

## 2026-07-30 — Design system v2: semantic tokens, dark mode, command palette, flow audit

Second pass over the four reference designs. The 2026-07 refresh (`d3ff7ad`→`e0ed167`)
had already taken the *look* — display type, ink pill CTAs, glass/ticket cards, chip
taxonomies, stat rows, split auth. What the references also showed and the app had no
vocabulary for: a theme toggle, a fully dark register, arrow-in-circle CTAs, divided stat
ledgers, sparklines in metric cards, a ⌘K palette with keyboard hints, and crafted empty
states. Full documentation: [`apps/web/docs/DESIGN.md`](../apps/web/docs/DESIGN.md).

### Token foundation

The old `@theme` was **4 properties and 3 were unused** — `--color-ink` and
`--color-brand-fg` had zero references while "ink" was hardcoded as `bg-neutral-900` at
~30 call sites; the real palette was 301 `neutral-*`, 64 `white`, 57 `indigo-*` literals.

`globals.css` now declares raw values on `:root`/`.dark` and maps them through
**`@theme inline`**, which emits `.bg-surface{background-color:var(--surface)}` — a direct
reference. (A plain `@theme` resolves the intermediate once at `:root` and dark never
reaches descendants.) Groups: surface/fg/border, `ink` (**inverts** — CTAs, active pills,
own chat bubbles), `band` (**does not invert** — footer, ticket cards, cookie banner),
brand, status, radius, elevation, glass, ambient. `green`(14)/`emerald`(4) collapsed onto
one `success`. Every literal palette class is gone from `app/**` except the palette's
intentional `bg-black/40` scrim.

`lib/cn.ts` (`clsx` + `tailwind-merge`) replaces naive className concatenation — and had
to register the custom `radius`/`shadow` theme keys, or tailwind-merge treats
`rounded-card` as unknown and keeps both sides of a conflict. Its own unit test caught
that.

### Dark mode

`lib/stores/ui.ts` had persisted a `theme` with a `setTheme` action and **zero consumers**
while `globals.css` hard-locked `color-scheme: light`. Now: `.dark` on `<html>`, applied
pre-paint by `components/theme-script.tsx` reading **localStorage only** — a cookie-backed
theme would collapse every route's static shell under `cacheComponents`. Resolution rules
in `lib/ui/theme.ts`; from `system` the toggle jumps to the opposite of what's on screen,
so the first click is always visibly different (a plain rotation lands on the value already
displayed).

### New surfaces

Command palette (⌘K) with roving focus, `aria-activedescendant` and a Kbd legend;
toast layer on the existing zustand store; `EmptyState` replacing ~20 bare
`<p>No X yet.</p>` sites, each with a real next step; `Skeleton` primitives; `IconButton`;
`Checkbox`/`Radio`/`Switch`; `Sparkline` (inline SVG, no chart runtime); `Kbd`.
Icons via `lucide-react` — the app previously had **zero** `<svg>` and no icon dependency.

Archivo + Inter self-hosted via `next/font`, so `font-src 'self' data:` is unchanged.
Replaces system-stack `font-weight: 900`, which rendered as Arial Black on Windows.

### Flow audit findings

| Finding | Resolution |
|---|---|
| A failed query in a streamed island propagated to `error.tsx` and replaced the **entire** home page — hero, CTAs and all. `<Suspense>` covers *slow*, not *throws*. | New `components/island-boundary.tsx`; wraps featured jobs, hero stats, JD match badge, similar jobs, companies list. Verified: a failing featured-jobs query now degrades to an EmptyState with the hero intact. |
| Optimistic UI rolled back **silently** on failure — save-job, saved searches, saved jobs. The row just reappeared. | Toasts on every client mutation, with the error text. Errors persist until dismissed; success self-clears. |
| Resume delete had no confirmation despite being irreversible (blob + parsed data + match scores). | `window.confirm`, matching job-delete and company-rejection. Reversible actions (un-save, unsubscribe) deliberately stay confirm-free. |
| `saved-search-list` returned `null` when empty, leaving its heading dangling with no hint how to create one. | `EmptyState` with a link to search. |
| Cookie banner was a design outlier — `rounded-md` buttons, `shadow-2xl`, the app's only `text-sky-300`. | Pills on band tokens. It can't use `<Button>`: those variants resolve against the page surface, and the banner is always on the dark band. |
| `prefers-reduced-motion` was unhandled anywhere; the cobe globe spun unconditionally. | Global base-layer clamp; the globe parks its rAF loop and renders one static frame (CSS can't reach a canvas animation). |
| Shell skeletons were byte-identical copies in two layouts; auth split-screen duplicated across sign-in/sign-up. | `components/shell-skeleton.tsx`; new `app/(auth)/layout.tsx`. |
| Five scattered enum→label→tone maps meant one status could render two colours on two screens. | `lib/ui/status.ts`. `REJECTED` is now `danger` rather than `warn`. |
| Header used raw `bg-white/70 backdrop-blur` instead of `.glass`; kept mobile-menu state in local `useState` while the store exported an unused `isMobileMenuOpen`. | Both fixed. |

**Deliberately not changed:** `aria-current` on the header nav. It needs `usePathname()`,
which at root-layout scope outside Suspense fails the build with "Uncached data was
accessed outside of `<Suspense>`" on every route — the same trap that forced
`clerk-provider.tsx` (#38). The dashboard `PillNav`s can do it because they sit inside a
Suspense-gated subtree. Server-action `<form action={…}>` submits (subscribe, invite,
share) keep progressive enhancement instead of gaining toasts.

### Tests

`design-regression.spec.ts` 6 → 12 tests: token resolution on `:root`, fonts, the
light↔dark flip repainting surfaces *and* persisting across reload, the footer band **not**
inverting, the palette (shortcut/filter/empty-state/Escape/theme), reduced motion. Still
DOM + computed-style only — no pixel snapshots, so it holds in a no-vendor local run.
Chrome-level assertions moved to `/about`: the header and footer are identical on every
route, and `/` is 20× slower and can fail for reasons unrelated to design.

`a11y.spec.ts` now scans **both themes** (dark contrast is where a token layer regresses)
and adds authed jobseeker/company pages via the `setup` project — closing the
`REMAINING_STEPS.md` gap. New `tests/unit/design-system.test.ts` (26).

### Consistency verification pass

A second sweep looking specifically for places the new system contradicted itself. Six
real defects, all fixed:

| Finding | Resolution |
|---|---|
| **Clerk's widgets are styled by their own `appearance` prop, not our tokens** — `<SignIn>`, `<SignUp>` and `<UserButton>` stayed hardcoded light, so dark mode showed a glaring white card in the middle of the split-screen auth layout. | Light + dark variable sets in `clerk-provider.tsx`, selected off the resolved theme. Concrete hex, not `var(--surface)`: Clerk derives hover/border/disabled shades by colour maths and cannot parse a var reference. `fontFamily` *is* passed through to CSS, so it references `var(--font-inter)`. Documented as a token-coupling constraint in DESIGN.md. |
| `global-error.tsx` painted `#fff` unconditionally — a full-white flash for a dark-mode user at the worst possible moment. | Colours moved into a `<style>` block keyed on `prefers-color-scheme` (inline styles cannot express a media query). CSS cannot read the persisted preference, so an explicit `light` choice on a dark OS gets the dark treatment here — accepted on a last-resort boundary, and noted in the file. |
| `Skeleton`'s own docstring told `loading.tsx` files to compose it rather than hand-roll pulse divs — **7 files hand-rolled 27 of them**, and `JobDetailSkeleton`/`CompanyDetailSkeleton` existed as byte-identical copies in both `loading.tsx` and `page.tsx`, kept in step by a comment. | Extracted `job-detail-skeleton.tsx` / `company-detail-skeleton.tsx`, imported by both call sites; all 27 now compose `Skeleton`. This also exercises the custom `radius` keys registered in `cn()` — `rounded-card` has to beat the primitive's `rounded-full`. |
| `bio-coach.tsx` had **no error path at all**. The route rate-limits and the Gateway can fail; on failure "thinking…" simply vanished and the user got silence. | `useChat`'s `error` surfaced as `role="alert"` with a Retry that calls `regenerate()`. Also gained the `EmptyState` every other list has, `aria-live` so the streamed reply is announced, and lucide icons + `IconButton` in place of `✨`/`✕` literals. |
| `Container` and `ThemeToggle` appended `className` with a template literal — the exact footgun `cn()` was introduced to remove. A caller passing `max-w-3xl` to `Container` left both widths on the element with stylesheet order deciding. | Both routed through `cn()`. DESIGN.md's claim that *every* primitive composes through `cn()` is now true rather than aspirational. |
| DESIGN.md asserted "every mutation toasts", but 10 forms deliberately surface errors inline instead. | Doc corrected to state the actual rule: toasts for out-of-band mutations (save, delete, upload, status change), inline `role="alert"` for form fields — an error belongs next to the input that caused it. Not both for one failure. |

Also checked and found already consistent: zero literal palette classes in `app/**`; 21
surfaces using `EmptyState` with no bare "No X yet" left; the shell-skeleton and auth-layout
dedupes; cookie banner and header on tokens. The typographic arrows in link text
(`Open →`, `Résumé ↗`) were left alone — `→` internal / `↗` external is a consistent
convention, and text arrows inherit type styling in a way icons would not.

Verified: typecheck · lint (0 errors) · **vitest 244/244** · `next build` green, **58/58
pages, 40 Partial Prerender / 3 static / 16 dynamic** · local Chromium E2E **34 passed, 1
failed, 36 skipped** (design-regression 12/13; **axe 10/10 public pages clean in both
themes**).

The single remaining E2E failure (`JD page via DB-backed featured jobs`) is
**environmental**: the `.env.local` database is missing migration
`20260724120000_digest_watermark_and_parse_attempts`, so `getFeaturedJobs()` throws
`users.lastDigestAt does not exist` (P2022, 6 occurrences in the server log). Proven with a
direct Prisma probe — the two queries added here both pass against the same database, and
`prisma/` is untouched on this branch. Tracked as P0 §0 in
[REMAINING_STEPS.md](../apps/web/docs/REMAINING_STEPS.md); deliberately not applied, since
those credentials may be production. The `home:` test that previously failed alongside it
now **passes** — direct evidence `IslandBoundary` works: the hero survives a throwing
island instead of the page being replaced by `error.tsx`.

**Not verifiable locally:** clerk-js rejects the format-valid placeholder publishable key,
so **no Clerk markup renders at all** on `/sign-in` and `/sign-up` here. The dark-mode
appearance fix above, and the axe dark scan of those two routes, therefore cover only the
surrounding shell — not the Clerk form itself. Both need a preview deploy with a real key.

## 2026-07-03 — Flowchart + use-case flows: onboarding, profile types, subscriptions, invitations, chat areas

Implements the master flowchart and `usecases_002.pdf` (JOB_UC_01–14) in
`apps/web` rather than resurrecting the legacy Express stack:

- **Onboarding (UC_01/03/04):** `/onboarding` role choice after sign-up
  ("Company or Job seeker?", then Employable vs Virtual Intern for seekers);
  `/dashboard` routes brand-new seekers there; middleware gates the route.
  Fixes the missing employer self-signup path.
- **Profile types (UC_05):** `JobSeekerProfile.profileType`
  (`EMPLOYABLE | VIRTUAL_INTERN`) plus VI extras (career interest,
  availability hrs/week, learning goal) editable on `/jobseeker/profile`.
- **Subscriptions (UC_07):** `CompanySubscription` unique per
  company/seeker/type; subscribe button on `/companies/[slug]`; seeker
  "My subscriptions" page; `NEW_SUBSCRIBER` notification to the company.
- **Directory + outreach (UC_10/14):** `/company/jobseekers` (PUBLIC profiles
  + "subscribed to you" tabs, Employable/VI filters) with share-job and
  invite actions.
- **Invitations (UC_10.1):** typed `Invitation` (unique per
  company/seeker/type, 30-day expiry); accept → subscription upsert, decline
  → company notified; inbox on `/jobseeker/subscriptions`.
- **Chat areas (UC_11–14):** `ChatArea` (one per job; one VIRTUAL_INTERN area
  per company via partial unique index), `ChatParticipant`, `ChatMessage`
  (`TEXT | MATERIAL | INTERVIEW_DETAILS`); optional create-at-job-post
  toggle; `/company/chats(/[id])` and `/jobseeker/chats(/[id])`; shortlisted+
  applicants auto-join the job's area with a `CHAT_AREA_ADDED` notification.
  Request/response only — realtime push transport stays V1.5.
- **Schema/migration:** `prisma/migrations/20260703000000_flowchart_flows`
  (new enums, tables, notification kinds, audit actions).

Verified: prisma validate · typecheck · lint (0 errors) · vitest 83/83
(4 new chat-join tests).

## 2026-06-10 — Global ambient backdrop: every section on one canvas

Extends the ambient design language from per-section treatments to the whole
viewport. One faint fixed `page`-variant canvas (wash + masked grid, no
aurora/starfield) renders behind everything via the root layout (`-z-10`,
body now transparent over a white `html`); chrome becomes glass over it:

- header `bg-white/70 backdrop-blur` + indigo border (mobile menu + Suspense
  fallback match), footer `bg-white/60 backdrop-blur` + indigo border,
  dashboard sub-navs glass, JD apply panel + applicant kanban columns glass.
- Intensity hierarchy preserved: hero (wash+aurora+grid+stars) > header bands
  (wash+grid+dots) > page backdrop (faint wash+grid). Cards/tables stay
  opaque white for dense-content legibility; dark cookie banner unchanged.

Verified: typecheck · lint · build green; served HTML carries the fixed
backdrop + glass chrome on every page; hero variant unchanged.

## 2026-06-10 — Money-path test coverage: post-job, applicant pipeline, resume parse

Closed the remaining money-path test gaps (unit suite 50 → 79, all green).
Existing coverage (apply, match-score, digest, retention, index-outbox,
saved-search) untouched; the three uncovered money paths now lock in:

- `tests/unit/post-job.test.ts` (12) — `postJob`/`updateJob`: role gate, zod
  reject-before-write, ownership/slug/publishedAt on publish, draft path,
  skill links with required=2/nice=1 weights (idempotent re-extraction),
  Algolia push + `jobs`/`company:*` cache invalidation, AI-extraction and
  index failures stay non-blocking, edit tenancy (FORBIDDEN on another
  company's job), publishedAt preserved on re-save / stamped on first publish.
- `tests/unit/update-applicant-status.test.ts` (10) — tenancy, same-status
  no-op (no write/notification/email/invalidation), status write + in-app
  notification payload, three cache tags invalidated, best-effort email to
  the jobseeker that never fails the transition; recruiter notes (tenancy,
  5000-char truncation, empty→null, pipeline-cache invalidation).
- `tests/unit/resume-parse.test.ts` (7) — idempotent skip when parsed,
  magic-byte mime mismatch → soft-delete + never reaches the model, blob
  fetch failure, too-short text, happy path persists parsedJson + pgvector
  embedding + links catalog skills, completes without a profile.

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
