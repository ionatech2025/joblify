import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Clerk's browser SDK is loaded on demand (app/components/clerk-host.tsx). That
// is only true while nothing on the first-load path imports it — and "imports"
// includes a *server* component importing a Clerk component to render it only
// for a signed-in visitor: Next ships the client chunks a server module
// references with every page of its layout, rendered or not. That is exactly
// how the first version of this feature still carried @clerk/clerk-react
// (~27 KB gzip) in every page's scripts while its tests passed.
//
// So the rule is: widgets are named, not imported (<ClerkSlot widget="…"/>), and
// only the lazily loaded runtime imports them. Two specifiers carry the SDK:
//   '@clerk/clerk-react'  the provider and hooks
//   '@clerk/nextjs'       the same, re-exported with Next glue (the root
//                         specifier only; '/server' and '/errors' are
//                         server-side and cost the browser nothing)
// Type-only imports are erased and are fine. Adding a file to ALLOWED is a
// decision, not a formality; scripts/check-bundle-budget.ts independently checks
// the built chunks.

const ROOT = join(__dirname, '..', '..');

const ALLOWED: Record<string, string> = {
  'app/components/clerk-provider.tsx':
    'the hand-built provider; imported only by clerk-runtime.tsx',
  'app/components/clerk-runtime.tsx':
    'the lazily loaded runtime that mounts the provider and the named widgets',
};

// A value import: `import x from`, `import { a } from`, `import * as c from`,
// `import 'side-effect'`-style are not used for these packages. `import type`
// is excluded (erased by the compiler).
const BROWSER_SDK =
  /^\s*import\s+(?!type\b)[^;]*?from\s+['"](@clerk\/clerk-react|@clerk\/nextjs)['"]/m;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('Clerk browser SDK imports', () => {
  const offenders: string[] = [];
  for (const dir of ['app', 'lib']) {
    for (const file of walk(join(ROOT, dir))) {
      const rel = relative(ROOT, file).split(sep).join('/');
      if (BROWSER_SDK.test(readFileSync(file, 'utf8')) && !(rel in ALLOWED)) offenders.push(rel);
    }
  }

  it('is imported only by the files that are allowed to', () => {
    expect(
      offenders,
      'These files import the Clerk browser SDK directly, which puts it back on the first-load path. ' +
        'Render the widget through <ClerkSlot> (app/components/clerk-slot.tsx) instead, or add the file to ' +
        'ALLOWED with the reason.',
    ).toEqual([]);
  });

  it('every allowed file still exists and still imports it (the list cannot rot)', () => {
    for (const rel of Object.keys(ALLOWED)) {
      const text = readFileSync(join(ROOT, rel), 'utf8');
      expect(BROWSER_SDK.test(text), rel).toBe(true);
    }
  });

  it('the root layout and the header carry no Clerk provider or widget', () => {
    for (const rel of ['app/layout.tsx', 'app/components/header.tsx']) {
      const text = readFileSync(join(ROOT, rel), 'utf8');
      expect(text, rel).not.toMatch(
        /ClerkProvider|ClerkClientProvider|<SignedIn|<SignedOut|<UserButton/,
      );
    }
  });

  it('server components name their widget; they do not import one', () => {
    // The files that place widgets today. Importing the component here would
    // put its chunk — and @clerk/clerk-react with it — in every page's scripts.
    for (const rel of [
      'app/components/header-auth.tsx',
      'app/(auth)/sign-in/[[...sign-in]]/page.tsx',
      'app/(auth)/sign-up/[[...sign-up]]/page.tsx',
    ]) {
      const text = readFileSync(join(ROOT, rel), 'utf8');
      expect(text, rel).toMatch(/<ClerkSlot\b/);
      expect(text, rel).not.toMatch(/from\s+['"]@clerk\/nextjs['"]/);
    }
  });
});
