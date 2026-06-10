import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  // migrate deploy uses the schema's directUrl (DATABASE_URL_UNPOOLED) — pooled
  // PgBouncer connections can't run DDL. This is the Vercel build only; GitHub CI
  // runs `next build` directly, so it never touches a database.
  buildCommand: 'prisma generate && prisma migrate deploy && bun run build',
  installCommand: 'bun install --frozen-lockfile',
  // Multi-region functions are Pro/Enterprise-only. On Pro, restore the EU set
  // for data residency: regions: ['fra1', 'dub1', 'iad1'].

  crons: [
    { path: '/api/v1/cron/digest-email', schedule: '0 8 * * *' },
    { path: '/api/v1/cron/retention', schedule: '0 2 * * *' },
    // Daily to fit the Hobby-plan cron limit (one run/day). On Pro, tighten to
    // '*/15 * * * *' so the durable index outbox drains every 15 min.
    { path: '/api/v1/cron/algolia-reconcile', schedule: '0 3 * * *' },
  ],
};

export default config;
