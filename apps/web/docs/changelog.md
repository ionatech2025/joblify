# Changelog

## 2026-10-11 — Form UX audit: findings and fixes

Audited every form and journey the E2E accounts can reach on the live site (66 controls on the
profile form alone), read-only, at 1280/390/320 px, with keyboard tabbing, 200 % zoom and WCAG 1.4.12
text spacing. **Already sound:** every control has a programmatic name (no placeholder-only), 60/60
tab stops have a visible focus ring, no horizontal overflow at 320 px or 200 % zoom, no clipped text
under 1.4.12 spacing, 16 px fields on phones, `autocomplete` tokens where personal data is collected,
drafts survive a reload (WCAG 3.3.7), the console forms already use `noValidate`/`role="alert"`.

Fixed (jobseeker forms had drifted behind the console's):

- **Native validation bubble preempted the form's own errors.** Profile: an invalid portfolio URL
  was blocked by the browser's unstyled, transient "Please enter a URL." — no inline text, no
  `aria-invalid`, nothing announced — and the schema's message never appeared. `noValidate` on the
  profile and apply forms; messages are inline with `role="alert"`, first problem focused.
- **`required` was a `*` in the label text** ("Bio *" reads as "Bio star") with nothing on the
  control. `Field` takes `required` → `aria-required` and a decorative marker.
- **Skills error** had no `role="alert"` and no association with the group; it now does.
- **Apply:** missing resume / consent are inline errors; server failure is `role="alert"`; the cover
  letter says how much is left near its 5,000 limit (it silently truncated paste); the external
  link announces "(opens in a new tab)"; and there is a breadcrumb back to the job.
- **"Withdraw"** was 59×20 px — under WCAG 2.5.8's 24 px floor on desktop and phones. Now ≥ 32 px.
- **/jobs filters** are a named `role="search"` landmark instead of an unnamed `<aside>`.

Not changed, for the owner: phone numbers must be exactly 10 digits everywhere (registration,
profile, company) — an international number (`+256 …`) cannot be entered; the résumé builder's dates
are free text ("Jan 2022"/"Present") with no format check; 62 skills are one flat checkbox list with
no search; the company console forms could not be audited live because the E2E company is pending
verification.

## 2026-10-11 — Legal pages state the real AI routing (Groq)

- `/legal/processors` lists Groq, with the tasks routed to it, and narrows the Gateway row to what
  still goes only there (match score, other features) plus the fallback. `/legal/ai` says the same in
  prose and notes that `AI_GATEWAY_ZDR` does not cover direct Groq calls.
- Both are driven by `lib/ai/groq-config.ts` — the module that routes the calls — so a page cannot
  claim Groq is used when it is not, or the reverse. Tested for each switch combination.
- Region comes from `NEXT_PUBLIC_REGION_GROQ` and reads "Not yet published" until set. No retention
  claim is made for Groq: a DPA and its terms are still an owner item (COMPLIANCE.md).

## 2026-10-10 — Performance pass: live results, and a mobile Lighthouse gate

Lighthouse 13.5 against the production URL, median of 3, before (after the #77 layout fixes) and
after #80–#82:

| Page (preset)             | Performance | Best Practices | SEO          | LCP             | TBT                | JS transferred | Unused JS   |
| ------------------------- | ----------- | -------------- | ------------ | --------------- | ------------------ | -------------- | ----------- |
| `/` (mobile)              | 32 → **76** | 77 → **100**   | 100          | 3.2 → 3.3 s     | 139 s → **0.43 s** | 655 → 193 KB   | 301 → 29 KB |
| `/jobs` (mobile)          | 50 → **72** | 77 → **100**   | 100          | 5.1 → **3.7 s** | 1.5 s → **0.38 s** | 653 → 209 KB   | 303 → 29 KB |
| `/legal/privacy` (mobile) | 49 → **76** | 77 → **100**   | 92 → **100** | 3.1 → 3.0 s     | 1.4 s → **0.49 s** | 637 → 193 KB   | 304 → 29 KB |
| `/jobs` (desktop)         | 81 → **91** | 77 → **100**   | 92 → **100** | 1.4 → 1.3 s     | 18 → 0 ms          | 281 → 209 KB   | 158 → 28 KB |

Third-party cookies 2 → 0 on every page. LCP on the static pages is mostly the development-instance
handshake redirect (TTFB), which only production Clerk keys remove.

- **`lighthouserc.mobile.js` + a second step in `lighthouse.yml`.** The gate had only ever run the
  desktop preset; mobile is how Core Web Vitals are scored. Warn-level, thresholds just beyond the
  numbers above, so a regression is visible on the PR without failing it.
- **`deploy-preview.yml` uploads with `--archive=tgz`.** The CLI deploy uploaded a few thousand files
  per run and hit the Hobby plan's 5,000-per-day cap (`api-upload-free`, "try again in 24 hours"),
  turning that check red on every PR for the rest of the day. Not yet verified: the quota had not
  reset when this was written.
- `responsive.spec.ts › jobs listing is server-rendered` asserts the links are _in the document_, not
  visible: React ships a streamed Suspense boundary in a `hidden` container that an inline script
  reveals, so with scripts off the listing is in the markup (what crawlers read) but not painted.

## 2026-10-10 — Groq: per-task model chains with fallback (opt-in)

- `lib/ai/groq.ts`: bio coach, résumé parse and JD skill extraction each get their own chain of Groq
  models (`gpt-oss-120b`/`gpt-oss-20b` → `qwen3.8-27b`) ending at the Gateway model they already used.
  `withFallback` moves to the next model when a call fails to start. Opt-in per task
  (`AI_PROVIDER_<TASK>=groq` or `AI_PROVIDER=groq`, plus `GROQ_API_KEY`); off by default because Groq
  is a separate processor.
- `llama-3.3-70b-versatile` is no longer in Groq's catalogue (404 `model_not_found`); defaults come
  from `GET /openai/v1/models`.
- Verified in the app: signed-in call to `/api/v1/ai/bio-coach` returned a streamed answer in 1.5 s
  with the first model deliberately dead — the log shows the fallback.

## 2026-10-10 — Performance: Clerk's browser SDK loads only where it is used

Every page used to load Clerk — one `<ClerkProvider>` wrapped the whole tree — including the legal
pages and the job board for visitors who were never going to sign in. Measured on the live site
(mobile preset), a signed-out visit to a static page spent **305 KB and eight requests** on it
(clerk.browser.js 87, framework 43, vendors 47, ui-common 119, two XHRs, the handshake), roughly
0.8–1.1 s of main-thread time at 4× CPU, and set **two third-party cookies** — which is what held
Best Practices at 77 — to render nothing: the header's links are server-rendered from `auth()`.

- **No provider around the tree.** `app/components/clerk-host.tsx` mounts the one provider on
  demand, when a `<ClerkSlot>` registers (`clerk-slot.tsx`); slots are portalled into it. A host
  with portals rather than a wrapper because a wrapper cannot appear later without remounting
  everything beneath it, and two `ClerkProvider`s are an error in `@clerk/clerk-react`. The runtime
  chunk sits behind an error boundary, so a failed chunk load costs the avatar menu, not the page.
- **Widgets are named, not imported** (`<ClerkSlot widget="userButton" />`, `widget="signIn"` with
  its props). A server component that imports a Clerk component puts that component's chunk — and
  `@clerk/clerk-react`, ~27 KB gzip — in the scripts of every page of its layout, whether or not the
  render reaches it. The first version of this change did exactly that and passed every test;
  only a look at the built chunks found it. Only `clerk-runtime.tsx` imports Clerk's components now.
- **What needs a slot:** the header's avatar menu (rendered only for a signed-in visitor — the
  server decides from the session cookie, desktop and mobile) and the sign-in / sign-up cards, which
  keep their skeleton until clerk-js is ready.
- **Server → client auth state.** `<AuthHint>` (rendered by the header island) carries `auth()`'s
  answer into a small store: the mobile menu's links and the save-search button read it instead of
  Clerk's `<SignedIn>`/`<SignedOut>`. It also replaces `DraftOwnerGuard`: drafts are reconciled
  against the server's `userId`, which has no "not loaded yet" ambiguity and arrives with the HTML
  rather than after a script.
- **Connection hint** to the Clerk frontend API moved from every page to the pages that load it
  (auth layout, signed-in header).
- **First-load JS** (gzip): `/legal/terms` 284.1 → 221.8 KB, `/jobs` 294.2 → 232.1,
  `/company/jobs/new` 322.7 → 260.6 — **360.2 → 221.8 KB (−38 %) on the lightest routes since the
  start of this pass**. Budgets lowered to match (default 396 → 285).
- **Two guards.** `tests/unit/clerk-boundary.test.ts` fails if a file outside a short allow-list
  imports the Clerk browser SDK (mutation-checked); `scripts/check-bundle-budget.ts` now also fails
  if the Clerk or Sentry SDK appears _by name_ in any route's first-load chunks, which is the check
  that would have caught the leak above. e2e: public pages load no clerk-js; `/sign-in` and
  `/sign-up` still do and show their cards; the signed-in header shows Dashboard and the avatar menu.

## 2026-10-10 — Performance: Sentry, the theme menu and the globe off the critical path

Measured with `next experimental-analyze` and the live site (Lighthouse 13.5, 3 runs per page).

- **First-load JS −21 %** on the lightest routes (360.2 → 284.1 KB gzip; `/jobs` 370.0 → 294.2;
  console form routes 390–403 → 315–327). Two modules were on every page and did nothing for most
  visits:
  - **Sentry browser SDK (~67 KB).** Imported statically by `instrumentation-client.ts` and both
    error boundaries — on a deployment with no DSN, where `init()` never runs. Everything now goes
    through `lib/observability/sentry-client.ts`: without `NEXT_PUBLIC_SENTRY_DSN` the dynamic
    import is unreachable and the SDK is not in the client build; with one it is its own chunk,
    started at idle after `load`. Errors thrown before it arrives are buffered and replayed into it;
    web vitals wait for it (`withSentry`) instead of loading it.
  - **Radix dropdown menu (~25 KB)** behind the header theme control. The trigger is a plain button
    with the same `aria-haspopup`/`aria-expanded` that is swapped for the Radix one — opening the
    menu as it mounts — on first activation; hover/focus start the fetch. The theme effect stays
    outside the lazy part.
- **Home page main thread.** Under a software rasteriser (headless Chrome — Lighthouse, PageSpeed
  Insights, Googlebot's renderer — and some VMs/remote desktops) the globe's every frame held the
  main thread for ~1 s: 149 s of main-thread time, 200 tasks over 100 ms, **TBT 139 s**, Lighthouse
  performance 32 on the live `/`. The globe now runs only when
  `getContext('webgl', { failIfMajorPerformanceCaveat: true })` succeeds and the renderer is not a
  software one; otherwise a static disc fills the same box. TBT was 139 s on the live site; a
  local production build of this change under the same headless Chrome measures 1.6 s.
- **Budgets lowered** to what the routes now measure (`scripts/check-bundle-budget.ts`).
- Tests: `sentry-client.test.ts` (7), theme control e2e (open → choose → persists across reload;
  keyboard open/Escape/focus return).

## 2026-10-10 — Performance: the first page of /jobs is rendered on the server

`/jobs` used to ship a filter form and an empty list: the results were fetched by the browser
after the JavaScript had downloaded and hydrated (HTML → JS → hydrate → `fetch` → render), so
they sat at the end of a waterfall under the LCP and were absent from the HTML crawlers read.

- The search moved out of `app/api/v1/jobs/search/route.ts` into `lib/search/jobs.ts`; the route is
  now only the transport (rate limit, validate, status codes) and the page runs the same code.
- `app/(marketing)/jobs/page.tsx` runs the first page inside its Suspense boundary and hands it to
  `useQuery` as `initialData`. The unfiltered page is a `'use cache'` entry tagged `jobs` (the tag
  publish/unpublish already invalidates), so a plain `/jobs` costs no search; filtered pages run
  live, behind the same rate limit as the API, with a 3 s budget. Anything that goes wrong
  (rate-limited, timeout, backend down, invalid parameters) renders the page without results and the
  client fetches them as before — never a worse first paint, never an error page.
- Only the fields a result card renders are serialised into the page, with the description cut to
  the 151 characters the card can show.
- Filter changes use `history.replaceState` instead of `router.replace`: a router navigation would
  re-run the server search for every change while the client query fetched the same page.
- Query keys use a canonical form of the search (`canonicalSearchString`), so `?q=a&sort=b` and
  `?sort=b&q=a` share a cache entry and the server's page is recognised for either spelling.
- `responsive.spec.ts › jobs listing is server-rendered` is now a plain assertion (it was a tracked
  `test.fail`).

## 2026-10-10 — Live responsive / UX / SEO verification pass

Measured against the production URL with Lighthouse 13.5 (mobile and desktop, 14 runs), the Vercel
CLI, and a new Playwright gate that loads every route at 11 viewports
(`tests/e2e/responsive.spec.ts`). The Lighthouse gate had only ever run the _desktop_ preset.

- **Layout shift.** The footer sat in view while `/jobs`, job pages and company pages streamed in,
  then was pushed a page down — CLS 0.41 on a throttled mobile run of a job page, up to 0.66 on
  `/jobs`. The loading shells now reserve the body with the house skeletons and keep the footer
  below the fold (`min-h-svh`).
- **iOS input zoom.** The shared form controls were 14 px, so iOS Safari zoomed the page on focus
  (and did not zoom back). `text-base sm:text-sm`: 16 px on phones, unchanged from `sm` up.
- **Crawler metadata.** Async metadata was streamed into `<body>` for every user agent outside
  Next's default bot list — Googlebot and the AI answer-engine crawlers (OAI-SearchBot,
  PerplexityBot, Claude-SearchBot) got `<title>` and the description ~34 KB deep. `htmlLimitedBots`
  now covers them. No `<link rel="canonical">` existed on any route; the root layout now emits a
  per-route canonical with the query string stripped.
- **Links in prose** relied on colour alone (WCAG 1.4.1) on the legal and about pages. `.prose-links`
  underlines them; the axe gate now scans those pages, which was a blind spot.
- **Globe** stops scheduling animation frames when scrolled off-screen or the tab is hidden (it
  previously kept waking the main thread ~60×/s for the rest of the visit).
- **Node engine pinned to `24.x`** — `>=24.0.0` would have let Vercel move production to Node 26
  the day it ships.
- **Save profile was throwing on production.** `app/actions/profile.ts` exported zod schemas from a
  `'use server'` file; Next 16.4 rejects that when the module loads in a production build, while
  `next build` passes. Found by the existing "edits the profile headline" flow, which had never run
  with credentials in CI. Schemas moved to `profile-schema.ts`; a unit test now scans every
  `'use server'` module.
- **AI match scoring and job embedding never ran.** `embedding::float8[]` is not a pgvector cast
  (only `real[]` is): SQLSTATE 42846, swallowed by each caller's try/catch, which is why the database
  held no embeddings at all. Fixed to `::real[]`; a unit test scans for the pattern.
- **CI.** Dependabot runs skip the secret-dependent preview deploy; runners pinned to
  `ubuntu-24.04` ahead of `ubuntu-latest` moving to 26 on 2026-10-19.
- **Not fixable from the repo:** the Clerk _development_ instance costs every first visit a
  four-hop redirect (1.9–2.5 s) and sets two third-party cookies (Best Practices 77) — see
  REMAINING_STEPS.md §0b.

## 2026-10-10 — Hardening pass (security, privacy, AI correctness, supply chain)

Driven by a full audit against current standards (OWASP Top 10:2025, OWASP LLM Top 10:2025, GDPR/ePrivacy,
EU AI Act + US state hiring-AI rules, Google JobPosting, bulk-sender email rules, GitHub Actions /
npm supply-chain guidance). See REMAINING_STEPS.md for the table of changes and the owner actions.

- **Security:** private résumé storage + authenticated download; URL host pinning (SSRF); `next` 16.4.0 and
  the dependency clean-up (production advisories 74 → 0 critical, 2 acknowledged high, 8 moderate); JSON-LD escaping; CSP `unsafe-eval` dev-only;
  fail-closed verification gates; rate limiter never off; health endpoint minimised; Clerk org
  membership no longer grants COMPANY.
- **Privacy:** explicit email opt-in + one-click unsubscribe; streamed GDPR export; file erasure; audit-log
  retention actually enforced; consent-gated Replay and view-beacon identifiers; drafts cleared on user
  change; honest legal pages (privacy, processors, AI use).
- **AI:** embedding width fixed and validated; canonical Gateway model slugs; provenance columns; prompt
  injection fencing; non-fabricating fallback parser; sweeps re-parse/re-embed/re-score.
- **Product:** pay period + country on postings and correct JobPosting markup; annualised salary search;
  candidate-owned WITHDRAWN; recruiter-facing labels in emails.
- **Trust & safety:** report-a-job flow + admin moderation queue; PII-aware log redaction.
- **Platform:** proxy.ts, OG routes off the edge runtime, Server Action body limit, CI hardening, Dependabot.

## 2026-08-26 — Odoo-enterprise console: flows + design register

The first two design passes applied one visual language to the whole product.
That serves the public funnel and fights the back office, where the job is
scanning and mutating records. This pass gives the authenticated surfaces
(`/company`, `/jobseeker`, `/admin`, onboarding, account tools) their own
register and, more importantly, Odoo's structural vocabulary. The public funnel
keeps the editorial language, retuned to the shared palette.

**Token layer** — `.o-console` re-declares the _same_ semantic token names with
enterprise values (13px base, 4px corners, hairline borders, plum ink, opaque
sticky chrome), so `Card`/`Badge`/`Input`/`Select`/`Button` re-skin inside it
with zero call-site changes. Radii moved to raw `--r-*` vars _referenced_ from
`@theme inline` — an inline literal bakes into the emitted utility and no scope
class can override it, which is why `rounded-card` can now mean 16px on
marketing and 4px in the console. `--brand` retuned from indigo to the Odoo plum
family (7.23:1 on `--surface`). Every console fg/bg pair contrast-checked before
landing; tightest is `--fg-subtle` on `--canvas` at 4.78:1.

**New primitives** (`app/components/console/`) — `ConsoleShell`/`ConsoleNav`,
`ControlPanel`/`Breadcrumb`/`RecordPager`/`ViewSwitcher`, `ListView`/`Pager`,
`KanbanBoard`/`KanbanColumn`/`KanbanCard`, `FormSheet`/`SheetGroups`/`SheetField`,
`Notebook`, `Statusbar`, `SearchBox`/`FacetChips`, `FilterMenu`, `DirtyBar`, and
console-shaped skeletons. URL state for every list is parsed/built by
`lib/ui/list-params.ts` (18 unit tests).

**Flow fixes** — these are the substantive part; the restyle is the vehicle:

- **Navigational dead ends.** Opening a job's applicants or edit form had no way
  to reach the next job — every drill-down needed a round trip through the list.
  Both now carry a breadcrumb (with working ancestor links) and a record pager
  (`4 / 12`, prev/next) that preserves the board's own sort across a hop.
- **Unbounded and silently-truncated queries.** `/company/jobs` fetched _every_
  post the company had ever created and rendered them on one page, with no sort
  and no paging. It now sorts in Postgres over an allow-listed key set and pages
  20 at a time. `/jobseeker/applications` capped at 50 with nothing on screen
  admitting rows existed past it — the cap is now a shared constant used by both
  the page and `/api/v1/applications`, and the UI states "50 of 137" when it
  bites. Same for the talent directory (60) and the jobs kanban (200).
- **"Post a job" was a nav item, not an action.** It sat in the section menu,
  which is what forced pill-nav's longest-prefix hack so `/company/jobs/new`
  wouldn't light "Jobs". It is now a `New` button on the list it creates into.
- **Filters you could not read or clear.** The talent directory expressed its
  query as two rows of five toggle pills; the applicants board hid sort and
  "show closed" inside the board body. Both are now control-panel menus plus
  removable facet chips with a "Clear all".
- **Advancing an applicant took three interactions.** A `<select>` of all eight
  statuses in every card, to express "move forward by one". Now one click, with a
  dropdown for skips and rejection (still confirm-gated — it emails, with no undo).
- **Forms were multi-screen single columns with no save in reach and no dirty
  signal.** The job, company-settings forms became sheets: two columns of
  label:value rows, long-form blocks behind notebook tabs, and a sticky
  `DirtyBar` with discard and a `beforeunload` guard. These forms already
  persisted drafts to `localStorage` — silently, which is worse than not
  persisting, since the user had no idea there was pending work.
- **The publish checkbox became the statusbar.** "Published (uncheck to move to
  draft)" is now the stage pipeline; only Draft/Published are clickable because
  `publish` is a boolean the action maps to exactly those two states, and any
  other persisted status renders as a read-only stage rather than implying the
  form can set it.
