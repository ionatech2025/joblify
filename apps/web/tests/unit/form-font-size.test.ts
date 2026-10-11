import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// iOS Safari zooms the page when a focused text field's font is under 16px and
// does not zoom back out. ui/form.tsx's controls carry the fix; this catches the
// hand-rolled <input> that does not (the console search box and the command
// palette were both 13-14px on phones until the 2026-10-11 company-console
// audit). A raw text input with a small fixed size must also say what it is on
// touch / narrow screens.

const ROOT = join(__dirname, '..', '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

// Inputs that do not take text: no keyboard, no zoom.
const NON_TEXT = /type="(hidden|checkbox|radio|file|range|color|submit|button)"/;

describe('hand-rolled text inputs', () => {
  const offenders: string[] = [];
  for (const file of walk(join(ROOT, 'app'))) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel === 'app/components/ui/form.tsx') continue; // the primitive owns its own rule
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/<input\b[\s\S]*?\/>/g)) {
      const tag = m[0];
      if (NON_TEXT.test(tag) || /sr-only|className="hidden"/.test(tag)) continue;
      const small = /\btext-(xs|sm|\[1[0-5]px\])\b/.test(tag);
      const fixed = /pointer-coarse:text-base|max-sm:text-base|text-base/.test(tag);
      if (small && !fixed) offenders.push(`${rel}: ${tag.replace(/\s+/g, ' ').slice(0, 90)}…`);
    }
  }

  it('give a phone a 16px field, or use the ui/form primitives', () => {
    expect(offenders).toEqual([]);
  });
});
