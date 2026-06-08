# Deployment

How code goes from a local branch to production traffic.

## Topology

```
GitHub repo ─ push ─► CI (.github/workflows/ci.yml)
                        │
                        ▼
              ┌──────────────────┐
              │  Vercel build     │
              │  bun install      │
              │  bun run build    │
              └──────────────────┘
                        │
            ┌───────────┴────────────┐
            ▼                        ▼
       Preview deploy           Production deploy
       (per PR, ephemeral)      (on push to main)
            │                        │
            ▼                        ▼
       Neon branch              Neon default branch
       Clerk dev instance       Clerk prod instance
       Vercel preview URL       joblify-domain
```

## Branch strategy

- **`main`** — production. Protected. Requires green CI + 1 reviewer + linear history.
- **Feature branches** — short-lived. Open a PR; Vercel auto-creates a preview deploy + Neon DB branch.
- **No long-lived release branches** — every commit on `main` is releasable.

## CI pipeline

`.github/workflows/ci.yml`:

| Job | Steps |
|---|---|
| `web` | install → prisma validate/generate → lint → typecheck → unit tests → build |
| `gitleaks` | scan for committed secrets |

Both must pass to merge. Accessibility is gated separately on the preview deploy via Lighthouse CI (`.github/workflows/lighthouse.yml`) — its accessibility category is axe-core (`minScore 0.95`) and runs against real URLs + services, which a CI-spun server can't.

CI uses placeholder env so it can build without provisioned services:

```yaml
env:
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/joblify?schema=public'
  # FORMAT-VALID Clerk key required (pk_test_<base64 of "domain$">): the build
  # prerenders <ClerkProvider>, which decodes it. A bare placeholder fails.
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k'
  CLERK_SECRET_KEY: 'sk_test_placeholderplaceholderplaceholder'
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000'
```

Production secrets live in Vercel; CI doesn't need them to compile.

## Vercel build pipeline

Configured in `vercel.ts`:

```ts
framework: 'nextjs',
buildCommand: 'prisma generate && bun run build',
installCommand: 'bun install --frozen-lockfile',
regions: ['fra1', 'dub1', 'iad1'],
crons: [
  { path: '/api/v1/cron/digest-email', schedule: '0 8 * * *' },
  { path: '/api/v1/cron/retention', schedule: '0 2 * * *' },
  { path: '/api/v1/cron/algolia-reconcile', schedule: '*/15 * * * *' },
],
```

Build steps:

1. Vercel detects Bun via `packageManager` in `package.json`.
2. `bun install --frozen-lockfile` resolves deps from `bun.lock`.
3. `prisma generate` runs automatically via the `postinstall` hook (and is prepended to `buildCommand` as a safety net for cached installs).
4. `bun run build` invokes `next build`.
5. Vercel ships artifacts to the edge + Fluid Compute runtime.

## Environments

| Environment | URL | DB | Clerk | Use |
|---|---|---|---|---|
| Production | `https://<your-prod-domain>` | Neon default branch | Prod instance | Real users |
| Preview | `https://joblify-web-<sha>.vercel.app` | Neon branch (per PR) | Dev instance | PR review, QA |
| Development | `http://localhost:3000` | Neon dev branch or local PG | Dev instance | Local dev |

Env vars are scoped per environment in the Vercel dashboard. Most Marketplace integrations auto-inject across all three scopes; tighten if a key shouldn't leak to Preview.

## Preview deploys

Every PR gets:

- A Vercel preview URL.
- A Neon DB branch cloned from the default (or a recent prod snapshot) at PR open; deleted on PR close.
- All Marketplace env vars from the **Preview** scope.

Manual deploy of a feature branch:

```bash
bunx vercel deploy
```

Returns a URL like `joblify-web-<sha>.vercel.app`.

## Production deploys

Two ways:

### 1. Push to `main` (automatic)

Push to `main` → Vercel triggers a build → if green, the build becomes the production deployment.

### 2. Promote a preview (recommended for high-risk changes)

1. Open the PR's preview URL in Vercel dashboard.
2. **Promote to Production** button.
3. Confirm.

