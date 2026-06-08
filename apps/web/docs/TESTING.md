# Testing

Four layers, with a clear contract for what belongs where.

| Layer | Tool | Files | Run command |
|---|---|---|---|
| Unit | Vitest | `tests/unit/*.test.ts` | `bun run test` |
| Integration / e2e | Playwright | `tests/e2e/*.spec.ts` | `bun run test:e2e` |
| Accessibility | Playwright + `@axe-core/playwright` | `tests/e2e/a11y.spec.ts` | part of `bun run test:e2e` |
| Load | k6 | `tests/load/*.js` | `k6 run <file>` |
| Lighthouse | LHCI | `lighthouserc.json` | runs on PR preview deploys |

## Unit (Vitest)

Pure functions, schemas, store reducers, prompt builders. No DB, no network.

```ts
import { describe, expect, it } from 'vitest';
import { rankScore } from '@/lib/search/ranking';

describe('rankScore', () => {
  it('weights skill overlap', () => {
    const a = rankScore({ algoliaScore: 0.5, skillOverlap: 0, daysSincePosted: 0, salaryFitDelta: 0, geoDistanceKm: null, employerQuality: 0 });
    const b = rankScore({ algoliaScore: 0.5, skillOverlap: 1, daysSincePosted: 0, salaryFitDelta: 0, geoDistanceKm: null, employerQuality: 0 });
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

`tests/e2e/a11y.spec.ts` runs axe against five seed pages:

- `/`
- `/jobs`
- `/companies`
- `/sign-in`
- `/sign-up`

CI fails on any **critical** or **serious** axe violation. Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

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

`lighthouserc.json` defines budgets:

```json
{
  "categories:performance": [{ "minScore": 0.85 }],
  "categories:accessibility": [{ "minScore": 0.95 }],
  "categories:best-practices": [{ "minScore": 0.95 }],
  "categories:seo": [{ "minScore": 0.95 }],
  "largest-contentful-paint": [{ "maxNumericValue": 2500 }],
  "interaction-to-next-paint": [{ "maxNumericValue": 200 }],
  "cumulative-layout-shift": [{ "maxNumericValue": 0.1 }]
}
```

Pages tested: `/`, `/jobs`, `/sign-up`.

Wire LHCI against PR preview URLs (TODO Week 11 — uses `treosh/lighthouse-ci-action` against the deployment URL).

## CI gates

`.github/workflows/ci.yml` runs on every push / PR:

1. `bun install --frozen-lockfile`.
2. `bunx prisma validate` + `bunx prisma generate`.
3. `bun run lint`.
4. `bun run typecheck`.
5. `bun run test` (Vitest unit).
6. `bun run build`.
7. (parallel job) gitleaks scan.
8. (parallel job) axe smoke against built app.

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

| Type | Where |
|---|---|
| Validates a Zod schema or pure function | `tests/unit/<feature>.test.ts` |
| Validates a Server Action (mocked DB) | `tests/unit/<feature>.test.ts` with `vi.mock('@/lib/db')` |
| Validates a Route Handler shape | `tests/e2e/<feature>.spec.ts` using `request.get` |
| Validates a user flow | `tests/e2e/critical-paths.spec.ts` or its own spec |
| Validates a page for a11y | add to `tests/e2e/a11y.spec.ts` PAGES list |
| Validates throughput | `tests/load/k6-<endpoint>.js` |

## What we don't test (and why)

- **Tailwind / inline style output** — visual regressions live in design tooling (Percy / Chromatic) when a design system lands.
- **Clerk internals** — vendor responsibility.
- **Algolia internals** — vendor responsibility; we test our adapter, not the index.
- **AI model output** — test the schema / typing, not the wording.

## What still needs work

- Real Clerk dev-instance creds wired into CI so the authenticated specs run (the harness + specs exist; CI skips them without `E2E_TEST_*`).
- LHCI now runs against preview URLs (`.github/workflows/lighthouse.yml`) — confirm budgets pass on the first real preview.
- k6 scripts (`tests/load/k6-search.js`, `tests/load/k6-apply.js`) against a load-test Neon branch (separate from production).
- Vitest integration tests for the four AI workflows.
- Contract tests on `/api/v1/*` shapes once the mobile client lands.