- **Kanban columns said only how many.** They now carry an aggregate (avg match)
  and a progress bar segmented by match strength, so "9 shortlisted" also tells
  you whether they are any good.

**Removed** — `PillNav`, `JobseekerPillNav`, `ShellSkeleton`, `SkeletonPillNav`,
and the applicants board's `useSearchParams()` dependency (its state is read on
the server now, so the inline `<Suspense>` that existed only to satisfy it went
too). Console pages no longer render the editorial footer, hidden via `:has()`
rather than a route check — the root layout can't read the pathname without
collapsing every route's PPR shell.

**Gotcha worth remembering** — lucide icons cannot be passed from a server
layout to `ConsoleNav`: a component is a function, and that fails the build with
"Functions cannot be passed directly to Client Components". Icons are string
names into a local map, matching what `lib/ui/commands.ts` already did for the
command palette. It only surfaced on `/admin`, which prerenders further than the
dynamic `/company/*` routes.

Verification: typecheck clean, lint 0 errors (7 pre-existing warnings), 265 unit
tests + 18 new `list-params` tests green, production build 58/58 pages with every
console route still partial-prerendering (`◐`). New e2e guard:
`tests/e2e/console-design.spec.ts`.

## 2026-07-31 — Phase 4 audit: remaining items closed out

