import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { test, expect, type Page } from '@playwright/test';
import { STORAGE } from './storage-paths';

// Waits for the mutation POST back to the CURRENT route to resolve. Next
// Server Actions triggered from a page POST back to that same pathname, so
// matching on pathname (not just same-origin) excludes unrelated same-origin
// traffic the page can also fire (e.g. the cookie banner's /api/v1/consent)
// as well as Clerk's cross-origin background POSTs.
function waitForAppMutation(page: Page) {
  const pathname = new URL(page.url()).pathname;
  return page.waitForResponse(
    (r) => r.request().method() === 'POST' && r.status() === 200 && new URL(r.url()).pathname === pathname,
  );
}

// Coverage for the feature surfaces not already exercised by authenticated.spec.ts
// (post-job, applications dashboard, GDPR export): subscriptions, saved jobs,
// invitations, profile, notifications, resumes, the company jobseeker
// directory, company settings, applicant status, and chat — for both roles.
// Cross-account fixture state (a shared chat area, a pending invitation, a
// resume, an application) is provisioned once in auth.setup.ts via
// ensureE2eFixtures(); this file only drives the UI.

const hasJobseeker = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER);
const hasCompany = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_COMPANY);

const FIXTURE_JOB_TITLE = 'E2E Fixture — Support Engineer';

test.beforeAll(async () => {
  if (hasJobseeker || hasCompany) await clerkSetup();
});
test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
});

