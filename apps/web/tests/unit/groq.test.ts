import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { LanguageModelV3 } from '@ai-sdk/provider';

// Groq is a separate processor, so a task only uses it when asked to *and* a key
// exists; and whatever the chain, a failure must end at the Gateway model.

const log = vi.hoisted(() => ({ warn: vi.fn(), info: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/observability/logger', () => ({ logger: log }));

const KEYS = [
  'GROQ_API_KEY',
  'AI_PROVIDER',
  'AI_PROVIDER_BIO_COACH',
  'AI_PROVIDER_RESUME_PARSE',
  'AI_GROQ_MODELS_BIO_COACH',
] as const;
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

async function load() {
  vi.resetModules();
  return import('@/lib/ai/groq');
}

beforeEach(() => {
  for (const k of KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('provider selection', () => {
  it('is absent without a key', async () => {
    expect((await load()).groq()).toBeNull();
  });

  it('is not selected by the key alone, nor by the switch alone', async () => {
    process.env.GROQ_API_KEY = 'gsk_test';
    expect((await load()).groqEnabledFor('bio-coach')).toBe(false);
    delete process.env.GROQ_API_KEY;
    process.env.AI_PROVIDER = 'groq';
    expect((await load()).groqEnabledFor('bio-coach')).toBe(false);
  });

  it('is selected by a per-task switch or the blanket one, with a key', async () => {
    process.env.GROQ_API_KEY = 'gsk_test';
    process.env.AI_PROVIDER_BIO_COACH = 'groq';
    const m = await load();
    expect(m.groqEnabledFor('bio-coach')).toBe(true);
    expect(m.groqEnabledFor('resume-parse')).toBe(false);
    process.env.AI_PROVIDER = 'groq';
    expect((await load()).groqEnabledFor('resume-parse')).toBe(true);
  });

  it('a per-task switch overrides the blanket one', async () => {
    process.env.GROQ_API_KEY = 'gsk_test';
    process.env.AI_PROVIDER = 'groq';
    process.env.AI_PROVIDER_RESUME_PARSE = 'gateway';
    expect((await load()).groqEnabledFor('resume-parse')).toBe(false);
  });
});

describe('model chains', () => {
  it('give each task its own models, none of them the retired llama id', async () => {
    const m = await load();
    expect(m.groqModelIds('bio-coach')).toEqual(['openai/gpt-oss-120b', 'qwen/qwen3.8-27b']);
    expect(m.groqModelIds('skill-extraction')[0]).toBe('openai/gpt-oss-20b');
    for (const t of ['bio-coach', 'resume-parse', 'skill-extraction'] as const) {
      expect(m.groqModelIds(t).join()).not.toContain('llama-3.3-70b-versatile');
    }
  });

  it('can be overridden per task from the environment', async () => {
    process.env.AI_GROQ_MODELS_BIO_COACH = ' a/one , b/two ';
    expect((await load()).groqModelIds('bio-coach')).toEqual(['a/one', 'b/two']);
  });
});

function fake(id: string, behaviour: 'ok' | 'fail'): LanguageModelV3 {
  const call = vi.fn(async () => {
    if (behaviour === 'fail') throw new Error(`${id} down`);
    return { id } as never;
  });
  return {
    specificationVersion: 'v3',
    provider: 'test',
    modelId: id,
    supportedUrls: {},
    doGenerate: call,
    doStream: call,
  } as unknown as LanguageModelV3;
}

describe('withFallback', () => {
  it('uses the first model when it answers', async () => {
    const { withFallback } = await load();
    const a = fake('a', 'ok');
    const b = fake('b', 'ok');
    const r = await withFallback([a, b]).doGenerate({} as never);
    expect(r).toEqual({ id: 'a' });
    expect(b.doGenerate).not.toHaveBeenCalled();
  });

  it('falls through failing models to the first that answers — generate and stream', async () => {
    const { withFallback } = await load();
    const m = withFallback([fake('a', 'fail'), fake('b', 'fail'), fake('c', 'ok')]);
    expect(await m.doGenerate({} as never)).toEqual({ id: 'c' });
    expect(await m.doStream({} as never)).toEqual({ id: 'c' });
  });

  it('throws the last error when every model fails', async () => {
    const { withFallback } = await load();
    const m = withFallback([fake('a', 'fail'), fake('b', 'fail')]);
    await expect(m.doGenerate({} as never)).rejects.toThrow('b down');
  });

  it('does not retry an aborted request', async () => {
    const { withFallback } = await load();
    const ctrl = new AbortController();
    ctrl.abort();
    const b = fake('b', 'ok');
    const m = withFallback([fake('a', 'fail'), b]);
    await expect(m.doGenerate({ abortSignal: ctrl.signal } as never)).rejects.toThrow('a down');
    expect(b.doGenerate).not.toHaveBeenCalled();
  });

  it('names the whole chain', async () => {
    const { withFallback } = await load();
    expect(withFallback([fake('a', 'ok'), fake('b', 'ok')]).modelId).toBe('a > b');
  });
});

describe('logAiCall', () => {
  it('records the model that actually answered, token counts and duration — and no content', async () => {
    process.env.GROQ_API_KEY = 'gsk_test';
    process.env.AI_PROVIDER = 'groq';
    const { logAiCall } = await load();
    vi.spyOn(Date, 'now').mockReturnValue(1_500);
    logAiCall('bio-coach', {
      response: { modelId: 'qwen/qwen3.8-27b' },
      usage: { inputTokens: 90, outputTokens: 40 },
      finishReason: 'stop',
      startedAt: 1_000,
    });
    expect(log.info).toHaveBeenCalledWith(
      {
        task: 'bio-coach',
        model: 'qwen/qwen3.8-27b',
        viaGroq: true,
        inputTokens: 90,
        outputTokens: 40,
        finishReason: 'stop',
        ms: 500,
      },
      'ai call',
    );
    vi.restoreAllMocks();
  });

  it('says so when the provider reported no model', async () => {
    const { logAiCall } = await load();
    logAiCall('resume-parse', { startedAt: Date.now() });
    expect(log.info.mock.calls.at(-1)![0]).toMatchObject({ model: 'unknown', viaGroq: false });
  });
});