Fixed every item the flow-completeness audit below had left tracked in
[REMAINING_STEPS.md](./REMAINING_STEPS.md) (that doc's "Week 12" section has
the full per-item detail; this is the short version):

- **Withdraw application** — new `withdrawApplication` server action, mutation
  hook, and a confirm-gated button on the applications list. The status was
  fully modeled but had no writer anywhere.
- **Resume parse failure UX** — `Resume` gained `parseFailedAt`/`parseError`
  columns; the algolia-reconcile cron now writes them once a resume's retry
  count hits the cap, and the resumes page shows a real "couldn't parse"
  state with recovery guidance instead of "Processing…" forever. This is the
  one item here that touched the database directly — see the migration's own
  header comment for why it was hand-authored and applied via `migrate
deploy` rather than `migrate dev` (a pre-existing, already-documented
  shadow-database drift issue on an unrelated older migration made `migrate
dev` unsafe to run in this environment).
- **PlanTier gating** — `assertPlan` added to the three actions
  (`inviteJobseeker`, `openJobChatArea`, `openVirtualInternChatArea`) the
  schema's own comment named as gated but weren't. No live behavior change
  while every account defaults to PRO.
- **Remaining bare-form mutations** — chat-area creation, adding a chat
  participant, and invite/share/add-to-VI-chat all converted from inert
  `<form action>` elements to client components with toast + pending state.
