import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Clerk's browser SDK is loaded on demand (app/components/clerk-host.tsx). That
// is only true while nothing on the first-load path imports it statically — one
// `import { SignedIn } from '@clerk/nextjs'` in a shared client component puts
// ~40 KB gzip back on every page and starts clerk-js for every visitor, with no
// error and no visible change. The build cannot see that; this can.
//
// Two specifiers carry the browser SDK:
//   '@clerk/clerk-react'  the provider and hooks
//   '@clerk/nextjs'       the same, re-exported with Next glue (the root
//                         specifier only; '/server', '/errors' are server-side)
// Both are listed with the reason each file may import them. Adding a file here
// is a decision, not a formality.

const ROOT = join(__dirname, '..', '..');

const ALLOWED: Record<string, string> = {
  'app/components/clerk-provider.tsx':
    'the hand-built provider; reached only through clerk-runtime.tsx',
  'app/components/clerk-runtime.tsx': 'the lazily loaded runtime that mounts the provider',
  'app/components/header-auth.tsx':
    'server component: <UserButton/> is a client reference rendered only for a signed-in visitor, through a ClerkSlot',
  'app/(auth)/sign-in/[[...sign-in]]/page.tsx':
    'server page: <SignIn/> is a client reference, rendered through a ClerkSlot',
  'app/(auth)/sign-up/[[...sign-up]]/page.tsx':
    'server page: <SignUp/> is a client reference, rendered through a ClerkSlot',
};

const BROWSER_SDK = /from\s+['"](@clerk\/clerk-react|@clerk\/nextjs)['"]/;

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
});
