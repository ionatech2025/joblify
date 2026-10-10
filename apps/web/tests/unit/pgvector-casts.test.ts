import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// pgvector registers exactly one vector -> array cast: `real[]`. Casting an
// embedding to `float8[]` / `double precision[]` is a runtime SQL error
// (42846), which mocks cannot see: match scoring and job embedding never ran
// in production because of it, and the callers' try/catch hid the failure.

const ROOT = join(__dirname, '..', '..');

function sources(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'coverage', 'migrations'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) sources(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe('pgvector SQL', () => {
  const files = ['app', 'lib', 'workflows', 'prisma', 'scripts'].flatMap((d) =>
    sources(join(ROOT, d)),
  );

  it('scans the places raw SQL lives (guards the scan itself)', () => {
    expect(files.some((f) => f.endsWith('match-score.workflow.ts'))).toBe(true);
  });

  it('never casts a vector to float8[] / double precision[]', () => {
    const bad: string[] = [];
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          // Comments may quote the bad cast while explaining it.
          if (/^\s*(\/\/|\*|\/\*|--)/.test(line)) return;
          if (/embedding\s*::\s*(float8|double\s+precision)\s*\[\]/i.test(line)) {
            bad.push(`${file.replace(ROOT + '/', '')}:${i + 1}  ${line.trim().slice(0, 90)}`);
          }
        });
    }
    expect(bad, 'use ::real[] — it is the only vector -> array cast pgvector defines').toEqual([]);
  });
});
