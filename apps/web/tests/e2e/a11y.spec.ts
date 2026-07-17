import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Five seed pages we promise to keep accessibility-clean. axe-core only —
// covers the automation-detectable subset (~30-40% of WCAG); manual SR
// testing closes the rest.

// The app's service worker (public/sw.js) intercepts fetches for its
// network-first/cache-first strategy, which hangs axe-core's page analysis
// indefinitely — axe never resolves, so `.analyze()` just times out. Block
// service worker registration for this spec only; nothing here exercises
// offline/PWA behavior.
test.use({ serviceWorkers: 'block' });

const DEFAULT_PAGES = [
  { path: '/', label: 'home' },
  { path: '/jobs', label: 'jobs search' },
  { path: '/companies', label: 'companies' },
  { path: '/sign-in', label: 'sign-in' },
  { path: '/sign-up', label: 'sign-up' },
];

// CI without live DB/Clerk can only render the static home page, so it sets
// A11Y_PATHS=/ to scope the gate. Full coverage runs locally or against a
// preview deploy (where real services exist) with A11Y_PATHS unset.
const PAGES = process.env.A11Y_PATHS
  ? process.env.A11Y_PATHS.split(',').map((p) => ({ path: p.trim(), label: p.trim() }))
  : DEFAULT_PAGES;

for (const page of PAGES) {
  test(`a11y: ${page.label} (${page.path}) has no critical/serious axe violations`, async ({ page: playwright }) => {
    await playwright.goto(page.path);
    const results = await new AxeBuilder({ page: playwright })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    if (critical.length > 0) {
      console.warn(JSON.stringify(critical, null, 2));
    }
    expect(critical, `axe violations on ${page.path}`).toEqual([]);
  });
}
