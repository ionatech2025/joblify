# Changelog

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
