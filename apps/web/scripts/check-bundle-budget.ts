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
 */
const DEFAULT_BUDGET_KB = 375;

/**
 * Per-route overrides. Every route here carries a react-hook-form + zod
 * validated form, which is worth roughly 30 KB gzip over the baseline. They are
 * listed individually rather than folded into the default so that a route
 * *without* a form cannot quietly grow into the same allowance.
 */
const BUDGET_KB: Record<string, number> = {
  '/company/settings': 420,
  '/company/jobs/new': 410,
  '/company/jobs/[id]/edit': 410,
  '/jobseeker/profile': 410,
  '/jobseeker/resumes/builder': 410,
  '/jobseeker/resumes': 400,
  '/employer-setup': 405,
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
  const rel = relative(APP_DIR, file).replace(/\.html$/, '').split(sep).join('/');
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