- **Draft persistence** — added to the post-job, profile, employer-setup, and
  company-settings forms, mirroring the existing apply-draft pattern.
- **Skeleton shape mismatches** — dedicated loading states for all 10 routes
  the audit flagged as falling back to a generic, wrong-shaped skeleton.
- **Applicants board sort/filter** — now URL-synced instead of resetting on
  back/forward.
- **Sign-in/sign-up blank flash** — replaced with a real skeleton.

Verification: typecheck, lint, and the full unit suite (247 tests) all clean;
production build 58/58 pages.

## 2026-07-31 — Phase 4: flow completeness audit

Four flows walked end-to-end against a 7-point checklist (every mutation
toasts, every empty list offers a next step, every destructive action
confirms, every form surfaces server errors, loading skeletons match the real
shape, back/forward preserves state, `aria-current` on every nav link):

1. Jobseeker core loop — sign-up → onboarding → profile → search → JD → apply → tracking
2. Resume — upload/builder → parse → match score
3. Company/hiring — employer-setup → post job → applicants board → chat
4. Subscribe → invitation → accept → chat, plus GDPR export/delete and notifications

~110 findings. What follows is fixed work; structural gaps and lower-priority
polish items not yet fixed are tracked in
[REMAINING_STEPS.md](./REMAINING_STEPS.md) under "Week 12 — Phase 4
UX-completeness audit" rather than silently dropped.