This way you can soak a build for hours/days as a preview before promoting — the deploy artifacts are reused, no rebuild.

### Rolling Releases

Production deploys go through Vercel **Rolling Releases**:

1. New deploy starts at 5% traffic.
2. After 30 min clean (no Sentry spike, no Vercel alert), escalate to 25%.
3. After 60 min clean at 25%, full cutover.

If anything breaks: dashboard → set previous deployment to 100% (one click). No DNS change needed.

Configure in the Vercel project settings → **Rolling Releases**.

## Rollback

1. Vercel dashboard → **Deployments**.
2. Find the last good deployment.
3. **Promote to Production**.
4. Done. DNS unchanged.

If a database migration was part of the bad deploy, rolling back code alone doesn't restore data. For DB rollbacks, use Neon PITR — see [DATABASE.md](./DATABASE.md).

## Database migrations in CI/CD

Migrations are **not run by Vercel build** today. Run manually before promoting:

```bash
bunx prisma migrate deploy
```

against the production `DATABASE_URL_UNPOOLED` (pull via `bunx vercel env pull --environment=production .env.prod`, then `DATABASE_URL=$(grep DATABASE_URL_UNPOOLED .env.prod | cut -d= -f2-) bunx prisma migrate deploy`).

For Week 11 / 12 hardening, consider a GitHub Action job that runs migrations on push to `main` *before* Vercel promotes:

```yaml
- name: Migrate database
  run: bunx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_UNPOOLED }}
```

(Add this in the cutover PR; not in V1 to keep the surface small.)

## Domains

1. Vercel project → **Settings → Domains**.
2. Add `joblify.app` (or your apex).
3. Configure DNS at your registrar — Vercel shows the exact records.
4. Wait for verification.
5. Add `www.joblify.app` as a redirect to the apex.

Set `NEXT_PUBLIC_SITE_URL` to the apex in Production env vars.

TLS is automatic (Let's Encrypt via Vercel). HSTS header is set in `next.config.ts`.

## Cron jobs

Defined in `vercel.ts`. Vercel runs them automatically once deployed; no separate cron service.

Manual trigger (for debugging or one-off needs):

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  "https://your-prod-domain/api/v1/cron/<name>"
```

`CRON_SECRET` is set in Vercel env. Cron routes refuse traffic without it.

## Feature flags

Vercel Edge Config (`@vercel/edge-config`) for runtime kill-switches and gradual rollouts. Not wired in V1; add when needed.

Pattern:

```ts
import { get } from '@vercel/edge-config';

const aiBioCoachEnabled = await get('ai_bio_coach_enabled');
if (!aiBioCoachEnabled) return new Response('disabled', { status: 503 });
```

Edge Config reads are instantaneous from anywhere in the Vercel runtime.

## CD safety checklist

Before merging to `main`:

- [ ] CI green.
- [ ] Preview deploy URL opens and the new surface works.
- [ ] If schema changed: migration tested on a Neon staging branch.
- [ ] If new env var added: scoped to Production + Preview, `.env.example` updated with placeholder.
- [ ] If new AI prompt added: cache breakpoints in place, budget cap configured.
- [ ] If new route added: middleware + layout gating set correctly.
- [ ] If new mutation added: `withAudit` wraps it.

Skipping any one is a bug.

## Logs + alerts during deploy

Watch the deploy in the Vercel dashboard:

- **Build logs** — first 2 min. Most errors surface here.
- **Function logs** — for the first 5 min after promote. Sudden surge in errors = roll back.
- **Sentry** — set up a deploy-aware filter: "errors in the last 10 min on deploy <sha>" — investigate any new issue.
- **Vercel Observability traces** — confirm key endpoints (`/api/v1/health`, `/api/v1/jobs/search`) are < SLO.

## What's left to wire

Documented in [REMAINING_STEPS.md](./REMAINING_STEPS.md). Highlights for deployment:

- DB migration step in CI before Vercel promote.
- LHCI against preview URLs.
- Synthetic health check via Vercel Cron paging into PagerDuty.
- Rolling Release auto-rollback policy (currently manual).
