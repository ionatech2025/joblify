import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'prisma generate && bun run build',
  installCommand: 'bun install --frozen-lockfile',
  regions: ['fra1', 'dub1', 'iad1'],
  crons: [
    { path: '/api/v1/cron/digest-email', schedule: '0 8 * * *' },
    { path: '/api/v1/cron/retention', schedule: '0 2 * * *' },
    { path: '/api/v1/cron/algolia-reconcile', schedule: '*/15 * * * *' },
  ],
};

export default config;
