import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { clerkSetupWithRetry } from './clerk-setup';
import { test, expect, type Page } from '@playwright/test';
import { STORAGE } from './storage-paths';
import { skipUnlessCompanyVerified } from './company-state';

// Responsive / adaptive-layout / robustness gate.
//
// Every route is loaded at real device sizes (including the 1px-either-side
// seams of the Tailwind breakpoints, where layouts actually break) and checked
// against concrete, automatable WCAG 2.2 AA and mobile-platform rules:
//
//   reflow         1.4.10  no horizontal scroll down to 320 CSS px
//   target-size    2.5.8   interactive targets >= 24x24 (spacing / inline exempt)
//   input-zoom     -       text fields >= 16px on phones (iOS Safari zooms the
//                          page on focus below that and does not zoom back)
//   viewport-meta  1.4.4   pinch-zoom is never disabled
//   chrome-height  -       fixed/sticky bars leave room for content on short
//                          landscape phones
//   layout shift   CWV     CLS <= 0.1 (>= 0.25 fails)
//
// axe-core (a11y.spec.ts) deliberately does not cover any of these: they depend
// on the rendered geometry at a given viewport, not on the DOM alone.
//
// Runs against any deployment: PLAYWRIGHT_BASE_URL=https://... bunx playwright
// test tests/e2e/responsive.spec.ts --project=chromium

// The app's service worker intercepts fetches and hangs page analysis; offline
// behaviour has its own describe below that opts back in.
test.use({ serviceWorkers: 'block' });

type Severity = 'fail' | 'warn';
type Finding = { rule: string; severity: Severity; detail: string };

type Profile = {
  name: string;
  width: number;
  height: number;
  phone: boolean;
  /** Run under mid-range-phone network/CPU throttling (layout shift is a timing problem). */
  throttle?: boolean;
};

// 639/767/1023 sit one pixel under Tailwind's sm/md/lg breakpoints. Layout bugs
// concentrate there (a sidebar that appears at 768 but a grid that is still in
// its narrow arrangement), and device-named sizes alone step right over them.
const PROFILES: Profile[] = [
  { name: '320 (reflow floor)', width: 320, height: 568, phone: true },
  { name: '360 (android)', width: 360, height: 800, phone: true },
  // The one throttled profile: slow enough that streamed content lands after
  // first paint, which is when layout shift happens. Throttling all of them
  // multiplies the suite's runtime by ~10 for no extra signal.
  { name: '390 (iphone)', width: 390, height: 844, phone: true, throttle: true },
  { name: '430 (iphone max)', width: 430, height: 932, phone: true },
  { name: '844x390 (phone landscape)', width: 844, height: 390, phone: true },
  { name: '639 (below sm)', width: 639, height: 900, phone: true },
  { name: '768 (tablet, md)', width: 768, height: 1024, phone: false },
  { name: '1023 (below lg)', width: 1023, height: 768, phone: false },
  { name: '1280 (laptop)', width: 1280, height: 720, phone: false },
  { name: '1920 (desktop)', width: 1920, height: 1080, phone: false },
  { name: '2560 (ultrawide)', width: 2560, height: 1080, phone: false },
];

// Subset used for signed-in pages: the extremes plus the tablet seam.
const AUTH_PROFILES = PROFILES.filter((p) =>
  ['320 (reflow floor)', '390 (iphone)', '768 (tablet, md)', '1280 (laptop)'].includes(p.name),
);

const PUBLIC_ROUTES = [
  '/',
  '/jobs',
  '/jobs/:slug',
  '/companies',
  '/about',
  '/resources',
  '/sign-in',
  '/sign-up',
  '/employer-setup',
  '/legal/privacy',
  '/legal/terms',
  '/legal/ai',
  '/accessibility',
  '/this-route-does-not-exist-zzz',
];

const JOBSEEKER_ROUTES = [
  '/jobseeker/applications',
  '/jobseeker/profile',
  '/jobseeker/resumes',
  '/jobseeker/saved',
  '/jobseeker/matches',
  '/jobseeker/notifications',
  '/jobseeker/chats',
];

const COMPANY_ROUTES = [
  '/company/jobs',
  '/company/jobs/new',
  '/company/jobseekers',
  '/company/notifications',
  '/company/settings',
  '/company/chats',
];

const hasJobseeker = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER);
const hasCompany = Boolean(process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_COMPANY);

