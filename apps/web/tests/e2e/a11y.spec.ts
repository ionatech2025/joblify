import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { STORAGE } from './storage-paths';

// Pages we promise to keep accessibility-clean, scanned in BOTH themes. axe-core
// only — covers the automation-detectable subset (~30-40% of WCAG); manual SR
// testing closes the rest.
//
// Dark mode is scanned because contrast is where a semantic token layer most
// easily goes wrong: the footer already needed neutral-400 over neutral-500 to
// clear 4.5:1 on ink, and every dark surface/foreground pair is a fresh chance
// to reintroduce that. A light-only gate would not have caught it.

// The app's service worker (public/sw.js) intercepts fetches for its
// network-first/cache-first strategy, which hangs axe-core's page analysis
// indefinitely — axe never resolves, so `.analyze()` just times out. Block
// service worker registration for this spec only; nothing here exercises
// offline/PWA behavior.
test.use({ serviceWorkers: 'block' });

const DEFAULT_PAGES = [
  { path: '/', label: 'home' },
  { path: '/jobs', label: 'jobs search' },
  { path: '/companies', label: 'companies' },
  { path: '/sign-in', label: 'sign-in' },
  { path: '/sign-up', label: 'sign-up' },
];

// Authenticated surfaces — the gap tracked in docs/REMAINING_STEPS.md. They need
// the Playwright `setup` project's storageState, so they skip without creds.
const JOBSEEKER_PAGES = [
  { path: '/jobseeker/applications', label: 'applications' },
  { path: '/jobseeker/saved', label: 'saved jobs' },
  { path: '/jobseeker/profile', label: 'profile' },
  { path: '/jobseeker/resumes', label: 'resumes' },
  { path: '/jobseeker/resumes/builder', label: 'resume builder' },
  { path: '/jobseeker/notifications', label: 'notifications' },
];

const COMPANY_PAGES = [
  { path: '/company/jobs', label: 'company jobs' },
  { path: '/company/jobs/new', label: 'post a job' },
  { path: '/company/jobseekers', label: 'jobseeker directory' },
  { path: '/company/settings', label: 'company settings' },
];

// CI without live DB/Clerk can only render the static home page, so it sets
// A11Y_PATHS=/ to scope the gate. Full coverage runs locally or against a
// preview deploy (where real services exist) with A11Y_PATHS unset.
const PAGES = process.env.A11Y_PATHS
  ? process.env.A11Y_PATHS.split(',').map((p) => ({ path: p.trim(), label: p.trim() }))
  : DEFAULT_PAGES;

const hasJobseeker = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER);
const hasCompany = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_COMPANY);

/**
 * Narrows the scope list to the regions this page actually rendered.
 *
 * `body > x` restricts to direct children of <body>, which is where this app's
 * own header/footer/cookie-banner live (see app/layout.tsx) — an injected
 * widget wrapper (Vercel's preview feedback toolbar) is not a direct body
 * child, so this excludes it without needing to know its markup. See the block
 * comment in expectNoViolations for the history.
 */
async function presentRegions(page: Page): Promise<string[]> {
  const CANDIDATES = ['body > header', '#main-content', 'body > footer', 'body > aside'];
  const present = await page.evaluate(
    (sels) => sels.filter((s) => document.querySelector(s) !== null),
    CANDIDATES,
  );
  // The content region is not optional: a page without it is broken, and
  // scanning only the chrome would quietly pass.
  expect(present, 'no #main-content on the page — nothing to scan').toContain('#main-content');
  return present;
}

