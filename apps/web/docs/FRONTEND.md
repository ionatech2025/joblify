# Frontend

How the React / Next.js side is organized and the conventions you should follow when adding to it.

## Rendering decision tree

1. **Does the page need SEO or fast first-paint?** → Server Component, ideally inside `(marketing)` with `'use cache'`.
2. **Does the page require auth?** → Server Component inside `(authenticated)` or `company`. The layout enforces `requireUser` / `requireRole`.
3. **Does a sub-tree need interactivity (forms, polling, state)?** → split that sub-tree into a Client Component (`'use client'`). Pass server-rendered data as props.
4. **Is the user data fundamentally per-request?** → fully dynamic RSC. No cache.

The default is "Server Component until you need a client." `'use client'` is the cost; minimize it.

## Cache Components (Next 16) conventions

The app runs with `cacheComponents: true` (PPR). Two rules follow:

1. **Cache with `'use cache'`** on shareable, revalidatable data (the marketing shells). Invalidate from Server Actions with `updateTag(tags.*)` — not the old `revalidateTag`, which now requires a cache-profile arg.
2. **Uncached request data** (`cookies()`, `headers()`, Clerk `auth()`, per-request DB reads) must be reached **inside a `<Suspense>` boundary** so the static shell can prerender. Concretely: `<ClerkProvider>` sits inside a root `<Suspense>` (it reads headers); the `(authenticated)` and `company/` layouts wrap their `requireUser`/`requireRole` gate in `<Suspense>` (which also covers every child page); and the marketing list pages fetch data in a `connection()`-marked island so the static shell prerenders at build while data streams + caches at runtime — meaning the build needs no database.

Segment configs `export const dynamic`/`revalidate` are **disallowed** under cacheComponents; routes are dynamic by default and opt into caching via `'use cache'`.

## Component layout

```
app/
├── (marketing)/page.tsx                Server: cached hero + featured-jobs list
├── (marketing)/jobs/[slug]/
│   ├── page.tsx                        Server: PPR with `'use cache'`
│   ├── apply-panel.tsx                 Server island, reads session
│   ├── match-badge.tsx                 Server island, reads pgvector
│   └── apply/apply-form.tsx            'use client', uses Zustand draft + Server Action
├── (authenticated)/jobseeker/applications/
│   ├── page.tsx                        Server: db query + initialData
│   └── applications-list.tsx           'use client', TanStack Query useApplications
├── company/                            Employer console (Odoo register)
│   ├── layout.tsx                      ConsoleShell + ConsoleNav ("Recruitment")
│   ├── jobs/page.tsx                   Server: ControlPanel + ListView | KanbanBoard
│   └── jobs/job-form-fields.tsx        'use client', FormSheet + Notebook + Statusbar
├── components/ui/                       Editorial primitives (Button, Card, Badge…)
├── components/console/                  Console primitives (ControlPanel, ListView…)
└── components/cookie-banner.tsx        'use client', global UI
```

**Naming**: page files are `page.tsx`; client islands sit next to them named after the feature (`apply-form.tsx`, `applications-list.tsx`); never a giant `client.tsx` catch-all.

**Two component families.** `components/ui/` is register-neutral and used everywhere;
`components/console/` is the back-office structural vocabulary (control panel, list view,
kanban, form sheet, notebook, statusbar) and is only meaningful inside a `ConsoleShell`.
Console surfaces compose both — `ui/` for controls, `console/` for layout. See
[DESIGN.md](./DESIGN.md#console-primitives).

**Console list views stay server components.** Sort, paging, search and which view you are
in all live in the URL, parsed by `lib/ui/list-params.ts`. That keeps the heaviest surfaces
free of hydration cost and makes every view a shareable link — and it means sorting and
paging happen in Postgres rather than over one already-truncated page of rows.

## State management

Two layers, picked for the standard Joblify use cases:

### TanStack Query — server state

Configured in `lib/query/client.ts`:

```ts
defaultOptions: {
  queries: { staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false },
  mutations: { retry: 0 },
}
```

- Query keys are centralized in `lib/query/client.ts` `queryKeys.*` — never inline a key string.
- `useQuery` hooks live next to the feature: `lib/query/notifications.ts`, `lib/query/applications.ts`.
- `initialData` is the standard hydration pattern: Server Component fetches, passes data to the client list, `useQuery` refreshes from there.
- `useMutation` only when the mutation is a Route Handler hit (e.g. mark-notification-read). For form submits, prefer Server Actions.

### Zustand — client state

Stores in `lib/stores/`. Decision rule: if the data lives on the server, it does NOT belong in Zustand.

- `ui.ts` — theme (persisted; read pre-paint by `components/theme-script.tsx`), mobile
  menu, cookie banner, command-palette open state, and the toast queue. The `toast.*`
  helper at the bottom of the file is for call sites that aren't components (Server Action
  result handlers, catch blocks); inside a component use
  `useUiStore((s) => s.pushToast)`.