let jobSlug = '/jobs';

test.beforeAll(async ({ playwright }) => {
  if (hasJobseeker || hasCompany) await clerkSetupWithRetry();
  // A real, published job for the detail template. Prefer a seeded listing over
  // e2e-created ones so the page has realistic content to lay out.
  const ctx = await playwright.request.newContext({
    baseURL: test.info().project.use.baseURL,
    extraHTTPHeaders: test.info().project.use.extraHTTPHeaders,
  });
  try {
    const res = await ctx.get('/api/v1/jobs/search?q=');
    if (res.ok()) {
      const { hits } = (await res.json()) as { hits?: { slug: string }[] };
      const pick = hits?.find((h) => !h.slug.startsWith('e2e-')) ?? hits?.[0];
      if (pick) jobSlug = `/jobs/${pick.slug}`;
    }
  } finally {
    await ctx.dispose();
  }
});

function resolveRoute(route: string): string {
  return route === '/jobs/:slug' ? jobSlug : route;
}

/** Layout shifts recorded from navigation start, with the nodes that moved. */
async function trackLayoutShifts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: { value: number; culprits: string[] } };
    w.__cls = { value: 0, culprits: [] };
    const describe = (n: Node | null): string => {
      if (!(n instanceof Element)) return 'unknown';
      const cls =
        typeof n.className === 'string'
          ? n.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
      return `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${cls ? '.' + cls : ''}`;
    };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
          sources?: { node: Node | null }[];
        }[]) {
          if (e.hadRecentInput) continue;
          w.__cls.value += e.value;
          for (const s of e.sources ?? []) w.__cls.culprits.push(describe(s.node));
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* layout-shift unsupported (non-Chromium) — CLS is then not measured */
    }
  });
}

/**
 * Mid-range phone on a slow 4G link (Lighthouse's mobile preset: ~1.6 Mbit/s,
 * 150 ms RTT, 4x CPU). Layout shift is a timing problem: on an unthrottled
 * connection the streamed body lands in the same frame as the shell and nothing
 * moves, so an unthrottled run reported CLS 0.00 for a page that scored 0.41 in
 * Lighthouse. Chromium only (CDP).
 */
