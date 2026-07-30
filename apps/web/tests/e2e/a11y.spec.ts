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
    // is /legal/privacy). An include() allowlist is robust against Vercel
    // changing that toolbar's markup/classes in the future, where an
    // exclude() of today's specific selector would not be.
    .include('header')
    .include('#main-content')
    .include('footer')
    .include('aside')
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  if (critical.length > 0) {
    console.warn(JSON.stringify(critical, null, 2));
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
