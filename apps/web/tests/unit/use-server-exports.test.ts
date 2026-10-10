import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// A 'use server' module may export only async functions (and types). Next 16.4
// enforces that when the module is LOADED in a production build, not when it is
// compiled: `next build` passes, and then the action throws "A "use server"
// file can only export async functions, found object" the first time anyone
// calls it. That is how Save profile broke for every jobseeker, with a vague
// "Couldn't save your profile" and nothing in the build log.
//
// This is a static scan, so it needs no server and runs with the unit suite.

const ROOT = join(__dirname, '..', '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'coverage'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(path, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(path);
  }
  return out;
}

const isUseServer = (src: string) =>
  /^\s*['"]use server['"];?\s*$/m.test(src.split('\n').slice(0, 8).join('\n'));

describe("'use server' modules", () => {
  const files = [...sourceFiles(join(ROOT, 'app')), ...sourceFiles(join(ROOT, 'lib'))].filter((f) =>
    isUseServer(readFileSync(f, 'utf8')),
  );

  it('finds the server action modules (guards the scan itself)', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('export only async functions and types', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!/^export\s/.test(line)) return;
        if (/^export\s+(async\s+function|type\s|interface\s)/.test(line)) return;
        if (/^export\s*\{\s*type\b/.test(line) || /^export\s+type\s*\{/.test(line)) return;
        offenders.push(`${file.replace(ROOT + '/', '')}:${i + 1}  ${line.trim().slice(0, 80)}`);
      });
    }
    expect(offenders, 'move schemas/constants to a plain module').toEqual([]);
  });
});