async function expectNoViolations(page: Page, path: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Scoped to the regions this app actually renders (header, page content,
    // footer, cookie banner) rather than the whole document. On a preview
    // deployment reached via the SSO bypass header, Vercel appears to treat
    // the session as an authorized team preview and injects its own feedback
    // toolbar client-side — not present in a plain fetch, not present for a
    // real anonymous visitor, and not something app code controls. It showed
    // up as 128 "serious" color-contrast violations on every page (PR #49),
    // all traced to elements with Vercel's own --ds-* design tokens and a
    // /legal/privacy-policy link that doesn't exist in this app (real route
    // is /legal/privacy).
    //
    // A first attempt scoped with bare tag selectors (header/footer/aside)
    // and still caught the toolbar — axe's include() runs querySelectorAll
    // against the whole document, and Vercel's widget apparently uses the
    // same semantic tags for its own floating UI. `body > x` restricts to
    // direct children of <body>, which a probe against the exact failing
    // deployment confirmed is where this app's own header/footer/cookie-
    // banner actually live (see app/layout.tsx) — an injected widget wrapper
    // is not a direct body child, so this excludes it without needing to
    // know its markup.
    // Only include regions that are actually present. axe's include() throws a
    // bare `No elements found for include in page Context` when ANY selector
    // matches nothing — it is not a violation, it aborts the whole scan — and
    // two of these four are legitimately conditional:
    //   body > aside   the cookie banner returns null unless the consent store
    //                  says it is open (components/cookie-banner.tsx), so it is
    //                  absent on any visit that already has a choice stored.
    //   body > footer  hidden on console pages.
    // That is why this gate had never passed on any branch: every page failed
    // with the include error rather than on anything accessibility-related.
    // #main-content is required — if the page has no content region that is a
    // real bug, not a scoping problem, so it is asserted rather than filtered.
    .include(await presentRegions(page))
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  if (critical.length > 0) {
    console.warn(JSON.stringify(critical, null, 2));
    // The include() scoping above was tuned against a failure this suite
    // couldn't reproduce outside CI (PR #49) — two guesses, two pushes, two
    // ~2-minute CI round trips to find out either was wrong. If this still
    // fires, print the ancestor chain of the first violation's own target
    // right here instead of repeating that cycle a third time.
    const target = critical[0]?.nodes[0]?.target[0];
    if (typeof target === 'string') {
      const chain = await page.evaluate((sel) => {
        let el = document.querySelector(sel);
        const path: string[] = [];
        while (el && el !== document.body) {
          path.push(
            `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${String(el.className).slice(0, 60)}`,
          );
          el = el.parentElement;
        }
        return path;
      }, target);
      console.warn('Ancestor chain of first violation target:', JSON.stringify(chain, null, 2));
    }
  }
  expect(critical, `axe violations on ${path}`).toEqual([]);
}

// colorScheme drives it rather than localStorage: the stored theme defaults to
// 'system', so this exercises the real OS-preference resolution path through
// components/theme-script.tsx.
const THEMES = [
  { label: 'light', colorScheme: 'light' as const },
  { label: 'dark', colorScheme: 'dark' as const },
];

for (const theme of THEMES) {
  test.describe(`public · ${theme.label} theme`, () => {
    test.use({ colorScheme: theme.colorScheme });

    for (const target of PAGES) {
      test(`a11y: ${target.label} (${target.path}) — ${theme.label}`, async ({ page }) => {
        await page.goto(target.path);
        // Guard against the theme silently not applying, which would turn the
        // dark run into a duplicate of the light one.
        if (theme.label === 'dark') {
          expect(
            await page.evaluate(() => document.documentElement.classList.contains('dark')),
            'dark class should be applied pre-paint',
          ).toBe(true);
        }
        await expectNoViolations(page, target.path);
      });
    }
  });
}

// The stored session state only holds `__client_uat`/`__clerk_db_jwt`; Clerk mints
// the short-lived `__session` cookie via a FAPI handshake on each protected
// navigation, which the dev-instance bot check blocks without a testing token.
test.beforeAll(async () => {
  if (hasJobseeker || hasCompany) await clerkSetup();
});
test.beforeEach(async ({ page }) => {
  if (hasJobseeker || hasCompany) await setupClerkTestingToken({ page });
});

for (const theme of THEMES) {
  test.describe(`jobseeker · ${theme.label} theme`, () => {
    test.skip(!hasJobseeker, 'requires Clerk dev jobseeker creds (E2E_TEST_*)');
    test.use({
      colorScheme: theme.colorScheme,
      storageState: hasJobseeker ? STORAGE.jobseeker : undefined,
    });

    for (const target of JOBSEEKER_PAGES) {
      test(`a11y: ${target.label} (${target.path}) — ${theme.label}`, async ({ page }) => {
        await page.goto(target.path);
        await expect(page).not.toHaveURL(/\/sign-in/);
        await expectNoViolations(page, target.path);
      });
    }
  });

  test.describe(`company · ${theme.label} theme`, () => {
    test.skip(!hasCompany, 'requires Clerk dev company creds (E2E_TEST_*)');
    test.use({
      colorScheme: theme.colorScheme,
      storageState: hasCompany ? STORAGE.company : undefined,
    });

    for (const target of COMPANY_PAGES) {
      test(`a11y: ${target.label} (${target.path}) — ${theme.label}`, async ({ page }) => {
        await page.goto(target.path);
        await expect(page).not.toHaveURL(/\/sign-in/);
        await expectNoViolations(page, target.path);
      });
    }
  });
}

// The applicants board needs a job id, so it can't be a static path — it is
// covered by workflows.spec.ts functionally; its axe scan lands here once the
// suite has a stable seeded job id to target. Tracked in REMAINING_STEPS.md.
