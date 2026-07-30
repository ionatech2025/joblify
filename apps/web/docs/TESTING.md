# Testing

Four layers, with a clear contract for what belongs where.

| Layer             | Tool                                | Files                    | Run command                |
| ----------------- | ----------------------------------- | ------------------------ | -------------------------- |
| Unit              | Vitest                              | `tests/unit/*.test.ts`   | `bun run test`             |
| Integration / e2e | Playwright                          | `tests/e2e/*.spec.ts`    | `bun run test:e2e`         |
| Accessibility     | Playwright + `@axe-core/playwright` | `tests/e2e/a11y.spec.ts` | part of `bun run test:e2e` |
| Load              | k6                                  | `tests/load/*.js`        | `k6 run <file>`            |
| Lighthouse        | LHCI                                | `lighthouserc.json`      | runs on PR preview deploys |

## Unit (Vitest)

Pure functions, schemas, store reducers, prompt builders. No DB, no network.

```ts
import { describe, expect, it } from 'vitest';
import { rankScore } from '@/lib/search/ranking';

describe('rankScore', () => {
  it('weights skill overlap', () => {
    const a = rankScore({
      algoliaScore: 0.5,
      skillOverlap: 0,
      daysSincePosted: 0,
      salaryFitDelta: 0,
      geoDistanceKm: null,
      employerQuality: 0,
    });
    const b = rankScore({
      algoliaScore: 0.5,
      skillOverlap: 1,
      daysSincePosted: 0,
      salaryFitDelta: 0,
      geoDistanceKm: null,
      employerQuality: 0,
    });
    expect(b).toBeGreaterThan(a);
  });
});
```

What's already covered:

- `tests/unit/health.test.ts` — cache tag namespacing.
- `tests/unit/stores.test.ts` — search-store reducer.
- `tests/unit/auth.test.ts` — AuthError shape.

Add tests as you add features. Aim for >70% coverage on `lib/`, >50% on `app/`.

## Integration / e2e (Playwright)

Real browser hitting a real (or stubbed) backend. Five critical paths gate Week 12 cutover.

```ts
// tests/e2e/critical-paths.spec.ts
test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/v1/health');
  expect(res.ok()).toBeTruthy();
});
```

What's wired today:

- Health check.
- Home renders.
- Jobs search page loads.
- JD 404 on unknown slug.
- Protected routes redirect to `/sign-in`.

Implemented in `tests/e2e/authenticated.spec.ts`, gated on `E2E_TEST_*` so they skip (not fail) without creds:

- Jobseeker applications dashboard renders.
- GDPR export request surfaces a download/confirmation.
- Company posts a job and sees it on the jobs list.

Still manual pre-cutover (file upload to Blob + cross-user notification timing + external OAuth are unreliable headless): apply-with-upload → confirmation email, status change → notification within 30 s, LinkedIn/Google OAuth signup.

The harness: `tests/e2e/auth.setup.ts` signs into a Clerk dev instance via `@clerk/testing` and saves a per-role storage state; `playwright.config.ts` adds the `setup` project only when creds are present. Configure `E2E_TEST_EMAIL_JOBSEEKER`, `E2E_TEST_EMAIL_COMPANY`, `E2E_TEST_PASSWORD`; Clerk dev allows password sign-in even when prod requires MFA.

Run locally:

```bash
bun run test:e2e
```

Run against a preview deploy:

```bash
PLAYWRIGHT_BASE_URL=https://joblify-web-<sha>.vercel.app bun run test:e2e
```

Configured browsers: Chromium + Firefox + WebKit. All three must pass.

## Accessibility (axe-core)

`tests/e2e/a11y.spec.ts` runs axe against five public seed pages —

- `/`
- `/jobs`
- `/companies`
- `/sign-in`
- `/sign-up`

— **in both light and dark themes**, driven by Playwright's `colorScheme` (which exercises
the real `system` resolution path through `components/theme-script.tsx`). Dark mode is
scanned because contrast is where a semantic token layer most easily regresses: the footer
already needed neutral-400 rather than neutral-500 to clear 4.5:1 on ink.

