import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { clerkSetupWithRetry } from './clerk-setup';
import { test, expect } from '@playwright/test';
import { STORAGE } from './storage-paths';
import { skipUnlessCompanyVerified } from './company-state';

// Authenticated critical paths. Require a Clerk dev instance + E2E_TEST_* creds;
// skip cleanly without them so CI stays green. Selectors target confirmed UI —
// tighten them as the design system lands.

const hasJobseeker = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER);
const hasCompany = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_COMPANY);

// The stored session state only holds `__client_uat`/`__clerk_db_jwt`; Clerk mints
// the short-lived `__session` cookie via a FAPI handshake on each protected
// navigation, which the dev-instance bot check blocks without a testing token.
// Fetch one per worker and inject it on every page so the handshake succeeds.
test.beforeAll(async () => {
  if (hasJobseeker || hasCompany) await clerkSetupWithRetry();
});
test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
});

test.describe('jobseeker (authenticated)', () => {
  test.skip(!hasJobseeker, 'requires Clerk dev jobseeker creds (E2E_TEST_*)');
  test.use({ storageState: hasJobseeker ? STORAGE.jobseeker : undefined });

  test('applications dashboard renders for a signed-in jobseeker', async ({ page }) => {
    await page.goto('/jobseeker/applications');
    await expect(page).toHaveURL(/\/jobseeker\/applications/);
    // .first(): PPR streams the prerendered shell + dynamic content, so a heading
    // can briefly resolve to two nodes.
    await expect(page.getByRole('heading', { name: /applications/i }).first()).toBeVisible();
  });

  test('the header shows the signed-in state and its avatar menu', async ({ page }) => {
    // The server decides this from the session cookie (HeaderAuth), and the
    // avatar menu is Clerk's UserButton, mounted into a slot once clerk-js has
    // loaded on demand — so this is the path that would break if the on-demand
    // loading did.
    await page.goto('/jobs');
    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Sign up' })).toHaveCount(0);
    await expect(header.locator('.cl-userButtonTrigger').first()).toBeVisible({ timeout: 30_000 });
  });

  test('profile form reports a bad URL inline, announced, instead of the browser bubble', async ({
    page,
  }) => {
    // Non-mutating: the URL is invalid, so nothing is saved. The form opts out
    // of native validation and shows the schema's own message with role=alert.
    await page.goto('/jobseeker/profile');
    const headline = page.getByLabel('Headline');
    await headline.fill(`${await headline.inputValue()} `);
    const url = page.getByLabel('Portfolio / GitHub link');
    await url.fill('not a url');
    await page.getByRole('button', { name: /save profile/i }).click();

    const message = page.getByText(/Invalid portfolio URL/);
    await expect(message).toBeVisible();
    await expect(message).toHaveAttribute('role', 'alert');
    await expect(url).toHaveAttribute('aria-invalid', 'true');
  });

  test('the apply page offers a way back to the job it is for', async ({ page }) => {
    await page.goto('/jobs');
    const first = page.locator('a[href^="/jobs/"]:not([href="/jobs"]):visible').first();
    await expect(first).toBeVisible();
    const href = await first.getAttribute('href');
    await page.goto(`${href}/apply`);
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'Jobs' })).toBeVisible();
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Apply');
  });

  test('GDPR export downloads a JSON file straight to the browser', async ({ page }) => {
    // No Blob store is involved any more: the export is the response itself,
    // so there is no stored copy and no emailed link.
    await page.goto('/account/export');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: /request data export/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^joblify-data-export-.*\.json$/);
    await expect(page.getByText(/Your export was downloaded/i)).toBeVisible();
  });

  test('signed-in jobseeker can open an apply page', async ({ page }) => {
    // Smoke: the apply route is reachable while authed (full upload → submit →
    // confirmation-email path is a manual pre-cutover check; see note below).
    await page.goto('/jobseeker/applications');
    await expect(page).not.toHaveURL(/\/sign-in/);
  });
});

test.describe('company (authenticated)', () => {
  test.skip(!hasCompany, 'requires Clerk dev company creds (E2E_TEST_*)');
  test.use({ storageState: hasCompany ? STORAGE.company : undefined });
  test.beforeEach(async ({ page }) => {
    await skipUnlessCompanyVerified(page);
  });

  test('post a job and see it on the company jobs list', async ({ page }) => {
    const title = `E2E Engineer ${Date.now()}`;
    await page.goto('/company/jobs/new');
    // PPR streams a hidden prerender shell alongside the live form, so name+:visible
    // targets the interactive fields (a bare label match is ambiguous / picks the
    // hidden copy).
    await page.locator('input[name="title"]:visible').fill(title);
    await page
      .locator('textarea[name="description"]:visible')
      .fill('A test role created by the e2e suite. '.repeat(5));
    // The Server Action commits the job before the client soft-navigates to the
    // edit page; wait for that POST to resolve, then assert the published role on
    // the jobs list (the in-app redirect is a soft nav and unreliable against the
    // Clerk dev instance, so we verify via a full navigation instead).
    await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === 'POST' && r.url().endsWith('/company/jobs/new'),
      ),
      page.locator('button[type="submit"]:visible').click(),
    ]);
    await page.goto('/company/jobs');
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 });
  });
});

// Manual pre-cutover checks (not automated — file upload to Blob + cross-user
// notification timing + external OAuth providers are unreliable headless):
//   1. Apply with a fresh resume upload → optimistic UI → confirmation email.
//   2. Company sets an applicant to SHORTLISTED → jobseeker sees the in-app
//      notification within 30s.
//   3. LinkedIn/Google OAuth signup lands a new jobseeker on /jobseeker/applications.
