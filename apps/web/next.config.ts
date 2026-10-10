import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import { withBotId } from 'botid/next/config';
import { HTML_LIMITED_BOTS } from './lib/seo/html-limited-bots';

/**
 * Content Security Policy.
 *
 * The enforced policy still carries 'unsafe-inline' and 'unsafe-eval' on
 * script-src, which is the pair that makes a CSP stop mattering for XSS. That
 * is a real weakness and it is deliberate, for a reason worth writing down
 * because it is not obvious:
 *
 *   The textbook fix — a per-request nonce plus 'strict-dynamic' generated in
 *   middleware — is INCOMPATIBLE with this app's rendering model. Next reads
 *   the nonce off the request's own CSP header (app-render.js
 *   `getScriptNonceFromHeader`), so a nonce is request data, and reading
 *   request data opts a route out of prerendering. With cacheComponents: true
 *   every route here is a partial prerender; adopting nonces would collapse all
 *   of them to dynamic and undo the entire payload/PPR effort.
 *
 * So the exit path is hashes, not nonces: 'unsafe-inline' is ignored by the
 * browser as soon as a hash or nonce is present, and hashes are static, so they
 * survive prerendering. That needs stable hashes for Next's own inline
 * bootstrap plus ThemeScript, which is a build-time integration this repo
 * doesn't have yet.
 *
 * Meanwhile, two things that cost nothing and are done here:
 *   - img-src no longer allows every https origin. It lists the same hosts as
 *     images.remotePatterns below, so the two cannot drift.
 *   - the strict target policy ships as Report-Only alongside the enforced one,
 *     with violations reported to Sentry when a DSN is configured. That is what
 *     turns "we should tighten this" into a list of the exact inline scripts
 *     that would break — the same Report-Only shakedown this policy went
 *     through before it was first enforced.
 *
 * When moving to a Clerk production instance, add its domain
 * (clerk.<your-domain>) to script/connect/frame-src.
 */
const IMG_HOSTS =
  'https://*.public.blob.vercel-storage.com https://cdn.pixabay.com https://img.clerk.com';
const CLERK = 'https://*.clerk.accounts.dev';

const cspDirectives = (scriptSrc: string): string[] => [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${IMG_HOSTS}`,
  "font-src 'self' data:",
  `connect-src 'self' ${CLERK} https://*.algolia.net https://*.algolianet.com https://*.algolia.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.public.blob.vercel-storage.com`,
  "worker-src 'self' blob:",
  `frame-src 'self' ${CLERK} https://challenges.cloudflare.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

// 'unsafe-eval' is a DEVELOPMENT-only allowance: React's dev tooling rebuilds
// stack traces with eval, and the production build does not need it (it is also
// absent from the strict target policy below, which has been collecting
// violations — none from eval). Shipping it in production left the policy with
// both halves of the pair that stops a CSP from constraining script injection.
// This is the allowance the Next.js CSP guide itself makes dev-only.
const isDev = process.env.NODE_ENV !== 'production';
const csp = cspDirectives(
  `'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${CLERK} https://challenges.cloudflare.com https://va.vercel-scripts.com`,
).join('; ');

/**
 * Sentry's CSP collector, derived from the public DSN
 * (https://<key>@<host>/<projectId>). Returns null when Sentry isn't
 * provisioned, in which case the Report-Only policy is simply not sent —
 * a report-less Report-Only header only reaches a devtools console.
 */
function sentryCspReportUri(): string | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  try {
    const { username, host, pathname } = new URL(dsn);
    const projectId = pathname.replace(/^\//, '');
    if (!username || !projectId) return null;
    return `https://${host}/api/${projectId}/security/?sentry_key=${username}`;
  } catch {
    return null;
  }
}

// The target policy: no 'unsafe-inline', no 'unsafe-eval', 'strict-dynamic'
// carried by hashes once they exist. Report-Only, so it blocks nothing and
// only reports what a move to it would break.
const reportUri = sentryCspReportUri();
const cspReportOnly = reportUri
  ? [
      ...cspDirectives(
        `'self' ${CLERK} https://challenges.cloudflare.com https://va.vercel-scripts.com`,
      ),
      "require-trusted-types-for 'script'",
      `report-uri ${reportUri}`,
    ].join('; ')
  : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Crawlers that get <title>/<meta>/canonical in <head> rather than streamed
  // into <body>; see lib/seo/html-limited-bots.ts for the list and why.
  htmlLimitedBots: HTML_LIMITED_BOTS,
  poweredByHeader: false,
  // cacheComponents enables PPR + the 'use cache' directive (Next 16 merged the
  // former experimental.ppr into this flag and promoted it out of experimental).
  cacheComponents: true,
  // Next 16.4 asks for this to be explicit. `false` is the behaviour this app
  // was built and measured with (the first Cache Components release did not
  // have partial prefetching), so it is pinned rather than flipped on a minor
  // bump. Enabling it is a tracked follow-up (REMAINING_STEPS.md): it changes
  // what navigations prefetch and needs the e2e + payload budgets re-run.
  partialPrefetching: false,
  // React Compiler auto-memoizes every component, which is what this codebase
  // was relying on manual memoization for and never actually doing: 2 useMemo,
  // 1 useCallback and 0 memo() across the whole app. The console's dense list
  // views, kanban boards and long forms are the surfaces that pay for it.
  //
  // eslint-plugin-react-hooks was already reporting the compiler's bailouts
  // (`react-hooks/incompatible-library`) for a compiler that wasn't in the
  // build — all five were react-hook-form's `watch()`, and all five are gone:
  // the draft forms moved to lib/use-form-draft.ts and the two `watch('publish')`
  // value reads moved to useWatch. Keep that lint rule at error, not warn, so a
  // new bailout is a build failure rather than scrollback.
  reactCompiler: true,
  experimental: {
    // Server Actions accept request bodies up to 1 MB by default, which is
    // smaller than the 2 MB logo limit the upload action enforces (a valid logo
    // between 1 and 2 MB was rejected by the framework before any of our checks
    // ran). 4 MB stays under the platform's own 4.5 MB request-body ceiling.
    serverActions: { bodySizeLimit: '4mb' },
    // Next already ships lucide-react in its built-in list; @radix-ui packages
    // are not in it, and the dropdown menu is pulled in by the theme toggle and
    // the console filter menu, both of which are on shared surfaces.
    optimizePackageImports: ['@radix-ui/react-dropdown-menu'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Content-Security-Policy', value: csp },
          ...(cspReportOnly
            ? [{ key: 'Content-Security-Policy-Report-Only', value: cspReportOnly }]
            : []),
        ],
      },
    ];
  },
};

// Source-map upload + release tracking only activate when Sentry is provisioned.
// Without a DSN we ship the plain config so local/CI builds never depend on Sentry.
const withSentry = (config: NextConfig): NextConfig =>
  process.env.SENTRY_DSN
    ? withSentryConfig(config, {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        silent: !process.env.CI,
        widenClientFileUpload: true,
        disableLogger: true,
      })
    : config;

// withBotId installs the same-origin rewrites that proxy the bot-protection
// challenge — without them the client script 404s and `checkBotId()` decides on
// nothing. Applied outermost so Sentry sees the config it expects, and because
// the rewrites must survive whatever Sentry's wrapper does to `headers`/
// `rewrites`. Same-origin by design, so `script-src 'self'` already covers it.
export default withBotId(withSentry(nextConfig));