async function throttleLikeAPhone(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

/** Everything geometry-dependent, evaluated inside the page. */
function auditInPage(opts: { phone: boolean }) {
  type F = { rule: string; severity: 'fail' | 'warn'; detail: string };
  const findings: F[] = [];
  const add = (rule: string, severity: 'fail' | 'warn', detail: string) =>
    findings.push({ rule, severity, detail });

  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;

  const sel = (el: Element): string => {
    const cls =
      typeof el.className === 'string'
        ? el.className
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((c) => '.' + c)
            .join('')
        : '';
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}${text ? ` "${text}"` : ''}`;
  };
  const visible = (el: Element): boolean => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') {
      return false;
    }
    if (el.closest('[aria-hidden="true"],[inert]')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // ── reflow (1.4.10) ─────────────────────────────────────────────────────
  const scrollW = document.documentElement.scrollWidth;
  if (scrollW > vw + 1) {
    const clipped = (el: Element): boolean => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(p).overflowX)) return true;
      }
      return false;
    };
    const offenders: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 1) continue;
      if (!visible(el) || clipped(el)) continue;
      offenders.push(`${sel(el)} right=${Math.round(r.right)}`);
      if (offenders.length >= 5) break;
    }
    add(
      'reflow',
      'fail',
      `scrollWidth ${scrollW} > viewport ${vw}: ${offenders.join(' | ') || 'no unclipped offender (transformed/fixed element?)'}`,
    );
  }

  // ── target size (2.5.8) ─────────────────────────────────────────────────
  const targetSel =
    'a[href],button,input:not([type="hidden"]),select,textarea,summary,' +
    '[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],' +
    '[role="tab"],[role="menuitem"],[role="option"],[tabindex]:not([tabindex="-1"])';
  const targets = Array.from(document.querySelectorAll(targetSel))
    .filter((el) => visible(el) && !(el as HTMLButtonElement).disabled)
    .map((el) => ({ el, r: el.getBoundingClientRect() }));
  const undersized: string[] = [];
  const advisory: string[] = [];
  for (const { el, r } of targets) {
    if (r.width <= 1 && r.height <= 1) continue; // visually-hidden helpers
    if (r.width < 24 || r.height < 24) {
      const parent = el.parentElement;
      const inline =
        getComputedStyle(el).display === 'inline' &&
        !!parent &&
        (parent.textContent || '').trim().length > (el.textContent || '').trim().length + 8;
      if (inline) continue; // "inline" exception
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const crowded = targets.some(({ el: o, r: or }) => {
        if (o === el || el.contains(o) || o.contains(el)) return false;
        const dx = Math.max(or.left - cx, 0, cx - or.right);
        const dy = Math.max(or.top - cy, 0, cy - or.bottom);
        return Math.hypot(dx, dy) < 12; // 24px circle would touch a neighbour
      });
      if (crowded) undersized.push(`${sel(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    } else if (opts.phone && (r.width < 44 || r.height < 44)) {
      advisory.push(`${sel(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  if (undersized.length) {
    add(
      'target-size',
      'fail',
      `${undersized.length} target(s) < 24x24 with no spacing exemption: ${undersized.slice(0, 5).join(' | ')}`,
    );
  }
  if (advisory.length) {
    add(
      'target-size-44',
      'warn',
      `${advisory.length} target(s) under 44x44 on a touch viewport: ${advisory.slice(0, 4).join(' | ')}`,
    );
  }

  // ── iOS input zoom ──────────────────────────────────────────────────────
  if (opts.phone) {
    const small = Array.from(
      document.querySelectorAll(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="submit"]):not([type="button"]),select,textarea',
      ),
    )
      .filter(visible)
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16);
    if (small.length) {
      add(
        'input-zoom',
        'fail',
        `${small.length} field(s) under 16px (iOS zooms on focus): ${small
          .slice(0, 4)
          .map((el) => `${sel(el)} ${getComputedStyle(el).fontSize}`)
          .join(' | ')}`,
      );
    }
  }

  // ── viewport meta (1.4.4) ───────────────────────────────────────────────
  const meta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
  if (!meta) add('viewport-meta', 'fail', 'no <meta name="viewport">');
  else {
    if (/user-scalable\s*=\s*(no|0)/i.test(meta)) {
      add('viewport-meta', 'fail', `pinch-zoom disabled: ${meta}`);
    }
    const max = /maximum-scale\s*=\s*([\d.]+)/i.exec(meta);
    if (max && parseFloat(max[1]!) < 2) {
      add('viewport-meta', 'fail', `maximum-scale ${max[1]} blocks zoom: ${meta}`);
    }
  }

  // ── images ──────────────────────────────────────────────────────────────
  const imgs = Array.from(document.images).filter(visible);
  const broken = imgs.filter(
    (i) => i.complete && i.naturalWidth === 0 && !i.src.startsWith('data:'),
  );
  if (broken.length) {
    add(
      'broken-image',
      'fail',
      broken
        .slice(0, 3)
        .map((i) => i.currentSrc || i.src)
        .join(' | '),
    );
  }

  // ── text legibility ─────────────────────────────────────────────────────
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const tiny: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const p = n.parentElement;
    if (!p || (n.nodeValue || '').trim().length < 3) continue;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(p.tagName) || !visible(p)) continue;
    const fs = parseFloat(getComputedStyle(p).fontSize);
    if (fs < 12) tiny.push(`${sel(p)} ${fs}px`);
  }
  if (tiny.length) {
    add(
      'tiny-text',
      'warn',
      `${tiny.length} text run(s) under 12px: ${tiny.slice(0, 4).join(' | ')}`,
    );
  }

  // ── fixed/sticky chrome vs content area ─────────────────────────────────
  let top = 0;
  let bottom = 0;
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const pos = getComputedStyle(el).position;
    if ((pos !== 'fixed' && pos !== 'sticky') || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < vw * 0.5) continue;
    if (r.top <= 1 && r.bottom > 0) top = Math.max(top, r.bottom);
    if (r.bottom >= vh - 1 && r.top < vh) bottom = Math.max(bottom, vh - r.top);
  }
  const chrome = (top + bottom) / vh;
  if (chrome > 0.45) {
    add('chrome-height', 'fail', `fixed bars take ${Math.round(chrome * 100)}% of ${vh}px height`);
  } else if (chrome > 0.3) {
    add('chrome-height', 'warn', `fixed bars take ${Math.round(chrome * 100)}% of ${vh}px height`);
  }

  // ── document basics ─────────────────────────────────────────────────────
  if (!document.documentElement.lang) add('lang', 'fail', '<html lang> missing');
  if (!document.title.trim()) add('title', 'fail', 'empty <title>');
  const mains = document.querySelectorAll('main,[role="main"]').length;
  if (mains !== 1) add('landmark-main', 'warn', `${mains} main landmarks`);

  return findings;
}

async function settle(page: Page, idleTimeout = 8_000): Promise<void> {
  await page.waitForLoadState('load');
  // Streaming (PPR) and hydration keep painting after `load`; layout shifts
  // from late islands only show up if we wait for them.
  await page.waitForLoadState('networkidle', { timeout: idleTimeout }).catch(() => undefined);
  await page.waitForTimeout(1_200);
}

/**
 * Pre-answers the consent banner. Geometry audits describe the page, not the
 * first-visit overlay, which is fixed to the viewport and so distorts every
 * spacing and overlap measurement beneath it (it made the footer links look
 * crowded). The banner has its own tests below.
 */
async function answerConsent(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('joblify.consent', 'necessary');
    } catch {
      /* storage blocked: the banner simply shows */
    }
  });
}

/** Re-runs a page.evaluate when a client-side navigation lands mid-call. */
async function withNavigationRetry<T>(page: Page, run: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (e) {
      if (attempt >= 2 || !/Execution context was destroyed/i.test(String(e))) throw e;
      await settle(page, 5_000);
    }
  }
}

async function auditRoute(
  page: Page,
  route: string,
  profile: Profile,
  browserName: string,
): Promise<Finding[]> {
  const throttled = profile.throttle === true && browserName === 'chromium';
  if (throttled) await throttleLikeAPhone(page);
  await answerConsent(page);
  await trackLayoutShifts(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`.slice(0, 220)));
  page.on('console', (m) => {
    if (m.type() === 'error' && /content security policy|refused to/i.test(m.text())) {
      errors.push(`csp: ${m.text()}`.slice(0, 220));
    }
  });

  const response = await page.goto(resolveRoute(route), { waitUntil: 'domcontentloaded' });
  await settle(page, throttled ? 20_000 : 8_000);

  const findings = await withNavigationRetry(page, () =>
    page.evaluate(auditInPage, { phone: profile.phone }),
  );

  if (response && response.status() >= 500) {
    findings.push({ rule: 'http', severity: 'fail', detail: `HTTP ${response.status()}` });
  }
  for (const e of errors) findings.push({ rule: 'runtime', severity: 'fail', detail: e });

  const cls = await withNavigationRetry(page, () =>
    page.evaluate(
      () => (window as unknown as { __cls?: { value: number; culprits: string[] } }).__cls,
    ),
  );
  if (cls) {
    const culprits = [...new Set(cls.culprits)].slice(0, 5).join(' | ') || 'unattributed';
    if (cls.value >= 0.25) {
      findings.push({
        rule: 'cls',
        severity: 'fail',
        detail: `CLS ${cls.value.toFixed(3)}: ${culprits}`,
      });
    } else if (cls.value > 0.1) {
      findings.push({
        rule: 'cls',
        severity: 'warn',
        detail: `CLS ${cls.value.toFixed(3)}: ${culprits}`,
      });
    }
  }
  return findings;
}

async function report(findings: Finding[]): Promise<void> {
  await test.info().attach('findings.json', {
    body: JSON.stringify(findings, null, 2),
    contentType: 'application/json',
  });
  for (const f of findings) {
    test.info().annotations.push({ type: `${f.severity}:${f.rule}`, description: f.detail });
  }
  const failures = findings.filter((f) => f.severity === 'fail');
  expect(failures.map((f) => `${f.rule}: ${f.detail}`)).toEqual([]);
}

test.describe('public pages adapt to every viewport', () => {
  for (const profile of PROFILES) {
    test.describe(profile.name, () => {
      test.use({
        viewport: { width: profile.width, height: profile.height },
        isMobile: profile.phone,
        hasTouch: profile.phone,
      });
      for (const route of PUBLIC_ROUTES) {
        test(route, async ({ page, browserName }) => {
          test.skip(browserName === 'firefox' && profile.phone, 'Firefox has no mobile emulation');
          await report(await auditRoute(page, route, profile, browserName));
        });
      }
    });
  }
});

test.describe('jobseeker pages adapt to every viewport', () => {
  test.skip(!hasJobseeker, 'requires E2E_TEST_* creds');
  test.use({ storageState: hasJobseeker ? STORAGE.jobseeker : undefined });
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
  });
  for (const profile of AUTH_PROFILES) {
    test.describe(profile.name, () => {
      test.use({
        viewport: { width: profile.width, height: profile.height },
        isMobile: profile.phone,
        hasTouch: profile.phone,
      });
      for (const route of JOBSEEKER_ROUTES) {
        test(route, async ({ page, browserName }) => {
          test.skip(browserName === 'firefox' && profile.phone, 'Firefox has no mobile emulation');
          await report(await auditRoute(page, route, profile, browserName));
        });
      }
    });
  }
});

