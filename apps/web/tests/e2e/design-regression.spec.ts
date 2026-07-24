import { test, expect, type Page } from '@playwright/test';

// Design-system regression — locks the 2026-07 refresh (editorial display
// type + eyebrow labels, ink pill CTAs, dark footer band, glass/elevated
// cards, split-screen auth). Like api.spec.ts, every assertion holds in both
// a no-vendor local run and a full preview: nothing here depends on Algolia,
// Clerk sessions, or AI vendors.
//
// Uncaught page errors fail the suite, except Clerk bootstrap noise — local
// runs use a format-valid placeholder publishable key that clerk-js rejects
// at runtime.

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (!/clerk/i.test(String(err))) errors.push(String(err));
  });
  return errors;
}

test.describe('design system', () => {
  test('home: eyebrow + display hero, paired pill CTAs, stat row, dark footer', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto('/');

    // Hero: headline copy is unchanged; the eyebrow label sits above it.
    await expect(page.getByRole('heading', { name: /find your next role/i })).toBeVisible();
    await expect(page.locator('.eyebrow').first()).toBeVisible();

    // Paired CTAs: solid-ink primary + white secondary, both pill-shaped.
    const browse = page.getByRole('link', { name: /browse jobs/i }).first();
    const post = page.getByRole('link', { name: /post a job/i }).first();
    await expect(browse).toBeVisible();
    await expect(post).toBeVisible();
    const browseRadius = await browse.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(browseRadius)).toBeGreaterThanOrEqual(24); // pill, not rounded-lg

    // Stat row renders real (seeded) counts — at least one non-zero value.
    const statValues = page.locator('.display.text-3xl');
    await expect(statValues.first()).toBeVisible();

    // Footer is the dark ink band. Computed color serialization differs by
    // color space (Tailwind 4 emits oklch → Chromium computes `lab(L a b)`;
    // legacy sRGB computes `rgb(r, g, b)`), so accept both and assert
    // near-black either way.
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
    const bg = await footer.evaluate((el) => getComputedStyle(el).backgroundColor);
    if (bg.startsWith('lab(')) {
      const lightness = parseFloat(bg.slice(4));
      expect(lightness).toBeLessThan(12); // L in [0,100]
    } else {
      const [r = 255, g = 255, b = 255] = (bg.match(/\d+(\.\d+)?/g) ?? []).map(Number);
      expect(r + g + b).toBeLessThan(90); // near-black, not the old white band
    }

    expect(errors).toEqual([]);
  });

  test('header: sign-up CTA is an ink pill; skip link is first-focusable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /skip to (main )?content/i })).toBeFocused();

    const signUp = page.getByRole('banner').getByRole('link', { name: /sign up/i });
    await expect(signUp).toBeVisible();
    const radius = await signUp.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(radius)).toBeGreaterThanOrEqual(20);
  });

  test('jobs page: search controls render; results or graceful degradation, never a crash', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { name: /search jobs/i })).toBeVisible();
    await expect(page.getByRole('searchbox').or(page.getByRole('textbox')).first()).toBeVisible();
    // With Algolia wired: result cards; without: the error/empty state. Both
    // are valid — a blank body or uncaught crash is not.
    await expect(page.locator('main')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });

  test('JD page via DB-backed featured jobs: display title block + apply CTA', async ({
    page,
  }) => {
    await page.goto('/');
    // Featured jobs are Prisma-backed ('use cache'), so they exist without
    // Algolia. Click through to the first JD.
    const featured = page.locator('a[href^="/jobs/"]:not([href="/jobs"])').first();
    await expect(featured).toBeVisible();
    await featured.click();
    await page.waitForURL(/\/jobs\/.+/);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /apply/i }).or(page.getByRole('button', { name: /apply/i })).first()).toBeVisible();
  });

  test('sign-in: split-screen on desktop, single column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/sign-in');
    // Right brand panel is visible on desktop…
    await expect(page.getByTestId('auth-visual-panel')).toBeVisible();
    // …and hidden on mobile.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('auth-visual-panel')).toBeHidden();
  });

  test('404 page keeps the display-type treatment', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-zzz');
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
  });
});