### Real bugs fixed

- **Account deletion redirected to a route that doesn't exist.** `deleteMyAccount`
  (`app/actions/account.ts`) redirected to `/sign-out?reason=deleted` — no such
  route, no consumer of `reason` anywhere in the codebase. A user completing the
  single most sensitive action in the app landed on a 404, which reads as
  failure, not success. Now redirects to `/`.
- **Applicant notes silently vanished on save failure.** `applicants-board.tsx`'s
  `saveNote` catch block reset UI state to idle with no error shown at all —
  not even a `console.error`. Now toasts the failure.
- **No confirmation before rejecting an applicant.** Changing status to
  `REJECTED` emails the applicant with no undo, same severity class as every
  other confirmed destructive action in the app, but had none. Now gates on
  `window.confirm`, matching the established pattern (job delete, resume
  delete, account deletion).
- **Accepting an invitation while onboarding was incomplete silently dropped
  the accept.** `respondToInvitation` redirected to `/onboarding` before
  updating the invitation's status when the seeker had no profile yet — the
  "Accept" click had zero effect, and the invitation stayed `PENDING` forever
  with no way back to it. Now carries the invitation id through onboarding
  (`?invitationId=`) and resumes the accept once the profile exists
  (`app/actions/onboarding.ts`, `app/actions/invitations.ts`,
  `onboarding/page.tsx`). Covered by new cases in `tests/unit/onboarding.test.ts`.