- `search.ts` — search filter draft. Committed search goes via TanStack Query keyed off the draft.
- `apply-draft.ts` — multi-step apply form draft, keyed by jobId, persisted to localStorage, cleared on successful submit.

Persistence: use `zustand/middleware`'s `persist` with `partialize` to commit only what should survive reload. Bump `version` when the slice shape changes.

## Forms

`react-hook-form` + `@hookform/resolvers/zod`. Schema lives next to the form; the same schema is reused in the Server Action:

```ts
// post-job-form.tsx
const PostJobFormSchema = z.object({ ... });
export type PostJobFormValues = z.infer<typeof PostJobFormSchema>;

// post-job.ts (Server Action)
import { PostJobFormSchema } from '../company/jobs/new/post-job-form';
const parsed = PostJobFormSchema.parse(input);
```

This is the single source of truth — adding a field changes one place; client and server both pick it up.

For optimistic UI on form submit, use React's built-in `useOptimistic` paired with `startTransition`. Never roll your own setState mirror.

**Console forms use a sheet plus a dirty bar.** `FormSheet` + `SheetGroups`/`SheetField`
(two columns of label:value rows) and a sticky `DirtyBar` carrying save/discard and a
`beforeunload` guard. Two things to get right when adding one:

- `SheetField` takes the same `label`/`error`/`hint` props as `ui/form.tsx`'s `Field`, so
  adopting the sheet layout is an import change, not a field-by-field rewrite.
- After a successful save, `reset(values)` — that rebases react-hook-form's dirty baseline,
  otherwise the bar reads "unsaved changes" forever. Where a draft is restored from a
  Zustand `*-draft` store on mount, track that separately: `reset()` clears `isDirty`, but
  restored draft content _is_ unsaved work and the bar has to say so.

**Draft persistence goes through `lib/use-form-draft.ts`. Do not hand-roll it.**

```tsx
const clearDraft = useProfileDraftStore((s) => s.clear); // selector, always
useFormDraft({ store: useProfileDraftStore, watch, reset, initial });
```

Four forms each had their own copy of this, and each copy had the same three
problems: a selector-less `useXDraftStore()` subscribed the form to its own
write so it re-rendered on every keystroke; that re-render changed the store
object's identity, and the persist effect listed it as a dependency, so
react-hook-form's subscription was **torn down and rebuilt on every keystroke**;
and zustand's `persist` runs `JSON.stringify` + `localStorage.setItem`
synchronously on the main thread, once per keystroke. The hook takes the store
itself (a module singleton, so a stable dep), debounces the write, and flushes
it on unmount so accidental navigation still saves.

**Never wrap a control in its `<label>`.** `Field` and `SheetField` associate via
`htmlFor`/`id`, because a wrapping label contributes _all_ of its text to the
control's accessible name — with a hint and an error on screen, a screen reader
announced the field as "Website Annual, before tax. Enter a valid URL." and then
read the error again from `aria-describedby`. Both primitives did this until
2026-08-28; the first component test written in this repo found it.

**Every field about the user needs an `autoComplete` token** (WCAG 2.2 SC 1.3.5,
Level AA — and the single biggest mobile-funnel win available). axe cannot catch
a _missing_ one: its `autocomplete-valid` rule only checks tokens that are
present. `tests/unit/components.test.tsx` asserts the contract instead.

**Dates render through `app/components/ui/timestamp.tsx`**, never a bare
`toLocaleDateString()`. Without an explicit locale that call resolves to the
server's locale and UTC on the server and the viewer's on the client — a
hydration mismatch in a client component, and a wrong date for everyone else.

## Server Actions

Pattern:

```ts
'use server';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

export async function doThing(input: Z): Promise<ActionResult<R>> {
  const user = await requireRole('JOB_SEEKER');       // throws AuthError
  const rl = await someLimit(user.id);
  if (!rl.success) return fail('Daily limit reached. Try again tomorrow.');
  const parsed = SomeSchema.safeParse(input);
  if (!parsed.success) return fail('Check the highlighted fields.');

  // tenancy / ownership check -> throw new AuthError('FORBIDDEN')

  const result = await withAudit(
    { actorId: user.id, ip, ua },
    { action: 'X_HAPPENED', entity: 'thing' },
    async (tx) => tx.thing.create({ data: ... }),
  );

  updateTag(tags.foo(...));
  return succeed(result);
}
```