test.describe('company pages adapt to every viewport', () => {
  test.skip(!hasCompany, 'requires E2E_TEST_* creds');
  test.use({ storageState: hasCompany ? STORAGE.company : undefined });
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await skipUnlessCompanyVerified(page);
  });
  for (const profile of AUTH_PROFILES) {
    test.describe(profile.name, () => {
      test.use({
        viewport: { width: profile.width, height: profile.height },
        isMobile: profile.phone,
        hasTouch: profile.phone,
      });
      for (const route of COMPANY_ROUTES) {
        test(route, async ({ page, browserName }) => {
          test.skip(browserName === 'firefox' && profile.phone, 'Firefox has no mobile emulation');
          await report(await auditRoute(page, route, profile, browserName));
        });
      }
    });
  }
});

// ── Behaviour that is not a static geometry rule ───────────────────────────

/** Counts requestAnimationFrame scheduling from the first script on the page. */
async function countAnimationFrames(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __raf: number };
    w.__raf = 0;
    const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      w.__raf += 1;
      return orig(cb);
    };
  });
}
const rafCount = (page: Page) =>
  page.evaluate(() => (window as unknown as { __raf: number }).__raf);

test.describe('user preferences and degraded conditions', () => {
  // Android's "largest" font size doubles the root font. Controls and text sized
  // in rem double with it; anything that no longer fits is unreachable without
  // sideways scrolling (the mobile header's menu button was).
  for (const route of ['/', '/jobs', '/sign-in', '/companies']) {
    test(`200% text still fits a phone without sideways scrolling (1.4.4): ${route}`, async ({
      page,
    }) => {
      await answerConsent(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await settle(page);
      await page.addStyleTag({ content: 'html{font-size:200% !important}' });
      await page.waitForTimeout(300);
      const { over, offenders } = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const fixedOrClipped = (el: Element) => {
          for (let n: Element | null = el; n; n = n.parentElement) {
            if (getComputedStyle(n).position === 'fixed') return true;
            if (n !== el && /(hidden|clip|auto|scroll)/.test(getComputedStyle(n).overflowX)) {
              return true;
            }
          }
          return false;
        };
        const out: string[] = [];
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          if (out.length >= 4 || fixedOrClipped(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.right <= vw + 1) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          out.push(
            `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} right=${Math.round(r.right)}`,
          );
        }
        return { over: document.documentElement.scrollWidth - vw, offenders: out };
      });
      expect(
        over,
        `overflow in px at 200% text; offenders: ${offenders.join(' | ')}`,
      ).toBeLessThanOrEqual(1);
    });
  }

  test('WCAG text-spacing overrides do not overflow (1.4.12)', async ({ page }) => {
    await answerConsent(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await settle(page);
    await page.addStyleTag({
      content:
        '*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}' +
        'p{margin-bottom:2em !important}',
    });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'horizontal overflow in px with text-spacing overrides').toBeLessThanOrEqual(
      1,
    );
  });

  // First visit, so the fixed consent banner is showing: that is the state in
  // which it used to sit on top of the element a Tab press had just focused.
  for (const [route, width, height] of [
    ['/jobs', 390, 844],
    ['/', 390, 844],
    ['/jobs', 320, 568],
  ] as const) {
    test(`keyboard focus is not hidden behind fixed chrome (2.4.11): ${route} @${width}`, async ({
      page,
    }) => {
      // Smooth scrolling would have the focused element mid-flight when sampled.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await settle(page);
      const hidden: string[] = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(60);
        const hit = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const r = el.getBoundingClientRect();
          // Off-screen means the browser has not finished scrolling to it; the
          // next press will tell. Only on-screen focus can be "covered".
          if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) return null;
          const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
          const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
          const top = document.elementFromPoint(x, y);
          if (!top || top === el || el.contains(top) || top.contains(el)) return null;
          const d = (n: Element) => `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}`;
          return `${d(el)} "${(el.textContent || '').trim().slice(0, 20)}" covered by ${d(top)}`;
        });
        if (hit) hidden.push(hit);
      }
      expect([...new Set(hidden)]).toEqual([]);
    });
  }

  test('reduced motion: nothing animates on its own (2.2.2 / 2.3.3)', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await answerConsent(page);
    await countAnimationFrames(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const before = await rafCount(page);
    await page.waitForTimeout(1_500);
    const ticks = (await rafCount(page)) - before;
    const infinite = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity,
          ).length,
    );
    await ctx.close();
    expect(infinite, 'infinite CSS animations while reduced motion is on').toBe(0);
    expect(
      ticks,
      'requestAnimationFrame callbacks in 1.5s while reduced motion is on',
    ).toBeLessThan(10);
  });

  test('an off-screen animation stops consuming frames (battery / INP)', async ({ page }) => {
    await answerConsent(page);
    await countAnimationFrames(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await settle(page);
    const onScreen = (await rafCount(page)) - 0;
    expect(onScreen, 'sanity: the hero animation runs while it is visible').toBeGreaterThan(10);
    // Scroll well past the hero, let any in-flight frame land, then measure.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    const before = await rafCount(page);
    await page.waitForTimeout(1_500);
    const ticks = (await rafCount(page)) - before;
    expect(ticks, 'rAF callbacks in 1.5s with the hero off-screen').toBeLessThan(15);
  });
});

