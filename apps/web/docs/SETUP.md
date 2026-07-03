# Setup

End-to-end bootstrap for a new developer machine. Plan on ~45 min the first time, including Marketplace clicks.

## Prerequisites

- **Bun ≥ 1.1.** `curl -fsSL https://bun.sh/install | bash`
- **Git ≥ 2.40.**
- A Vercel account with access to the team. If you don't have one yet: <https://vercel.com/signup>.
- A GitHub account with access to the repo.

## 1. Clone & install

```bash
git clone <repo-url>
cd <repo>/apps/web
bun install
```

Bun reads `package.json`, writes `bun.lock`, installs everything in `node_modules/`. Do not commit `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` — they're gitignored.

## 2. Link to Vercel

```bash
bunx vercel link
```

When prompted:
- Scope: pick the team.
- Project: **Create new project** → name it `joblify-web`.
- Root directory: `apps/web/`.
- Production branch: `main`.

Vercel reads `vercel.ts` for framework + install/build commands; you don't have to choose them in the wizard.

## 3. Install Marketplace integrations

In Vercel dashboard → **joblify-web** → **Integrations**. Install in this order. Each install auto-injects its env vars into Production + Preview + Development scopes; do not paste anything manually.

| Order | Integration | Why | Env vars injected |
|---|---|---|---|
| 1 | **Neon Postgres** | Database | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| 2 | **Upstash Redis** | Cache + rate-limit | `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN` |
| 3 | **Clerk** | Auth | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` |
| 4 | **Sentry** | Errors + traces | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| 5 | **Resend** | Transactional email | `RESEND_API_KEY` |
| 6 | **Algolia** | Search | `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_API_KEY`, `NEXT_PUBLIC_ALGOLIA_APP_ID`, `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` |

Neon + Upstash + Clerk are required to get past Week 2 locally. Sentry / Resend / Algolia can wait until Week 4–6 work.

## 4. Manual env vars (not provided by Marketplace)

Set these via the Vercel dashboard → **Settings → Environment Variables**.

| Name | Value | Scopes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production: `https://your-prod-domain` · Preview: leave blank · Development: `http://localhost:3000` | All |
| `CRON_SECRET` | `openssl rand -base64 48` output — generate a **separate** value per scope; never reuse the production secret in Development | All |
| `RESEND_WEBHOOK_SECRET` | Set after configuring Resend webhook (Step 8) | All |
| `EMAIL_FROM` | `Joblify <noreply@your-verified-domain>` | All |
| `AI_GATEWAY_API_KEY` | Auto-injected by Vercel in deploys; for local dev set from the Gateway dashboard | Development |

## 5. Pull env to local dev

```bash
bunx vercel env pull .env.local
```

`.env.local` is gitignored. Inspect it; never paste contents anywhere.
Re-pulling **overwrites the whole file** — keep manual local overrides in
`.env.development.local` instead.

`vercel env pull` downloads the **Development** scope only. As of 2026-07 that
scope holds the Neon vars (`DATABASE_URL*` plus the injected
`POSTGRES_*`/`PG*`/`NEON_*` aliases), the Clerk publishable/secret keys,
`NEXT_PUBLIC_SITE_URL` (`http://localhost:3000`), the Clerk sign-in/up paths,
and a dev-only `CRON_SECRET` — enough for `bun run dev` with database, auth,
and cron routes.

Still Production-only (sensitive type — Vercel can't read the values back;
fetch them from the provider dashboards): `CLERK_WEBHOOK_SECRET`,
`ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_API_KEY`. To add them to Development:

```bash
# values from Clerk dashboard → Webhooks and Algolia dashboard → API keys
vercel env add CLERK_WEBHOOK_SECRET development
vercel env add ALGOLIA_APP_ID development
vercel env add ALGOLIA_ADMIN_API_KEY development

bunx vercel env pull .env.local   # re-pull after adding
```

## 6. Enable Postgres extensions + run the initial migration

Once `DATABASE_URL` is in `.env.local`:

```bash
bunx prisma db execute --stdin <<SQL
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
SQL

bunx prisma migrate dev --name init
```

