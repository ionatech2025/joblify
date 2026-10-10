import { test, expect } from '@playwright/test';

// Five critical paths that gate the Week 12 cutover. Each test is the contract
// for production readiness — keep them green for 7 consecutive days before
// flipping DNS.
//
// Local run: bun run test:e2e
// Against preview: PLAYWRIGHT_BASE_URL=https://joblify-web-...vercel.app bun run test:e2e

test.describe('Joblify critical paths', () => {
  test('health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('home renders the marketing surface', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /find your next role/i })).toBeVisible();
  });

  test('jobs search page loads', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { name: /search jobs/i })).toBeVisible();
  });

  test('unknown JD slug renders the not-found experience (noindex)', async ({ page }) => {
    // Under PPR the static shell commits HTTP 200 before the streamed body can
    // call notFound(), so the status for an unknown slug is 200 by design.
    // The SEO contract is the not-found UI plus the `noindex` robots meta that
    // Next injects with streamed notFound() — Google drops noindex pages, so
    // this is not a soft-404 risk. Real JDs carry no robots meta (indexable).
    await page.goto('/jobs/this-slug-does-not-exist-zzz');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    // Hydration can duplicate the streamed meta — assert presence, not count.
    expect(
      await page.locator('meta[name="robots"][content*="noindex"]').count(),
    ).toBeGreaterThanOrEqual(1);
  });

  test('unknown routes return a real 404 status', async ({ page }) => {
    const res = await page.goto('/this-route-does-not-exist-zzz');
    expect(res?.status()).toBe(404);
  });

  test('protected routes redirect to /sign-in when unauthed', async ({ page }) => {
    await page.goto('/jobseeker/applications');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  // The Radix menu behind this control is fetched on first use rather than with
  // the page (app/components/ui/theme-toggle.tsx), so the first activation is
  // the path that has to keep working.
  test.describe('theme control', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('opens its menu, applies the choice and keeps it across a reload', async ({ page }) => {
      await page.goto('/legal/terms');
      const trigger = page.getByRole('button', { name: 'Change theme' });
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

      await trigger.click();
      await expect(page.getByRole('menu')).toBeVisible();
      for (const name of ['Light', 'Dark', 'System']) {
        await expect(page.getByRole('menuitem', { name })).toBeVisible();
      }

      await page.getByRole('menuitem', { name: 'Dark' }).click();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
      await expect(page.getByRole('menu')).toBeHidden();

      // The pre-paint script reads the persisted choice on the next load.
      await page.reload();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    });

    test('is operable from the keyboard and returns focus to its trigger', async ({ page }) => {
      await page.goto('/legal/terms');
      const trigger = page.getByRole('button', { name: 'Change theme' });
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('menu')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu')).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  });

  // Authenticated critical paths live in authenticated.spec.ts — they require a
  // Clerk dev instance + E2E_TEST_* creds and skip automatically without them.
});
