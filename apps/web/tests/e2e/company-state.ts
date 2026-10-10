import { test, type Page } from '@playwright/test';

/**
 * The company console is gated on admin verification: a PENDING company is
 * redirected to /employer-setup, where it sees "Account Pending Verification".
 * That is the product working. Without this guard every company flow that
 * follows fails on a missing nav or heading and says nothing about the feature
 * it was written for - which is how these suites went red the first time they
 * ran with credentials (CI skips them for want of secrets).
 *
 * So: skip, with the reason, when the e2e company has not been approved.
 *
 * Approving it is deliberately not automatic. Either approve "Alien Tech (E2E)"
 * in /admin, or run the suite with E2E_VERIFY_COMPANY=1 (see fixtures.ts) -
 * which flips it to VERIFIED and so lets the next run publish real, public
 * listings. Do that against a preview database, not a shared one.
 */
export async function skipUnlessCompanyVerified(page: Page): Promise<void> {
  await page.goto('/company/jobs', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  // The pending screen renders at /company/jobs itself (no redirect), so the
  // URL alone does not tell; look for the screen.
  const pending =
    /\/employer-setup/.test(page.url()) ||
    (await page
      .getByRole('heading', { name: /pending verification/i })
      .isVisible()
      .catch(() => false));
  test.skip(
    pending,
    'the e2e company is not verified - approve it in /admin or run with E2E_VERIFY_COMPANY=1',
  );
}