test.describe('consent banner', () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    test(`leaves room for the page and reserves its own space @${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const banner = page.getByRole('complementary', { name: 'Cookie preferences' });
      await expect(banner).toBeVisible();

      const box = await banner.boundingBox();
      expect(box, 'banner has a box').not.toBeNull();
      expect(box!.height / viewport.height, 'share of the viewport it covers').toBeLessThanOrEqual(
        0.5,
      );

      // Published for scroll-padding-bottom / body padding in globals.css.
      const reserved = await page.evaluate(() =>
        parseFloat(document.documentElement.style.getPropertyValue('--consent-banner-h')),
      );
      expect(reserved, 'reserved space covers the banner').toBeGreaterThanOrEqual(box!.height);

      // Deciding removes the banner and gives the space back.
      await page.getByRole('button', { name: 'Necessary only' }).click();
      await expect(banner).toBeHidden();
      expect(
        await page.evaluate(() =>
          document.documentElement.style.getPropertyValue('--consent-banner-h'),
        ),
      ).toBe('');
    });
  }
});

test.describe('works without JavaScript (SSR / progressive enhancement)', () => {
  test.use({ javaScriptEnabled: false });

  test('home page still renders its headline and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.getByRole('link').count()).toBeGreaterThan(5);
  });

  test('jobs listing is server-rendered', async ({ page }) => {
    // The first page of results is run on the server (page.tsx ->
    // lib/search/jobs-first-page.ts) so it is in the HTML that crawlers
    // without JavaScript read: the links to the postings are in the document.
    //
    // Presence, not visibility, is what is asserted. The listing streams in
    // behind a Suspense boundary, and React ships a streamed boundary inside a
    // `hidden` container that an inline script reveals — so with scripts off the
    // links are in the markup but not painted. Anything that parses the HTML
    // sees them; a person with JavaScript disabled still sees the skeleton.
    await page.goto('/jobs');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('a[href^="/jobs/"]').first()).toBeAttached();
    expect(await page.locator('a[href^="/jobs/"]').count()).toBeGreaterThan(0);
  });
});

test.describe('error states', () => {
  // Unknown *routes* are a real 404. An unknown job slug is deliberately 200 +
  // the 404 UI + noindex: under PPR the shell has committed before the streamed
  // body can call notFound() (contract documented in critical-paths.spec.ts).

  test('hostile query strings do not break the jobs page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const q = encodeURIComponent('"><img src=x onerror=alert(1)>' + 'a'.repeat(600));
    const res = await page.goto(`/jobs?q=${q}&page=-5&sort=%00`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
