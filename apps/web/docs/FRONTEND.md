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
└── components/cookie-banner.tsx        'use client', global UI
```

**Naming**: page files are `page.tsx`; client islands sit next to them named after the feature (`apply-form.tsx`, `applications-list.tsx`); never a giant `client.tsx` catch-all.

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

## Server Actions

Pattern:

```ts
'use server';
export async function doThing(input: Z): Promise<R> {
  const user = await requireRole('JOB_SEEKER');
  const rl = await someLimit(user.id);
  if (!rl.success) throw new Error('rate limit');
  const parsed = SomeSchema.parse(input);

  // tenancy / ownership check

  const result = await withAudit(
    { actorId: user.id, ip, ua },
    { action: 'X_HAPPENED', entity: 'thing' },
    async (tx) => tx.thing.create({ data: ... }),
  );

  updateTag(tags.foo(...));
  return result;
}
```

Six steps, in this order: auth → rate-limit → validate → ownership → mutate-with-audit → invalidate. Skipping any one is a bug. See [BACKEND.md](./BACKEND.md) for the full Server Action contract.

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
   `text-success` — and dark mode works with no extra annotation.
2. **Compose classNames with `cn()`** (`lib/cn.ts`, `clsx` + `tailwind-merge`) so a
   caller's `className` overrides a primitive's default instead of appending to it.

Inline `style={{}}` is reserved for values Tailwind cannot express — currently only the
ambient canvas gradients, which reference CSS custom properties directly.

## Accessibility

We target **WCAG 2.2 Level AA**. Automated checks run in CI via `@axe-core/playwright` against five seed pages (`/`, `/jobs`, `/companies`, `/sign-in`, `/sign-up`). Critical / serious violations fail the build.

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

Next 16 + Turbopack handles route-level splitting automatically. Push for component-level splitting only when a Client Component is heavy (e.g. a rich text editor); use `dynamic(() => import('...'), { ssr: false })` for those.

## Performance budgets

Enforced via `lighthouserc.json` in CI:

- Performance ≥ 85
- A11y ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95
- LCP ≤ 2500ms
- INP ≤ 200ms
- CLS ≤ 0.1

When you regress one, the PR fails. Profile with Vercel Speed Insights on the preview URL.