Authenticated surfaces (`/jobseeker/*`, `/company/*`, the resume builder) are scanned too,
using the Playwright `setup` project's `storageState`; they skip cleanly without
`E2E_TEST_*` creds. The applicants board needs a job id and so isn't a static path — it is
covered functionally by `workflows.spec.ts` and tracked in
[REMAINING_STEPS.md](./REMAINING_STEPS.md).

> **What the `/sign-in` and `/sign-up` scans do _not_ cover locally.** A no-vendor run uses
> a format-valid _placeholder_ Clerk publishable key, which clerk-js rejects at runtime — so
> `<SignIn>`/`<SignUp>` never mount and **no Clerk markup is in the page at all**. Those two
> scans are therefore exercising the split-screen shell, not the auth form. The same applies
> to the light/dark appearance sets in `components/clerk-provider.tsx`. Both only get real
> coverage on a preview deploy with a live key, which is where the CI `axe` job runs.

Run locally or against a preview: `PLAYWRIGHT_BASE_URL=<url> bun run test:e2e`. In CI the
blocking gate is the `axe` job in `.github/workflows/lighthouse.yml`, which runs this spec
against the preview deploy on `deployment_status` — a CI-spun server can't reach Chromium
reliably (no loopback proxy/DNS in the runner) and has no real services. Tags: `wcag2a`,
`wcag2aa`, `wcag21a`, `wcag21aa`; critical/serious violations fail.

Add a page to the rotation:

```ts
const PAGES = [
  { path: '/', label: 'home' },
  // ...
  { path: '/your-new-page', label: 'description' },
];
```

When a violation surfaces, the offending node + rule prints to the test log. Fix the markup; don't suppress the rule unless there's an genuine equivalent (which means tagging the suppression with `<!-- WCAG: ... -->` and documenting in the page).

Manual SR pass once per release on the critical funnels: NVDA on Windows, VoiceOver on macOS.

## Load (k6)

Two scripts:

### `tests/load/k6-search.js`

Stresses `/api/v1/jobs/search`. Targets:

- 200 RPS sustained, 5 min.
- p95 < 500 ms.
- Error rate < 1%.

```bash
k6 run -e BASE_URL=https://joblify-web-prod.vercel.app tests/load/k6-search.js
```

### `tests/load/k6-apply.js`

Stresses the read-side of the apply funnel. Server Actions can't easily be scripted without a full Clerk session, so this script hits `/api/v1/applications` as a proxy for the auth + DB cost.

```bash
k6 run -e BASE_URL=https://joblify-web-prod.vercel.app tests/load/k6-apply.js
```

Targets:

- 20 RPS sustained, 3 min.
- p95 < 1500 ms.
- Error rate < 2%.

Run before every cutover and quarterly thereafter. Increase RPS as user base grows.

## Lighthouse (LHCI)

`lighthouserc.json` defines the budgets. **Accessibility is the only one asserted at
`error`** — the rest are `warn` until their gaps close (see
[REMAINING_STEPS.md](./REMAINING_STEPS.md)):

| Assertion                   | Level     | Threshold                       |
| --------------------------- | --------- | ------------------------------- |
| `categories:accessibility`  | **error** | 0.90 (raise to 0.95 once clean) |
| `categories:performance`    | warn      | 0.85                            |
| `categories:best-practices` | warn      | 0.95                            |
| `categories:seo`            | warn      | 0.95 (currently ~0.82)          |
| `largest-contentful-paint`  | warn      | ≤ 2500 ms                       |
| `cumulative-layout-shift`   | warn      | ≤ 0.1                           |

INP is a field-only metric and is deliberately absent from the lab assertions.

Pages tested: `/`, `/jobs`, `/sign-up`, 3 runs each, desktop preset. LHCI is wired: the
`lhci` job in `.github/workflows/lighthouse.yml` runs `treosh/lighthouse-ci-action` against
the preview `target_url` on `deployment_status`.

## CI gates

`.github/workflows/ci.yml` runs on every push / PR:

1. `bun install --frozen-lockfile`.
2. `bunx prisma validate` + `bunx prisma generate`.
3. `bun run lint`.
4. `bun run typecheck`.
5. `bun run test` (Vitest unit).
6. `bun run build`.
7. (parallel job) gitleaks scan.

Accessibility runs against the **preview deploy** via Lighthouse CI (`.github/workflows/lighthouse.yml`), not a CI-spun server.

A PR cannot merge without all jobs green.

## Local dev test loop

```bash
# Fast feedback while building a feature
bun run test:watch                       # vitest in watch mode

# Pre-PR
bun run lint && bun run typecheck && bun run test
bun run build
bunx prisma validate

# Heavy
bun run test:e2e                         # against bun run dev on :3000
```

## Test fixtures

- **Database**: use a Neon **preview branch** per test run. Set `DATABASE_URL` to the branch URL; tests truncate + reseed in a `beforeAll`.
- **Clerk**: use Clerk's **Development Instance** in test mode. Pre-create two users (JOB_SEEKER and COMPANY) via the Clerk dashboard; export their session JWTs once and reuse in Playwright.
- **AI Gateway**: mock via MSW for unit/integration; hit real Gateway in nightly e2e (rate-limited).
- **Algolia**: dev index; the test setup seeds a known small set of jobs and asserts on them.

## Adding a new test

| Type                                    | Where                                                                                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validates a Zod schema or pure function | `tests/unit/<feature>.test.ts`                                                                                                                             |
| Validates a Server Action (mocked DB)   | `tests/unit/<feature>.test.ts` with `vi.mock('@/lib/db')`                                                                                                  |
| Validates a Route Handler shape         | `tests/e2e/<feature>.spec.ts` using `request.get`                                                                                                          |
| Validates a user flow                   | `tests/e2e/critical-paths.spec.ts` or its own spec                                                                                                         |
| Validates a page for a11y               | add to the appropriate list in `tests/e2e/a11y.spec.ts` (`DEFAULT_PAGES`, `JOBSEEKER_PAGES`, `COMPANY_PAGES`) — it is scanned in both themes automatically |
| Validates a design-system contract      | `tests/e2e/design-regression.spec.ts`                                                                                                                      |
| Validates throughput                    | `tests/load/k6-<endpoint>.js`                                                                                                                              |

## Design-system regression

`tests/e2e/design-regression.spec.ts` locks the design contract with **DOM queries and
computed-style assertions — no pixel snapshots**. That is deliberate: every assertion has
to hold both in a no-vendor local run and against a full preview, and screenshots would be
flaky across the Chromium/Firefox/WebKit matrix.

What it locks: pill radii on the hero and header CTAs, `.eyebrow`/`.display` presence, the
dark footer band (parsing both `lab()` and `rgb()` computed serializations), skip-link-first
focus order, the split-auth viewport flip, 404 treatment, every semantic token resolving on
`:root`, the fonts resolving to Archivo/Inter, the light↔dark flip repainting surfaces _and_
persisting across reload, the footer band **not** inverting in dark mode, the command
palette (shortcut, filtering, empty state, Escape, theme switching), and
`prefers-reduced-motion` neutralising transitions.

See [DESIGN.md](./DESIGN.md) for the tokens these assertions are written against.

## What we don't test (and why)

- **Pixel-level appearance** — no Percy/Chromatic. The token and computed-style assertions
  above cover the contract that actually breaks; a screenshot diff would mostly generate
  noise across three browser engines.
- **Clerk internals** — vendor responsibility.
- **Algolia internals** — vendor responsibility; we test our adapter, not the index.
- **AI model output** — test the schema / typing, not the wording.

## What still needs work

- Real Clerk dev-instance creds wired into CI so the authenticated specs run (the harness + specs exist; CI skips them without `E2E_TEST_*`).
- LHCI now runs against preview URLs (`.github/workflows/lighthouse.yml`) — confirm budgets pass on the first real preview.
- k6 scripts (`tests/load/k6-search.js`, `tests/load/k6-apply.js`) against a load-test Neon branch (separate from production).
- Vitest integration tests for the four AI workflows.
- Contract tests on `/api/v1/*` shapes once the mobile client lands.
