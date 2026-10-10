import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { groqTasks, listTasks } from '@/lib/ai/groq-config';

// The processors list and the AI-use page must say what the environment really
// does: Groq appears (with its tasks) iff it is switched on, and the Gateway row
// never claims tasks Groq has taken.

const KEYS = [
  'GROQ_API_KEY',
  'AI_PROVIDER',
  'AI_PROVIDER_BIO_COACH',
  'AI_PROVIDER_RESUME_PARSE',
  'AI_PROVIDER_SKILL_EXTRACTION',
  'AI_GATEWAY_ZDR',
  'NEXT_PUBLIC_REGION_GROQ',
] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
beforeEach(() => {
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

async function html(page: 'processors' | 'ai'): Promise<string> {
  vi.resetModules();
  const mod =
    page === 'processors'
      ? await import('@/app/(marketing)/legal/processors/page')
      : await import('@/app/(marketing)/legal/ai/page');
  return renderToStaticMarkup(mod.default());
}

describe('groq-config', () => {
  it('lists only enabled tasks, and needs the key', () => {
    expect(groqTasks({ AI_PROVIDER: 'groq' })).toEqual([]);
    expect(groqTasks({ AI_PROVIDER: 'groq', GROQ_API_KEY: 'k' })).toEqual([
      'resume-parse',
      'skill-extraction',
      'bio-coach',
    ]);
    expect(
      groqTasks({ AI_PROVIDER_BIO_COACH: 'groq', GROQ_API_KEY: 'k', AI_PROVIDER: 'gateway' }),
    ).toEqual(['bio-coach']);
  });

  it('lets a per-task value opt out of the blanket switch', () => {
    expect(
      groqTasks({ AI_PROVIDER: 'groq', AI_PROVIDER_RESUME_PARSE: 'gateway', GROQ_API_KEY: 'k' }),
    ).toEqual(['skill-extraction', 'bio-coach']);
  });

  it('joins labels like prose', () => {
    expect(listTasks(['bio-coach'])).toBe('bio coach');
    expect(listTasks(['resume-parse', 'bio-coach'])).toBe('résumé reading and bio coach');
    expect(listTasks(['resume-parse', 'skill-extraction', 'bio-coach'])).toBe(
      'résumé reading, job skill extraction and bio coach',
    );
  });
});

describe('/legal/processors', () => {
  it('does not list Groq when nothing is routed to it', async () => {
    const out = await html('processors');
    expect(out).not.toContain('Groq');
    expect(out).toContain('AI model providers via Vercel AI Gateway');
  });

  it('does not list Groq on a key alone', async () => {
    process.env.GROQ_API_KEY = 'k';
    expect(await html('processors')).not.toContain('Groq');
  });

  it('lists Groq with exactly the tasks routed to it, and narrows the Gateway row', async () => {
    process.env.GROQ_API_KEY = 'k';
    process.env.AI_PROVIDER_RESUME_PARSE = 'groq';
    process.env.AI_PROVIDER_SKILL_EXTRACTION = 'groq';
    const out = await html('processors');
    expect(out).toContain('Groq');
    expect(out).toContain('résumé reading and job skill extraction');
    expect(out).not.toContain('bio coach, ');
    expect(out).toContain('fallback if a Groq model is unavailable');
    expect(out).toContain('Not yet published'); // region unset -> says so
  });

  it('publishes the Groq region only from configuration', async () => {
    process.env.GROQ_API_KEY = 'k';
    process.env.AI_PROVIDER = 'groq';
    process.env.NEXT_PUBLIC_REGION_GROQ = 'US';
    expect(await html('processors')).toContain('US');
  });
});

describe('/legal/ai', () => {
  it('describes the gateway only, when nothing is on Groq', async () => {
    const out = await html('ai');
    expect(out).not.toContain('Groq');
    expect(out).toContain('through a gateway operated by our hosting provider');
  });

  it('names Groq and its tasks, and says the ZDR setting does not cover it', async () => {
    process.env.GROQ_API_KEY = 'k';
    process.env.AI_PROVIDER = 'groq';
    process.env.AI_GATEWAY_ZDR = '1';
    const out = await html('ai');
    expect(out).toContain('sent directly to Groq');
    expect(out).toContain('résumé reading, job skill extraction and bio coach');
    expect(out).toContain('requests sent directly to Groq are not covered');
  });
});