Six steps, in this order: auth → rate-limit → validate → ownership → mutate-with-audit → invalidate. Skipping any one is a bug. See [BACKEND.md](./BACKEND.md) for the full Server Action contract.

### Expected failures RETURN. Faults THROW.

This is not a style preference, it is the only thing that works. **React does not
forward a thrown error's message to the client in a production build** — it
replaces it with a fixed paragraph beginning "An error occurred in the Server
Components render. The specific message is omitted in production builds…".
So a `throw new Error('You already applied to this job.')` renders _that
paragraph_ into the user's toast, in production only. It looks correct in dev
(no redaction) and passes unit tests (which call the action directly and see the
real string).

| Kind             | Example                                                                       | How                                                                              |
| ---------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Expected failure | rate limit, validation, "already applied", expired invitation, plan gate copy | `return fail('…')`                                                               |
| Fault            | not signed in, not the owner, DB down, programmer error                       | `throw` — `AuthError`, `assertPlan`, or let it propagate to `error.tsx` + Sentry |

Client side, `unwrap()` re-throws an expected failure **on the client**, where
nothing redacts it — so an existing `try/catch` + `err.message` handler keeps
working and now shows the real text:

```tsx
try {
  const id = unwrap(await postJob(values));
} catch (err) {
  toast.error("Couldn't post", err instanceof Error ? err.message : 'Try again.');
}
```

Use `useActionState` instead where the failure should render inline and the form
must keep its draft — `sendChatMessage` + `chat-composer.tsx` is the example.

## Calling Server Actions from forms

Use `action={fn}` for progressive enhancement (works without JS):

```tsx
<form action={onSubmit}>
  <input name="title" />
  <button type="submit">Save</button>
</form>
```

When you need transitions / pending state / error capture, wrap:

```tsx
const [isPending, startTransition] = useTransition();
function onSubmit(formData: FormData) {
  startTransition(async () => {
    try { await submitApplication(formData); } catch (err) { ... }
  });
}
```

## Styling

**Tailwind CSS v4**, configured CSS-first via `@tailwindcss/postcss`. There is no
`tailwind.config.*` — the theme lives in the `@theme` block in `app/globals.css`.

The full token list, primitive inventory, dark-mode mechanics and the rules for extending
any of it are in **[DESIGN.md](./DESIGN.md)**. The two rules you need before writing a
component:

1. **Never write a literal palette class** (`neutral-700`, `white`, `indigo-600`). Use the
   semantic token — `bg-surface`, `text-fg-muted`, `border-border`, `bg-ink`,
   `text-success` — and dark mode works with no extra annotation. It is also what makes the
   console register work: `.o-console` re-declares those same names, so a primitive written
   this way re-skins in the back office with no change at the call site.
2. **Compose classNames with `cn()`** (`lib/cn.ts`, `clsx` + `tailwind-merge`) so a
   caller's `className` overrides a primitive's default instead of appending to it.
3. **Two registers, one token layer.** Editorial on the public funnel, Odoo-enterprise
   inside `.o-console` (`/company`, `/jobseeker`, `/admin`). Never hard-code a radius or a
   density that assumes one of them — use `rounded-card` / `rounded-control` /
   `rounded-pill`, which resolve per register.

Inline `style={{}}` is reserved for values Tailwind cannot express — currently only the
ambient canvas gradients, which reference CSS custom properties directly.

## Accessibility

We target **WCAG 2.2 Level AA**. Automated checks run in CI via `@axe-core/playwright` in **both themes**, against five public seed pages (`/`, `/jobs`, `/companies`, `/sign-in`, `/sign-up`) plus the authenticated console surfaces when Clerk creds are present (`tests/e2e/a11y.spec.ts`). Critical / serious violations fail the build. Every console foreground/background pair was contrast-checked before landing; the tightest is `--fg-subtle` on `--canvas` at 4.78:1.

Patterns:

- Every interactive element has either visible text or `aria-label`.
- Form fields use proper `<label>` association (`htmlFor` or wrapped).
- Color contrast ≥ 4.5:1 for body text.
- Focus rings visible (`focus-visible:ring`).
- Dialogs / popovers use Radix primitives — the header `ThemeToggle` (`@radix-ui/react-dropdown-menu`) is the first call site; reach for the same library rather than hand-rolling another one.
- Skip-to-content link in `app/layout.tsx` (TODO when a header lands).
- Tab order matches DOM order.

