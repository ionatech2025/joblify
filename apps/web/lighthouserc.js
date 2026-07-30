// JS rather than lighthouserc.json specifically so collect.settings.extraHeaders
// can carry the Vercel Deployment Protection bypass header from an env var —
// static JSON can't read process.env. Without it, LHCI scores Vercel's SSO
// redirect page on preview deployments instead of the app: a deceptive pass,
// not a real one. No-op locally/on unprotected targets: header is only sent
// when the env var is set.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

module.exports = {
  ci: {
    collect: {
      url: ['/', '/jobs', '/sign-up'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        ...(bypassSecret ? { extraHeaders: { 'x-vercel-protection-bypass': bypassSecret } } : {}),
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.95 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
