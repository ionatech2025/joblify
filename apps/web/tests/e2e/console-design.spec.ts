import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { test, expect, type Page } from '@playwright/test';
import { STORAGE } from './storage-paths';

/**
 * Console-register regression — locks the Odoo-enterprise back office.
 *
 * The companion to `design-regression.spec.ts`, which locks the editorial
 * register on the public funnel. The two exist separately because the whole
 * point of the token architecture is that these are two registers, and the
 * failure mode worth guarding is one leaking into the other: a `.o-console`
 * class that stops applying (every back-office surface silently reverts to
 * 16px radii and an aurora wash), or console tokens escaping onto marketing.
 *
 * Needs Clerk dev creds like the other authenticated specs; skips cleanly
 * without them so CI stays green.
 */

const hasCompany = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_COMPANY);
const hasJobseeker = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER);

test.beforeAll(async () => {
  if (hasCompany || hasJobseeker) await clerkSetup();
});
test.beforeEach(async ({ page }) => {
  await setupClerkTestingToken({ page });
});

/** Resolved value of a token *inside the console scope*, not on :root. */
function consoleToken(page: Page, name: string): Promise<string> {
  return page.evaluate((n) => {
    const el = document.querySelector('.o-console');
    if (!el) return '';
    return getComputedStyle(el).getPropertyValue(n).trim();
  }, name);
}

test.describe('console register', () => {
  test.skip(!hasCompany, 'requires Clerk dev company creds (E2E_TEST_*)');
  test.use({ storageState: hasCompany ? STORAGE.company : undefined });

  test('the .o-console scope flattens radii and repaints the canvas', async ({ page }) => {
    await page.goto('/company/jobs');
    await expect(page.locator('.o-console')).toBeVisible();

    // The radii are the load-bearing part: they are declared as raw --r-* vars
    // *referenced* from @theme inline precisely so this scope can override them.
    // A literal in @theme would bake into the utility and this would read 1rem.
    expect(parseFloat(await consoleToken(page, '--r-card'))).toBeLessThanOrEqual(6);
    expect(parseFloat(await consoleToken(page, '--r-control'))).toBeLessThanOrEqual(6);
    // The editorial capsule flattens too, which is what makes Button/Badge
    // re-skin here with no per-call-site branching.
    expect(parseFloat(await consoleToken(page, '--r-pill'))).toBeLessThanOrEqual(6);

    // Ink is the plum primary, not the editorial near-black.
    expect(await consoleToken(page, '--ink')).not.toBe('');
    // Elevation is a hairline in the console — `none`, not a drop shadow.
    expect(await consoleToken(page, '--shadow-soft')).toBe('none');
  });

  test('primary buttons render as flat controls, not editorial pills', async ({ page }) => {
    await page.goto('/company/jobs');
    const newButton = page.getByRole('link', { name: /^new$/i }).first();
    await expect(newButton).toBeVisible();
    const radius = await newButton.evaluate((el) => getComputedStyle(el).borderRadius);
    // The marketing CTAs assert >= 24px in design-regression.spec.ts; the same
    // Button component must land under 6px here.
    expect(parseFloat(radius)).toBeLessThanOrEqual(6);
  });

  test('control panel: breadcrumb, New action, view switcher, sticky under the nav', async ({
    page,
  }) => {
    await page.goto('/company/jobs');
    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /recruitment/i })).toBeVisible();
    await expect(page.getByRole('group', { name: /^view$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^new$/i }).first()).toBeVisible();

    // Both chrome bars are sticky and stack: the control panel's offset is
    // computed from --o-header-h + --o-nav-h, so a mismatch shows up as the
    // panel sliding under the app header rather than sitting flush below it.
    const position = await page
      .getByRole('navigation', { name: /breadcrumb/i })
      .evaluate((el) => getComputedStyle(el.closest('div.sticky') ?? el).position);
    expect(position).toBe('sticky');
  });

  test('list view sorts through the URL and states its own total', async ({ page }) => {
    await page.goto('/company/jobs');
    const table = page.getByRole('table', { name: /job posts/i });
    await expect(table).toBeVisible();

    // Sortable headers are links that write ?order=, so the sort survives a
    // reload and a shared link — and happens in the database, not over one page.
    const titleHeader = table.getByRole('link', { name: /title/i }).first();
    await titleHeader.click();
    await expect(page).toHaveURL(/order=title%3A(asc|desc)/);
    await expect(
      table.locator('th[aria-sort="ascending"], th[aria-sort="descending"]'),
    ).toHaveCount(1);

    // The footer aggregate row is the thing a plain table never had.
    await expect(table.locator('tfoot')).toBeVisible();
  });

  test('status filter applies as a removable facet', async ({ page }) => {
    await page.goto('/company/jobs');
    await page
      .getByRole('button', { name: /status/i })
      .first()
      .click();
    const item = page.getByRole('menuitem', { name: /published/i }).first();
    await expect(item).toBeVisible();
    await item.click();

    await expect(page).toHaveURL(/status=PUBLISHED/);
    // The facet chip is the searchview's contract: every active filter is
    // visible and individually removable.
    const remove = page.getByRole('link', { name: /remove status filter/i });
    await expect(remove).toBeVisible();
    await remove.click();
    await expect(page).not.toHaveURL(/status=PUBLISHED/);
  });

  test('kanban view switch is URL state and shows column aggregates', async ({ page }) => {
    await page.goto('/company/jobs?view=kanban');
    // Column headers are labelled regions carrying their own card count.
    await expect(page.getByRole('region', { name: /published/i }).first()).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  test('form view: sheet, statusbar as the publish control, dirty bar', async ({ page }) => {
    await page.goto('/company/jobs/new');
    await expect(page.getByRole('group', { name: /publication status/i })).toBeVisible();

    // Notebook tabs replace three screens of stacked textareas.
    const tablist = page.getByRole('tablist', { name: /record sections/i });
    await expect(tablist).toBeVisible();
    await expect(tablist.getByRole('tab', { name: /description/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await tablist.getByRole('tab', { name: /requirements/i }).click();
    await expect(tablist.getByRole('tab', { name: /requirements/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // The dirty bar starts clean and flips on the first edit — the form had no
    // unsaved-changes signal at all before, despite persisting a draft.
    await expect(page.getByText(/all changes saved/i)).toBeVisible();
    await page.getByRole('tab', { name: /description/i }).click();
    await page.getByLabel(/^title/i).fill('Console regression probe');
    await expect(page.getByText(/unsaved changes/i)).toBeVisible();
  });

  test('the editorial footer does not render on a console page', async ({ page }) => {
    // A console page owns its chrome. Hidden via :has() rather than a route
    // check, because the root layout can't read the pathname without collapsing
    // every route's PPR shell.
    await page.goto('/company/jobs');
    await expect(page.getByRole('contentinfo')).toBeHidden();

    // …and still renders on the public funnel.
    await page.goto('/about');
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});

test.describe('jobseeker console', () => {
  test.skip(!hasJobseeker, 'requires Clerk dev jobseeker creds (E2E_TEST_*)');
  test.use({ storageState: hasJobseeker ? STORAGE.jobseeker : undefined });

  test('workspace nav marks the active module and applications is a dense list', async ({
    page,
  }) => {
    await page.goto('/jobseeker/applications');
    const nav = page.getByRole('navigation', { name: /my workspace/i });
    await expect(nav).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);

    // Either the table or the crafted empty state — never a blank body.
    await expect(
      page.getByRole('table', { name: /my applications/i }).or(page.getByText(/no applications/i)),
    ).toBeVisible();
  });
});
