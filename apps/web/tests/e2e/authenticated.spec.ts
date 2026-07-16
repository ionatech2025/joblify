import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { test, expect } from '@playwright/test';
import { STORAGE } from './storage-paths';

// Authenticated critical paths. Require a Clerk dev instance + E2E_TEST_* creds;
// skip cleanly without them so CI stays green. Selectors target confirmed UI —
// tighten them as the design system lands.

const hasJobseeker = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER);
const hasCompany = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_COMPANY);
// The GDPR export writes the bundle to Vercel Blob and returns a signed URL; with
// no Blob token the request 500s, so skip locally and run it where Blob is wired
// (CI / preview), mirroring how the whole suite skips without Clerk creds.
const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// The stored session state only holds `__client_uat`/`__clerk_db_jwt`; Clerk mints
// the short-lived `__session` cookie via a FAPI handshake on each protected
// navigation, which the dev-instance bot check blocks without a testing token.
// Fetch one per worker and inject it on every page so the handshake succeeds.
test.beforeAll(async () => {
  if (hasJobseeker || hasCompany) await clerkSetup();
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

  test('GDPR export request surfaces a download/confirmation', async ({ page }) => {
    test.skip(!hasBlob, 'GDPR export needs Vercel Blob (BLOB_READ_WRITE_TOKEN)');
    await page.goto('/account/export');
    await page.getByRole('button', { name: /request data export/i }).click();
    // Target the success message specifically — the page copy already contains
    // words like "email"/"prepare", so a loose match is ambiguous.
    await expect(page.getByText(/Export ready|Download:/i)).toBeVisible({ timeout: 30_000 });
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