- **Company users could view jobseeker notifications.** `/jobseeker/notifications`
  called `requireUser()` instead of `requireRole('JOB_SEEKER')` — the sole
  exception among 9 sibling jobseeker routes. Fixed to match.
- **Match-score badge color was inconsistent across three surfaces.** A 60%
  match rendered amber on the JD page (`match-badge.tsx`'s own hand-rolled
  3-tier logic), gray on the applications list, and gray on the matches page —
  both of the latter used a 2-tier check instead of the shared `matchTone()`
  helper `lib/ui/status.ts` exists specifically to prevent this drift. All
  three now call `matchTone()`; `match-badge.tsx` also switched from a
  hand-rolled `<span>` to the shared `Badge` component.
- **The apply page flashed blank before showing the form.** A correctly-shaped
  skeleton already existed (`apply/loading.tsx`) but the route's inner
  `Suspense` used `fallback={null}` — the outer route-segment skeleton resolves
  almost instantly, so the real latency window (auth + 3 queries) rendered a
  blank page. Now reuses the same skeleton component.

### Toast wiring added

Extended the app's existing `toast.success`/`toast.error` pattern (already
correct in `resume-manager.tsx`, `applicants-board.tsx`'s status change) to
mutations that only had local `saved`/`error` state or no feedback at all:
profile save, resume-builder save + PDF generate, employer-setup, post-job,
edit-job save + delete, company-settings save + logo upload, account export,
account delete (failure only — success redirects server-side), and the
notifications mark-as-read mutation (failure only — deliberately no success
toast on a high-frequency, low-stakes action).

