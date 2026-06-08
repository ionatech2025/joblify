# Frontend

How the React / Next.js side is organized and the conventions you should follow when adding to it.

## Rendering decision tree

1. **Does the page need SEO or fast first-paint?** → Server Component, ideally inside `(marketing)` with `'use cache'`.
2. **Does the page require auth?** → Server Component inside `(authenticated)` or `(company)`. The layout enforces `requireUser` / `requireRole`.
3. **Does a sub-tree need interactivity (forms, polling, state)?** → split that sub-tree into a Client Component (`'use client'`). Pass server-rendered data as props.
4. **Is the user data fundamentally per-request?** → fully dynamic RSC. No cache.

The default is "Server Component until you need a client." `'use client'` is the cost; minimize it.

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

- `ui.ts` — theme (persisted), mobile menu, cookie banner state.
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
import { PostJobFormSchema } from '../(company)/jobs/new/post-job-form';
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

  revalidateTag(tags.foo(...));
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

V1 uses inline styles to keep the bundle minimal and avoid a Tailwind dependency. The legacy frontend has Tailwind + Radix; if you want to bring those over, do it in a single PR with a `<ThemeProvider>` + `tailwind.config.ts` + `globals.css` update. Until then, inline styles + `style={...}` objects are fine — these pages are mostly skeletons that will be redesigned with a designer.

When inline styles get unwieldy:
- Extract repeated style objects to module-level `const` (see `inputStyle` / `buttonStyle` in `jobs-search.tsx`).
- Bring in Tailwind 4 via `@tailwindcss/postcss` in a single follow-up PR.

## Accessibility

We target **WCAG 2.2 Level AA**. Automated checks run in CI via `@axe-core/playwright` against five seed pages (`/`, `/jobs`, `/companies`, `/sign-in`, `/sign-up`). Critical / serious violations fail the build.

Patterns:

- Every interactive element has either visible text or `aria-label`.
- Form fields use proper `<label>` association (`htmlFor` or wrapped).
- Color contrast ≥ 4.5:1 for body text.
- Focus rings visible (`focus-visible:ring`).
- Dialogs / popovers use Radix primitives if you reach for them in the future.
- Skip-to-content link in `app/layout.tsx` (TODO when a header lands).
- Tab order matches DOM order.

Manual SR test on the apply funnel before each release: NVDA on Windows + VoiceOver on macOS.

## SEO

| Surface | What's done |
|---|---|
| `<title>` per page | `export const metadata = { title: ... }` on every page |
| OG / Twitter | `generateMetadata` on `/jobs/[slug]` and `/companies/[slug]` |
| JSON-LD JobPosting | `lib/seo/job-jsonld.ts` injected into `/jobs/[slug]` |
| Sitemap | `app/sitemap.ts` — pulls live jobs + verified companies |
| Robots | `app/robots.ts` — disallow `/api`, `/dashboard`, `/jobseeker`, `/company`, `/account`, `/admin` |
| Canonical URLs | All slugs unique (`@unique` on `job_posts.slug`, `company_profiles.slug`) |

For Google Jobs indexing, the JSON-LD must contain: `title`, `description`, `datePosted`, `employmentType`, `hiringOrganization`, `jobLocation` (or `jobLocationType: TELECOMMUTE` for remote), and `validThrough`. The helper builds all of these.

## i18n (future)

Not in V1. When it lands (V1.5), structure:

- `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- Locales `en, es, fr, pt, ar`. Arabic flips `dir="rtl"` via i18n side effect.
- Translation files in `src/locales/<lang>/<namespace>.json`.
- Server Components: build-time translations via `next-intl` if we land on that.

Reserve `next.config.ts` `i18n` config + `<html lang>` for that work.

## Image handling

V1 uses native `<img>` with `loading="lazy"` and explicit `width`/`height`. When the design system arrives, swap to `next/image` and configure `images.remotePatterns` in `next.config.ts` (already pre-configured for Vercel Blob + Clerk avatars + Pixabay).

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
