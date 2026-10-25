// The mobile counterpart of lighthouserc.js. Same pages' worth of settings (the
// Deployment Protection bypass header comes from the same place), but with
// Lighthouse's default mobile emulation and simulated throttling — which is how
// Google scores Core Web Vitals, and where every layout, payload and main-thread
// defect found in the 2026-10-10 live audit lived. The desktop config alone let
// all of them through.
//
// Warn-level on purpose: a lab number from a shared CI runner against a live
// preview is noisy (single runs moved by seconds in the audit, mostly on the
// Clerk development-instance handshake), so this is a ratchet that makes a
// regression visible on the PR, not a gate that fails it. Thresholds sit just
// beyond what the live pages measured on 2026-10-10 (mobile medians of 3: perf
// 72-76, LCP 3.0-3.7 s, TBT 380-490 ms, ~330-355 KB); tighten them as the
// numbers come down, and never loosen one without saying what got slower.
// Self-contained rather than derived from lighthouserc.js: that file's settings
// are one header and one preset, and a require() here is a lint error in this
// repo. Keep the bypass header in step with it.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      // The home page and the job board: the two public pages that carry real
      // content and the most JavaScript. The sign-in/sign-up pages are left to
      // the desktop run; they load Clerk by design.
      url: ['/', '/jobs'],
      // No `preset`: Lighthouse's default is mobile emulation + simulated throttling.
      settings: bypassSecret
        ? { extraHeaders: { 'x-vercel-protection-bypass': bypassSecret } }
        : {},
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.65 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 800 }],
        'total-byte-weight': ['warn', { maxNumericValue: 500_000 }],
        'uses-rel-preconnect': 'warn',
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