Manual SR test on the apply funnel before each release: NVDA on Windows + VoiceOver on macOS.

## SEO

| Surface            | What's done                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `<title>` per page | `export const metadata = { title: ... }` on every page                                          |
| OG / Twitter       | `generateMetadata` on `/jobs/[slug]` and `/companies/[slug]`                                    |
| JSON-LD JobPosting | `lib/seo/job-jsonld.ts` injected into `/jobs/[slug]`                                            |
| Sitemap            | `app/sitemap.ts` — pulls live jobs + verified companies                                         |
| Robots             | `app/robots.ts` — disallow `/api`, `/dashboard`, `/jobseeker`, `/company`, `/account`, `/admin` |
| Canonical URLs     | All slugs unique (`@unique` on `job_posts.slug`, `company_profiles.slug`)                       |

For Google Jobs indexing, the JSON-LD must contain: `title`, `description`, `datePosted`, `employmentType`, `hiringOrganization`, `jobLocation` (or `jobLocationType: TELECOMMUTE` for remote), and `validThrough`. The helper builds all of these.

## i18n (future)

Not in V1. When it lands (V1.5), structure:

- `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- Locales `en, es, fr, pt, ar`. Arabic flips `dir="rtl"` via i18n side effect.
- Translation files in `src/locales/<lang>/<namespace>.json`.
- Server Components: build-time translations via `next-intl` if we land on that.

Reserve `next.config.ts` `i18n` config + `<html lang>` for that work.

## Image handling

Still native `<img>` with `loading="lazy"` and explicit `width`/`height`, each with an
`eslint-disable` for `@next/next/no-img-element`. `images.remotePatterns` in
`next.config.ts` is already configured for Vercel Blob + Clerk avatars + Pixabay, so the
swap to `next/image` is unblocked — it is tracked in
[REMAINING_STEPS.md](./REMAINING_STEPS.md) rather than gated on the design system, which
has landed (see [DESIGN.md](./DESIGN.md)).

## Code splitting

Next 16 + Turbopack handles route-level splitting automatically. Push for component-level splitting only when a Client Component is heavy; use `dynamic(() => import('...'), { ssr: false })` for those.

Two live examples, both from the 2026-08-28 payload audit:

- `jobseeker/profile/bio-coach.tsx` keeps only the trigger button in the page
  bundle and imports the panel — and with it the whole AI SDK, 80 KB gzip — on
  first open. It is worth doing wherever a feature is behind a click and most
  visitors never make it.
- `instrumentation-client.ts` loads Sentry's Session Replay recorder (37 KB
  gzip, rrweb) through a dynamic import at first idle rather than passing it to
  `Sentry.init()`. Note it does _not_ use `Sentry.lazyLoadIntegration()`, which
  would fetch from `browser.sentry-cdn.com` — an origin the CSP does not allow.

## Performance budgets

Two gates, because they cover different things.

**Lighthouse CI** (`lighthouserc.js`), against the preview deployment:

- Performance ≥ 85, A11y ≥ 90 (error), Best Practices ≥ 95, SEO ≥ 95
- LCP ≤ 2500 ms, CLS ≤ 0.1, TBT ≤ 300 ms
- `total-byte-weight` ≤ 1.6 MB, `unused-javascript` ≤ 150 KB, `uses-rel-preconnect`

It runs on `/`, `/jobs`, `/sign-up`, `/sign-in` — public routes only. Lighthouse
has no session, so pointing it at a gated route would score the sign-in redirect
and call it a pass.

INP is deliberately _not_ asserted here: it needs real interactions and a lab run
never produces it. TBT is its lab proxy; field INP comes from Speed Insights.

**First-load JS budget** (`bun run perf:budget`, wired into `ci.yml` after the
build). This reads `.next/server/app/**/*.html`, sums the gzipped scripts each
prerendered shell requests, and fails over budget. Because it reads build output
rather than a running server it covers what Lighthouse cannot reach — `/onboarding`,
`/employer-setup`, the whole `/jobseeker` and `/company` console. Ceilings live at
the top of `scripts/check-bundle-budget.ts`; raising one needs a note in the commit
message saying what got heavier and why.

When you regress one, the PR fails. Profile with Vercel Speed Insights on the
preview URL — noting that it only reports for visitors who accepted analytics
cookies, so field coverage is partial by design (see [COMPLIANCE.md](./COMPLIANCE.md)).