test.describe('jobseeker workflows', () => {
  test.skip(!hasJobseeker, 'requires Clerk dev jobseeker creds (E2E_TEST_*)');
  test.use({ storageState: hasJobseeker ? STORAGE.jobseeker : undefined });

  test('subscribes to and unsubscribes from a company', async ({ page }) => {
    // SubscribeButton is a Server Component driven by a plain <form action=...>;
    // the mutation lands (verified: the DB row is created) but this page doesn't
    // reliably soft-refresh afterward, so reload explicitly instead of trusting
    // the in-place DOM to update.
    await page.goto('/companies/acme-inc');
    // Idempotent baseline: if a previous run left this subscribed, unsubscribe first.
    if (await page.locator('button:visible', { hasText: /unsubscribe$/i }).isVisible()) {
      await Promise.all([
        waitForAppMutation(page),
        page.locator('button:visible', { hasText: /unsubscribe$/i }).click(),
      ]);
      await page.reload();
    }
    await Promise.all([
      waitForAppMutation(page),
      page.locator('button:visible', { hasText: /^Subscribe as/i }).click(),
    ]);
    await page.reload();
    const unsubscribe = page.locator('button:visible', { hasText: /unsubscribe$/i });
    await expect(unsubscribe).toBeVisible({ timeout: 10_000 });

    await Promise.all([waitForAppMutation(page), unsubscribe.click()]);
    await page.reload();
    await expect(page.locator('button:visible', { hasText: /^Subscribe as/i })).toBeVisible({ timeout: 10_000 });
  });

  test('saves and unsaves a job', async ({ page }) => {
    await page.goto('/jobs/frontend-engineer-react');
    const saveBtn = page.locator('button:visible[aria-pressed]');
    // The button flips aria-pressed optimistically before the underlying
    // toggleSavedJob() server call resolves, so waiting on the attribute alone
    // races the actual DB write. Wait for that POST to land before moving on.
    // Idempotent baseline: if a previous run left this saved, unsave first.
    if ((await saveBtn.getAttribute('aria-pressed')) === 'true') {
      await Promise.all([waitForAppMutation(page), saveBtn.click()]);
      await expect(saveBtn).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 });
    }
    await Promise.all([waitForAppMutation(page), saveBtn.click()]);
    await expect(saveBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });

    await page.goto('/jobseeker/saved');
    await expect(page.getByText('Frontend Engineer (React)').first()).toBeVisible();
    // Visible text is plain "Remove" (the job title lives only in aria-label).
    await page.locator('button:visible', { hasText: /^Remove$/i }).click();
    await expect(page.getByText('Frontend Engineer (React)')).toHaveCount(0, { timeout: 10_000 });
  });

  test('accepts a pending invitation and can unsubscribe from the resulting subscription', async ({ page }) => {
    // Exact match: a substring match on "Accept" also catches the cookie
    // banner's "Accept all" button.
    const accept = page.locator('button:visible', { hasText: /^Accept$/ });
    await page.goto('/jobseeker/subscriptions');
    await expect(page.getByRole('heading', { name: 'Invitations' }).first()).toBeVisible();
    await Promise.all([waitForAppMutation(page), accept.click()]);
    await page.reload();
    await expect(page.locator('button:visible', { hasText: /^Accept$/ })).toHaveCount(0, { timeout: 10_000 });
    const unsubscribe = page.locator('button:visible', { hasText: /^Unsubscribe$/i });
    await expect(unsubscribe).toBeVisible();
    await Promise.all([waitForAppMutation(page), unsubscribe.click()]);
  });

  test('edits the profile headline', async ({ page }) => {
    const headline = `E2E headline ${Date.now()}`;
    await page.goto('/jobseeker/profile');
    // PPR streams a static shell, then replaces it once the dynamic (per-request)
    // content resolves; filling before that stream lands races the reconciliation
    // and can corrupt the uncontrolled input's value. Wait for network activity to
    // settle first.
    await page.waitForLoadState('networkidle');
    await page.locator('input[name="headline"]:visible').fill(headline);
    await expect(page.locator('input[name="headline"]:visible')).toHaveValue(headline);
    await page.locator('button[type="submit"]:visible', { hasText: /Save profile/i }).click();
    await expect(page.getByText('Saved.').first()).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.locator('input[name="headline"]:visible')).toHaveValue(headline);
  });

  test('marks a notification as read', async ({ page }) => {
    // Scoped to this specific fixture notification's row — other real,
    // unrelated notifications (e.g. from the applicant-status test) may also
    // be unread at the same time, so a page-wide "0 Mark read buttons left"
    // check would be wrong.
    await page.goto('/jobseeker/notifications');
    const row = page.locator('li:visible', { hasText: 'E2E fixture notification for the mark-read test.' });
    await expect(row).toBeVisible();
    await row.locator('button:visible', { hasText: 'Mark read' }).click();
    await expect(row.locator('button:visible', { hasText: 'Mark read' })).toHaveCount(0, { timeout: 10_000 });
  });

  test('resumes list shows the fixture resume', async ({ page }) => {
    await page.goto('/jobseeker/resumes');
    await expect(page.getByText('E2E Fixture Resume.pdf').first()).toBeVisible();
  });

  test('reads and replies in the shared fixture chat area', async ({ page }) => {
    await page.goto('/jobseeker/chats');
    await page.locator('a:visible', { hasText: FIXTURE_JOB_TITLE }).first().click();
    await expect(page.getByText('Welcome — this is the e2e fixture chat area.').first()).toBeVisible();
    const reply = `Jobseeker reply ${Date.now()}`;
    await page.locator('textarea[name="body"]:visible').fill(reply);
    // ChatThread's messages come from the page's own server-rendered props, not
    // client state; sendChatMessage is a plain form action, so — like subscribe/
    // invitation-respond above — wait for the POST, then reload to see it.
    await Promise.all([
      waitForAppMutation(page),
      page.locator('button[type="submit"]:visible', { hasText: 'Send' }).click(),
    ]);
    await page.reload();
    await expect(page.getByText(reply).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('company workflows', () => {
  test.skip(!hasCompany, 'requires Clerk dev company creds (E2E_TEST_*)');
  test.use({ storageState: hasCompany ? STORAGE.company : undefined });

  test('jobseeker directory lists public seekers and filters by type', async ({ page }) => {
    await page.goto('/company/jobseekers');
    await expect(page.locator('a:visible', { hasText: 'On site' }).first()).toBeVisible();
    await expect(page.getByText('Ada Lovelace').first()).toBeVisible();
    await page.locator('a:visible', { hasText: 'Virtual interns' }).first().click();
    await expect(page.getByText('Grace Hopper').first()).toBeVisible();
  });

  test('edits company settings', async ({ page }) => {
    const description = `E2E-updated description ${Date.now()}`;
    await page.goto('/company/settings');
    await page.locator('textarea[name="description"]:visible').fill(description);
    await Promise.all([
      waitForAppMutation(page),
      page.locator('button[type="submit"]:visible', { hasText: /Save changes/i }).click(),
    ]);
    await page.reload();
    await expect(page.locator('textarea[name="description"]:visible')).toHaveValue(description);
  });

  test('changes an applicant status on the fixture job', async ({ page }) => {
    await page.goto('/company/jobs');
    const row = page.locator('tr', { hasText: FIXTURE_JOB_TITLE });
    // Row links in order: title (/jobs/slug), applicants count
    // (/company/applicants/id), Edit (/company/jobs/id/edit) — the middle one.
    await row.locator('a:visible').nth(1).click();
    await expect(page).toHaveURL(/\/company\/applicants\//);
    const statusSelect = page.locator('select:visible[aria-label^="Change status for"]').first();
    // ApplicantsBoard updates its select optimistically before
    // updateApplicantStatus() resolves, so assert on the option chosen, then
    // wait for the mutation and reload to confirm it actually persisted.
    await Promise.all([waitForAppMutation(page), statusSelect.selectOption('SHORTLISTED')]);
    await page.reload();
    await expect(page.locator('select:visible[aria-label^="Change status for"]').first()).toHaveValue(
      'SHORTLISTED',
      { timeout: 10_000 },
    );
  });

  test('sends a message in the fixture job chat area', async ({ page }) => {
    await page.goto('/company/chats');
    await page.locator('a:visible', { hasText: FIXTURE_JOB_TITLE }).first().click();
    const msg = `Company message ${Date.now()}`;
    await page.locator('textarea[name="body"]:visible').fill(msg);
    // Same as the jobseeker-side chat test: ChatThread's messages are static
    // server-rendered props, so wait for the POST then reload to see the reply.
    await Promise.all([
      waitForAppMutation(page),
      page.locator('button[type="submit"]:visible', { hasText: 'Send' }).click(),
    ]);
    await page.reload();
    await expect(page.getByText(msg).first()).toBeVisible({ timeout: 10_000 });
  });
});
