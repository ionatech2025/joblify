import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// lib/observability/sentry-client.ts keeps the Sentry SDK out of the bundle
// every route downloads. What must hold: with no DSN nothing is ever loaded
// (and the import is unreachable, so the bundler drops it); with a DSN the SDK
// is loaded and initialised exactly once however many callers ask, telemetry
// that arrives early waits for it, and a chunk that fails to load never throws
// into the page.

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setMeasurement: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sdk);

const DSN = 'https://public@o0.ingest.sentry.io/1';

async function freshModule(dsn: string | undefined) {
  vi.resetModules();
  if (dsn === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  else process.env.NEXT_PUBLIC_SENTRY_DSN = dsn;
  return import('@/lib/observability/sentry-client');
}

const original = process.env.NEXT_PUBLIC_SENTRY_DSN;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  else process.env.NEXT_PUBLIC_SENTRY_DSN = original;
});

describe('without a DSN', () => {
  it('is disabled and never loads the SDK', async () => {
    const m = await freshModule(undefined);
    expect(m.SENTRY_ENABLED).toBe(false);
    await expect(m.loadSentry()).resolves.toBeNull();
    expect(sdk.init).not.toHaveBeenCalled();
    expect(m.loadedSentry()).toBeNull();
  });

  it('ignores telemetry and error reports without throwing', async () => {
    const m = await freshModule(undefined);
    const callback = vi.fn();
    m.withSentry(callback);
    m.reportClientError(new Error('boom'));
    await Promise.resolve();
    expect(callback).not.toHaveBeenCalled();
    expect(sdk.captureException).not.toHaveBeenCalled();
  });
});

describe('with a DSN', () => {
  it('loads and initialises the SDK once, for every concurrent caller', async () => {
    const m = await freshModule(DSN);
    expect(m.SENTRY_ENABLED).toBe(true);
    const [a, b, c] = await Promise.all([m.loadSentry(), m.loadSentry(), m.loadSentry()]);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(sdk.init).toHaveBeenCalledTimes(1);
    expect(sdk.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: DSN,
        // Replay only ever records around an error; nothing is recorded by default.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
      }),
    );
    expect(m.loadedSentry()).toBe(a);
  });

  it('holds telemetry until the SDK is up, then flushes it in order', async () => {
    const m = await freshModule(DSN);
    const seen: string[] = [];
    m.withSentry(() => seen.push('first'));
    m.withSentry(() => seen.push('second'));
    expect(seen).toEqual([]); // queueing is not a reason to load the SDK
    expect(sdk.init).not.toHaveBeenCalled();

    await m.loadSentry();
    expect(seen).toEqual(['first', 'second']);

    m.withSentry(() => seen.push('after'));
    expect(seen).toEqual(['first', 'second', 'after']); // runs immediately once loaded
  });

  it('bounds the queue so telemetry cannot grow without limit while the SDK loads', async () => {
    const m = await freshModule(DSN);
    const callback = vi.fn();
    for (let i = 0; i < 500; i++) m.withSentry(callback);
    await m.loadSentry();
    expect(callback).toHaveBeenCalledTimes(50);
  });

  it('an error report is a reason to load the SDK, and is captured once it is up', async () => {
    const m = await freshModule(DSN);
    const error = new Error('render failed');
    m.reportClientError(error);
    await vi.waitFor(() => expect(sdk.captureException).toHaveBeenCalledWith(error));
    expect(sdk.init).toHaveBeenCalledTimes(1);
  });

  it('resolves to null, not a rejection, when the chunk fails to load', async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
    vi.doMock('@sentry/nextjs', () => {
      throw new Error('ChunkLoadError');
    });
    const m = await import('@/lib/observability/sentry-client');
    await expect(m.loadSentry()).resolves.toBeNull();
    expect(() => m.reportClientError(new Error('x'))).not.toThrow();
    vi.doUnmock('@sentry/nextjs');
  });
});
