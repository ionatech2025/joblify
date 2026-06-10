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

  // Authenticated critical paths live in authenticated.spec.ts — they require a
  // Clerk dev instance + E2E_TEST_* creds and skip automatically without them.
});
