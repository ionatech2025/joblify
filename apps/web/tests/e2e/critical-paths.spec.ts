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

  test('JD page 404s on unknown slug', async ({ page }) => {
    const res = await page.goto('/jobs/this-slug-does-not-exist-zzz');
    expect(res?.status()).toBe(404);
  });

  test('protected routes redirect to /sign-in when unauthed', async ({ page }) => {
    await page.goto('/jobseeker/applications');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  // Authenticated critical paths live in authenticated.spec.ts — they require a
  // Clerk dev instance + E2E_TEST_* creds and skip automatically without them.
});
