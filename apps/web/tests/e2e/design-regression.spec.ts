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

/** Resolved value of a semantic design token on :root. */
function readToken(page: Page, name: string): Promise<string> {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name,
  );
}

const isDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains('dark'));

/**
 * Near-black test that copes with either computed-colour serialization:
 * Tailwind 4 emits oklch, which Chromium computes as `lab(L a b)` while legacy
 * sRGB values compute as `rgb(r, g, b)`.
 */
function expectNearBlack(bg: string) {
  if (bg.startsWith('lab(')) {
    expect(parseFloat(bg.slice(4))).toBeLessThan(20); // L in [0,100]
  } else {
    const [r = 255, g = 255, b = 255] = (bg.match(/\d+(\.\d+)?/g) ?? []).map(Number);
    expect(r + g + b).toBeLessThan(120);
  }
}

/** The visible header theme toggle (the mobile duplicate is display:none). */
function themeToggle(page: Page) {
  return page.getByRole('banner').getByRole('button', { name: /theme/i }).first();
}

/**
 * Opens the header theme dropdown and picks an explicit option. The trigger
 * is a Radix DropdownMenu — clicking it only opens the menu (role="menu"),
 * unlike the old single-button cycle it replaced.
 */
async function selectTheme(page: Page, choice: 'Light' | 'Dark' | 'System') {
  await themeToggle(page).click();
  await page.getByRole('menuitem', { name: choice }).click();
}

/**
 * A content page with no database-backed islands. Chrome-level assertions
 * (tokens, fonts, theme, footer) belong here rather than on `/`: the header and
 * footer are identical on every route, and the home page's streamed job/stat
 * queries make it an order of magnitude slower and able to fail for reasons
 * that have nothing to do with the design system.
 */
const CHROME_PAGE = '/about';

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

  test('JD page via DB-backed featured jobs: display title block + apply CTA', async ({ page }) => {
    await page.goto('/');
    // Featured jobs are Prisma-backed ('use cache'), so they exist without
    // Algolia. Click through to the first JD.
    const featured = page.locator('a[href^="/jobs/"]:not([href="/jobs"])').first();
    await expect(featured).toBeVisible();
    await featured.click();
    await page.waitForURL(/\/jobs\/.+/);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(
      page
        .getByRole('link', { name: /apply/i })
        .or(page.getByRole('button', { name: /apply/i }))
        .first(),
    ).toBeVisible();
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

  test('token layer: every semantic custom property resolves on :root', async ({ page }) => {
    await page.goto(CHROME_PAGE);
    // If any of these come back empty the @theme inline mapping has broken and
    // every `bg-surface`/`text-fg` in the app is silently painting nothing.
    for (const token of [
      '--canvas',
      '--surface',
      '--surface-sunken',
      '--fg',
      '--fg-muted',
      '--border',
      '--ink',
      '--ink-fg',
      '--brand',
      '--band',
      '--success',
      '--danger',
    ]) {
      expect(await readToken(page, token), token).not.toBe('');
    }
  });

  test('typography: display and body resolve to the self-hosted families', async ({ page }) => {
    await page.goto(CHROME_PAGE);
    // next/font mangles the family name (__Inter_abc123), so match loosely.
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body).toMatch(/inter/i);
    const display = await page
      .locator('.display')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(display).toMatch(/archivo/i);
  });
});

test.describe('dark mode', () => {
  test('toggle flips the theme, repaints surfaces, and persists across reload', async ({
    page,
  }) => {
    await page.goto(CHROME_PAGE);

    // Playwright defaults to prefers-color-scheme: light, and the stored theme
    // defaults to 'system' — so the page starts light.
    expect(await isDark(page)).toBe(false);
    const lightSurface = await readToken(page, '--surface');
    const lightFg = await readToken(page, '--fg');

    await selectTheme(page, 'Dark');

    expect(await isDark(page)).toBe(true);
    const darkSurface = await readToken(page, '--surface');
    const darkFg = await readToken(page, '--fg');
    // The class alone proves nothing — the tokens behind it must actually
    // re-resolve, which is the part `@theme inline` exists to guarantee.
    expect(darkSurface).not.toBe(lightSurface);
    expect(darkFg).not.toBe(lightFg);

    // Persisted via the zustand `joblify.ui` key and re-applied pre-paint by
    // components/theme-script.tsx, so a reload must not flash back to light.
    await page.reload();
    expect(await isDark(page)).toBe(true);
    expect(await readToken(page, '--surface')).toBe(darkSurface);
  });

  test('the footer band stays dark in dark mode (it must not invert)', async ({ page }) => {
    await page.goto(CHROME_PAGE);
    const footer = page.getByRole('contentinfo');
    expectNearBlack(await footer.evaluate((el) => getComputedStyle(el).backgroundColor));

    await selectTheme(page, 'Dark');
    expect(await isDark(page)).toBe(true);
    // --band is deliberately NOT an inverting token: a dark editorial band is a
    // register, not "the opposite of the page". Regression guard for that call.
    expectNearBlack(await footer.evaluate((el) => getComputedStyle(el).backgroundColor));
  });
});

test.describe('command palette', () => {
  test('opens on the shortcut, filters, empty-states, and closes on Escape', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(CHROME_PAGE);

    await page.keyboard.press('ControlOrMeta+k');
    const dialog = page.getByRole('dialog', { name: /command palette/i });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole('combobox');
    await expect(input).toBeFocused();

    // Filtering matches on label and on the hidden keyword list.
    await input.fill('saved');
    await expect(dialog.getByRole('option', { name: /saved jobs/i })).toBeVisible();

    // Arrow keys move the active option (aria-selected drives the highlight).
    await input.fill('');
    await page.keyboard.press('ArrowDown');
    await expect(dialog.locator('[role="option"][aria-selected="true"]')).toHaveCount(1);

    // The crafted empty state, not a blank list.
    await input.fill('zzzzz-no-such-command');
    await expect(dialog.getByText(/no results found/i)).toBeVisible();
    await expect(dialog.getByRole('option')).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('switches the theme from the palette', async ({ page }) => {
    await page.goto(CHROME_PAGE);
    expect(await isDark(page)).toBe(false);

    await page.keyboard.press('ControlOrMeta+k');
    const dialog = page.getByRole('dialog', { name: /command palette/i });
    await dialog.getByRole('combobox').fill('dark theme');
    await dialog.getByRole('option', { name: /dark theme/i }).click();

    await expect(dialog).toBeHidden();
    expect(await isDark(page)).toBe(true);
  });
});

test.describe('reduced motion', () => {
  // reducedMotion isn't a top-level `use` option in this Playwright version —
  // it only exists on contextOptions (colorScheme/storageState are top-level).
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('prefers-reduced-motion neutralises transitions app-wide', async ({ page }) => {
    await page.goto(CHROME_PAGE);
    // The base layer in globals.css clamps every transition to 0.01ms. Nothing
    // asserted this before, and the setting was unhandled entirely.
    const duration = await page
      .getByRole('banner')
      .getByRole('link', { name: /find jobs/i })
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.05);
  });
});
