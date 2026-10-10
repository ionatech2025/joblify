/* eslint-disable no-console -- CLI reporter; matches scripts/migrate-mongo-to-neon.ts */
/**
 * First-load JavaScript budget.
 *
 * Reads the production build rather than a running server, which is the point:
 * it can measure the authenticated console — /onboarding, /employer-setup,
 * /jobseeker/* — that Lighthouse cannot reach without a session. Those routes
 * are exactly where the payload had grown unwatched.
 *
 * For every prerendered shell in .next/server/app it collects the scripts the
 * document actually requests, gzips them, and sums. That is what a first-time
 * visitor downloads before the page is interactive — the number Next.js used to
 * print per route and Turbopack no longer does.
 *
 * Run after `next build`:  bun run scripts/check-bundle-budget.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const APP_DIR = join(process.cwd(), '.next', 'server', 'app');
const NEXT_DIR = join(process.cwd(), '.next');

/**
 * Ceilings in KB gzip.
 *
 * Set a little above what the build currently produces, not at some aspirational
 * round number — a budget you are already over is a budget nobody can act on.
 * Tighten them as payload comes down; never raise one without saying in the
 * commit message what got heavier and why.
 *
 * RAISED 2026-08-28, +21 KB across the board. This gate caught the regression on
 * the first change after it was added, which is the system working — so the
 * attribution is recorded here rather than waved through. Measured per route by
 * building with each piece removed in turn:
 *
 *   +5.9 KB  React Compiler (next.config.ts `reactCompiler`). Automatic
 *            memoization across an app that had 2 useMemo, 1 useCallback and 0
 *            memo() in it. Bytes bought at build time for re-render cost saved
 *            at runtime — and since the same pass added field INP collection
 *            (app/components/web-vitals.tsx), the trade is now measurable
 *            rather than assumed. If INP does not move, take this back out
 *            first: it is the least certain of the three.
 *   +8.9 KB  web-vitals + BotID's client, together. Both must load on every
 *            route: CWV observers have to attach before LCP, and BotID's
 *            challenge has to be in place before the apply POST. Before this,
 *            `checkBotId()` was forming a verdict on no signal at all.
 *   +6.3 KB  the shared client modules from the audit remediation —
 *            lib/action-result.ts `unwrap` (14 call sites), TimeStamp (9),
 *            lib/use-form-draft.ts (4), the palette focus trap.
 *
 * All three close a gap the previous ceiling was set without. Tighten back
 * toward 375 by splitting the console's form routes, not by dropping these.
 *
 * LOWERED 2026-10-10, 396 -> 340 (the per-route overrides by 56 to 90). Measured on the
 * lightest routes: 360.2 KB -> 284.1 KB (-76 KB, -21%). Two things account for
 * it, sized from `next experimental-analyze` (its compressed estimate, so the
 * two figures are indicative and do not sum exactly to the gzip delta):
 *
 *   ~67 KB  the Sentry browser SDK. It was imported statically by
 *           instrumentation-client.ts and both error boundaries, so every page
 *           carried it - including this deployment, where there is no DSN and
 *           init() never runs. It is now a dynamic import that does not exist
 *           without a DSN, and loads at idle with one (lib/observability/
 *           sentry-client.ts).
 *   ~25 KB  @radix-ui/react-dropdown-menu, which the header theme control
 *           pulled onto every page. The menu is fetched on first use
 *           (app/components/ui/theme-menu.tsx).
 *
 * The ceilings sit ~15-20 KB above what each route measures, which is the
 * convention above - not a new floor to be spent. /_global-error carries no
 * shared UI and keeps the default.
 */
const DEFAULT_BUDGET_KB = 340;

/**
 * Per-route overrides. Every route here carries a react-hook-form + zod
 * validated form, which is worth roughly 30 KB gzip over the baseline. They are
 * listed individually rather than folded into the default so that a route
 * *without* a form cannot quietly grow into the same allowance.
 */
const BUDGET_KB: Record<string, number> = {
  '/company/settings': 340,
  '/company/jobs/new': 345,
  '/company/jobs/[id]/edit': 345,
  '/jobseeker/profile': 345,
  '/jobseeker/resumes/builder': 345,
  '/jobseeker/resumes': 350,
  '/employer-setup': 340,
};

const budgetFor = (route: string): number => BUDGET_KB[route] ?? DEFAULT_BUDGET_KB;

const SCRIPT_RE = /\/_next\/(static\/[^"']+?\.js)/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** ".next/server/app/jobseeker/profile.html" -> "/jobseeker/profile" */
function routeOf(file: string): string {
  const rel = relative(APP_DIR, file)
    .replace(/\.html$/, '')
    .split(sep)
    .join('/');
  if (rel === 'index') return '/';
  return `/${rel}`;
}

function gzippedBytes(file: string): number {
  try {
    return gzipSync(readFileSync(file)).length;
  } catch {
    return 0;
  }
}

const rows = walk(APP_DIR)
  .map((file) => {
    const html = readFileSync(file, 'utf8');
    const scripts = new Set(
      Array.from(html.matchAll(SCRIPT_RE), (m) => m[1]).filter((s): s is string => Boolean(s)),
    );
    let bytes = 0;
    for (const script of scripts) bytes += gzippedBytes(join(NEXT_DIR, script));
    const route = routeOf(file);
    return { route, kb: bytes / 1024, chunks: scripts.size, budget: budgetFor(route) };
  })
  .filter((r) => r.chunks > 0)
  .sort((a, b) => b.kb - a.kb);

const over = rows.filter((r) => r.kb > r.budget);

const width = Math.max(...rows.map((r) => r.route.length), 5);
console.log(`\nFirst-load JS (gzip) — ${rows.length} prerendered routes\n`);
console.log(`  ${'route'.padEnd(width)}  ${'size'.padStart(9)}  ${'budget'.padStart(8)}  chunks`);
console.log(`  ${'-'.repeat(width)}  ${'-'.repeat(9)}  ${'-'.repeat(8)}  ------`);
for (const r of rows) {
  const flag = r.kb > r.budget ? 'OVER' : '';
  console.log(
    `  ${r.route.padEnd(width)}  ${`${r.kb.toFixed(1)} KB`.padStart(9)}  ${`${r.budget} KB`.padStart(8)}  ${String(r.chunks).padStart(6)} ${flag}`,
  );
}

if (over.length > 0) {
  console.error(
    `\n${over.length} route(s) over budget:\n${over
      .map((r) => `  ${r.route} — ${r.kb.toFixed(1)} KB > ${r.budget} KB`)
      .join('\n')}\n`,
  );
  console.error(
    'Shrink the payload, or raise the ceiling in scripts/check-bundle-budget.ts\nwith a note about what got heavier.\n',
  );
  process.exit(1);
}

console.log(`\nAll ${rows.length} routes within budget.\n`);
