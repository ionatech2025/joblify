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
      // Public routes only — Lighthouse has no session, and pointing it at a
      // gated route would score the sign-in redirect and call it a pass. The
      // authenticated console is covered instead by the payload budget in
      // scripts/check-bundle-budget.ts, which reads the build output and so
      // needs no session at all.
      url: ['/', '/jobs', '/sign-up', '/sign-in'],
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
        // Core Web Vitals, at Google's own "good" thresholds.
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        // INP replaced FID as a Core Web Vital in March 2024 and was the one
        // vital nothing here watched — unlucky, because a heavy JS payload
        // damages responsiveness first and LCP only later. INP itself needs
        // real interactions, so a lab run never produces it (the reasoning
        // already recorded in REMAINING_STEPS.md); total-blocking-time is its
        // lab proxy and is what can actually be asserted. Field INP comes from
        // Speed Insights.
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        // Payload ceilings. The audit that prompted these found ~1.3 MB of
        // uncompressed JS on every route with nothing in CI able to notice.
        'total-byte-weight': ['warn', { maxNumericValue: 1_600_000 }],
        'unused-javascript': ['warn', { maxNumericValue: 150_000 }],
        // Third-party origins on the critical path need a connection hint —
        // this is the assertion that would have caught the missing Clerk
        // preconnect.
        'uses-rel-preconnect': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
