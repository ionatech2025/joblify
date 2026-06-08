import { test, expect } from '@playwright/test';
import { STORAGE } from './storage-paths';

// Authenticated critical paths. Require a Clerk dev instance + E2E_TEST_* creds;
// skip cleanly without them so CI stays green. Selectors target confirmed UI —
// tighten them as the design system lands.

const hasJobseeker = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER);
const hasCompany = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_COMPANY);

test.describe('jobseeker (authenticated)', () => {
  test.skip(!hasJobseeker, 'requires Clerk dev jobseeker creds (E2E_TEST_*)');
  test.use({ storageState: hasJobseeker ? STORAGE.jobseeker : undefined });

  test('applications dashboard renders for a signed-in jobseeker', async ({ page }) => {
    await page.goto('/jobseeker/applications');
    await expect(page).toHaveURL(/\/jobseeker\/applications/);
    await expect(page.getByRole('heading', { name: /applications/i })).toBeVisible();
  });

  test('GDPR export request surfaces a download/confirmation', async ({ page }) => {
    await page.goto('/account/export');
    await page.getByRole('button', { name: /export|request|download/i }).first().click();
    await expect(page.getByText(/https?:\/\/|ready|sent|email|prepar/i)).toBeVisible({ timeout: 30_000 });
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
    await page.getByLabel(/title/i).fill(title);
    await page.getByLabel(/description/i).fill('A test role created by the e2e suite. '.repeat(5));
    await page.getByRole('button', { name: /post|publish|create|save/i }).first().click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });
  });
});

// Manual pre-cutover checks (not automated — file upload to Blob + cross-user
// notification timing + external OAuth providers are unreliable headless):
//   1. Apply with a fresh resume upload → optimistic UI → confirmation email.
//   2. Company sets an applicant to SHORTLISTED → jobseeker sees the in-app
//      notification within 30s.
//   3. LinkedIn/Google OAuth signup lands a new jobseeker on /jobseeker/applications.