### Subscribe/unsubscribe and invitation actions converted to client components

`subscribe-button.tsx` and the invitation accept/decline/unsubscribe controls
on `/jobseeker/subscriptions` were plain `<form action>` Server Actions with
no client JS reachable — no toast, no confirm, and errors (e.g. "Daily
invitation limit reached") fell through to the full-page error boundary
instead of surfacing to the user. Split into a server component (data
fetching) plus a small client component (`subscribe-toggle.tsx`,
`invitation-actions.tsx`, `unsubscribe-button.tsx`) with `useTransition` +
toast +, for unsubscribe, a confirm gate — matching the pattern already
established elsewhere in the app.

### Unread-notification badge

Two independent audit passes flagged the same gap: `useNotifications()` already
polls every 30s and exposes `readAt` per item, but nothing surfaced an unread
count anywhere in the nav. `PillNav` now accepts an optional, purely
presentational `badgeCounts` prop (keyed by href) so it stays generic — the
live count is fetched by a new `JobseekerPillNav` client wrapper specific to
the jobseeker shell, so company's shell (no notifications page) is unaffected.

### Smaller fixes

- `notifications-list.tsx`'s empty state ("You're all caught up") now has a
  recovery action (Browse jobs), and surfaces a visible notice if the
  background poll is failing instead of silently going stale.
- `company/jobseekers/page.tsx`'s filter tabs now set `aria-current` (the
  generic `"true"` token, not `"page"` — these toggle a filtered view of the
  same page, not navigate to a different one).

### Verification

`bun run typecheck && bun run lint && bun run test && bun run build` all
clean; 242/242 unit tests (3 new, covering the invitation-resume-through-
onboarding fix). Deployed to production via `vercel deploy --prod` and
spot-checked live.