The migration runs in the Neon **default** branch. Preview branches inherit it automatically via Neon's branching integration.

After the migration, seed the starter skill taxonomy:

```bash
bun run seed:skills
```

## 7. Configure Clerk

In the Clerk dashboard for the project Vercel created:

1. **Social providers**: enable Google. Submit LinkedIn OIDC (review takes 2–4 weeks; ship Week 2 without it).
2. **MFA**: enable TOTP. Require it for organization roles by setting an authentication strength policy.
3. **Webhooks** → **+ Add Endpoint**:
   - URL: `${NEXT_PUBLIC_SITE_URL}/api/v1/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`, `organization.created`, `organization.updated`, `organization.deleted`, `organizationMembership.created`, `organizationMembership.deleted`.
   - Save. Copy the signing secret into Vercel as `CLERK_WEBHOOK_SECRET`.

## 8. Configure Resend

In the Resend dashboard:

1. **Domains** → verify the `EMAIL_FROM` domain (DKIM, SPF, DMARC).
2. **Webhooks** → **+ Add Endpoint**:
   - URL: `${NEXT_PUBLIC_SITE_URL}/api/v1/webhooks/resend`
   - Events: `email.bounced`, `email.complained`, `email.delivered_delayed`.
   - Save. Copy the signing secret into Vercel as `RESEND_WEBHOOK_SECRET`.

## 9. Configure Algolia

In the Algolia dashboard:

1. Create three indexes: `jobs`, `companies`, `skills`.
2. For `jobs`: searchable attributes `title, description, companyName, skills, location`; ranking custom by `publishedAt desc`; facets `industry, jobType, experienceLevel, workMode`.
3. Tune typo tolerance + synonyms after first traffic.

## 10. Verify locally

```bash
bun run dev
```

- Open <http://localhost:3000> — marketing home renders.
- Open <http://localhost:3000/api/v1/health> — returns `{ status: "ok", ... }`.
- Open <http://localhost:3000/sign-in> — Clerk widget mounts.

```bash
bun run typecheck   # zero errors expected
bun run lint        # zero errors expected
bun run test        # vitest unit suite passes
```

## 11. First deploy

```bash
bunx vercel deploy           # preview deploy on your branch
# inspect the preview URL
bunx vercel deploy --prod    # production deploy when ready
```

Preview deploys get an ephemeral Neon DB branch via the Neon integration; production uses the default branch.

## 12. Optional: import data from legacy Mongo

If you have data in the legacy `joblify-tszx.onrender.com` Mongo cluster:

```bash
MONGO_URL='<legacy-uri>' DATABASE_URL='<neon-uri>' \
  bun run migrate:mongo
```

The script is idempotent — reruns produce the same UUIDs and upsert. Run it once against a Neon staging branch, verify counts, then again on Day-12 against production immediately before the cutover.

## 13. Optional: install pre-commit hooks

Husky lives at the repo root. Once `bun install` has run in `apps/web/`, husky auto-installs and `pre-commit` runs `lint-staged` against any staged `apps/web/` files.

## Troubleshooting

- **`Prisma client error: vector type not found`**: Postgres extensions weren't enabled. Re-run Step 6.
- **`bun run dev` crashes on Clerk import**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` missing from `.env.local`. Re-run `bunx vercel env pull`.
- **Vercel preview deploy 500s on `/api/v1/jobs/search`**: Algolia env vars missing on Preview scope. Set them or constrain the integration to Production until Week 4.
- **`bun install` fails on `pdf-parse`**: native build issue; reinstall with `bun install --trust pdf-parse`.
- **Clerk webhook events not arriving**: signing secret mismatch. The webhook endpoint in Clerk must use the same secret as the `CLERK_WEBHOOK_SECRET` env var in Vercel.

## Going forward

Day-to-day commands live in [../README.md](../README.md). Conventions live in [FRONTEND.md](./FRONTEND.md) and [BACKEND.md](./BACKEND.md). What's still outstanding is in [REMAINING_STEPS.md](./REMAINING_STEPS.md).
