import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The real storage module with only the Vercel Blob SDK stubbed. This is the
// code that decides whether a URL a client sent is "ours" — the SSRF/arbitrary-
// URL boundary — so it is tested directly rather than behind a mock.

const sdk = vi.hoisted(() => ({
  put: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
}));
vi.mock('@vercel/blob', () => sdk);

import {
  pathnameInStore,
  verifyStoredBlob,
  trustedLogoUrl,
  readBlobBytes,
  deleteStored,
  storeIdFromToken,
  storeConfigured,
} from '@/lib/storage/blob';

// Shaped like a Vercel Blob token (vercel_blob_rw_<storeId>_<secret>) but
// assembled from parts: a whole token-looking literal is what secret scanners
// match on, and these are fixtures, not credentials.
const fixtureToken = (storeId: string) => ['vercel_blob_rw', storeId, 'x'.repeat(24)].join('_');
const PRIVATE_TOKEN = fixtureToken('AbC123xyz');
const PUBLIC_TOKEN = fixtureToken('PubStore9');

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', PRIVATE_TOKEN);
  vi.stubEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', PUBLIC_TOKEN);
  vi.stubEnv('BLOB_STORE_ID', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('storeIdFromToken', () => {
  it('extracts the (lower-cased) store id', () => {
    expect(storeIdFromToken(PRIVATE_TOKEN)).toBe('abc123xyz');
  });
  it('is null for anything else', () => {
    expect(storeIdFromToken(undefined)).toBeNull();
    expect(storeIdFromToken('not-a-token')).toBeNull();
  });
});

describe('pathnameInStore — the host is pinned, not just the path', () => {
  const ok = 'https://abc123xyz.private.blob.vercel-storage.com/resumes/u1/cv.pdf';

  it('accepts a URL in our private store', () => {
    expect(pathnameInStore(ok, 'private')).toBe('resumes/u1/cv.pdf');
  });

  it('rejects the same path on any other host', () => {
    for (const url of [
      'https://attacker.example/resumes/u1/cv.pdf',
      'https://abc123xyz.private.blob.vercel-storage.com.attacker.example/resumes/u1/cv.pdf',
      'https://evil.private.blob.vercel-storage.com/resumes/u1/cv.pdf', // someone else's Blob store
      'https://abc123xyz.public.blob.vercel-storage.com/resumes/u1/cv.pdf', // right id, wrong kind
      'http://abc123xyz.private.blob.vercel-storage.com/resumes/u1/cv.pdf', // not https
      'https://user:pw@abc123xyz.private.blob.vercel-storage.com/resumes/u1/cv.pdf',
      'https://abc123xyz.private.blob.vercel-storage.com:8443/resumes/u1/cv.pdf',
      'data:application/pdf;base64,JVBERi0xLjQK',
      'javascript:alert(1)',
      'not a url',
    ]) {
      expect(pathnameInStore(url, 'private'), url).toBeNull();
    }
  });

  it('cannot be walked out of the caller’s prefix with dot segments', async () => {
    // WHATWG URL resolves "../" (and %2e%2e) BEFORE we see the path, so the
    // prefix check below runs on the resolved path — which is the whole point.
    const traversal = [
      'https://abc123xyz.private.blob.vercel-storage.com/resumes/u1/../u2/cv.pdf',
      'https://abc123xyz.private.blob.vercel-storage.com/resumes/u1/%2e%2e/u2/cv.pdf',
    ];
    for (const url of traversal) {
      expect(pathnameInStore(url, 'private'), url).toBe('resumes/u2/cv.pdf');
      expect(await verifyStoredBlob(url, 'private', 'resumes/u1/'), url).toBeNull();
    }
    expect(sdk.head).not.toHaveBeenCalled();
  });

  it('with OIDC (no token) pins the suffix and the BLOB_STORE_ID', () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    vi.stubEnv('BLOB_STORE_ID', 'store_Abc123xyz');
    expect(pathnameInStore(ok, 'private')).toBe('resumes/u1/cv.pdf');
    expect(
      pathnameInStore('https://other.private.blob.vercel-storage.com/resumes/u1/cv.pdf', 'private'),
    ).toBeNull();
  });
});

describe('verifyStoredBlob', () => {
  const url = 'https://abc123xyz.private.blob.vercel-storage.com/resumes/u1/cv-9f.pdf';

  it('returns the STORE’s description of the object', async () => {
    sdk.head.mockResolvedValue({
      url,
      pathname: 'resumes/u1/cv-9f.pdf',
      contentType: 'application/pdf',
      size: 42,
    });
    const r = await verifyStoredBlob(url, 'private', 'resumes/u1/');
    expect(r).toEqual({
      url,
      pathname: 'resumes/u1/cv-9f.pdf',
      contentType: 'application/pdf',
      size: 42,
    });
    expect(sdk.head).toHaveBeenCalledWith('resumes/u1/cv-9f.pdf', { token: PRIVATE_TOKEN });
  });

  it('is null — without asking the store — when the host or prefix is wrong', async () => {
    expect(
      await verifyStoredBlob(
        'https://attacker.example/resumes/u1/cv.pdf',
        'private',
        'resumes/u1/',
      ),
    ).toBeNull();
    expect(await verifyStoredBlob(url, 'private', 'resumes/someone-else/')).toBeNull();
    expect(sdk.head).not.toHaveBeenCalled();
  });

  it('is null when the object does not exist in our store', async () => {
    sdk.head.mockRejectedValue(new Error('BlobNotFoundError'));
    expect(await verifyStoredBlob(url, 'private', 'resumes/u1/')).toBeNull();
  });
});

describe('trustedLogoUrl', () => {
  const logo = 'https://pubstore9.public.blob.vercel-storage.com/logos/c1/logo-ab.png';

  it('accepts only an object in our public store under the company’s own prefix', () => {
    expect(trustedLogoUrl(logo, 'c1')).toBe(logo);
    expect(trustedLogoUrl(logo, 'c2')).toBeNull(); // someone else's prefix
    expect(trustedLogoUrl('https://tracker.example/pixel.png', 'c1')).toBeNull();
    expect(trustedLogoUrl('javascript:alert(1)', 'c1')).toBeNull();
    expect(trustedLogoUrl('', 'c1')).toBeNull();
  });

  it('lets an already-stored value through unchanged', () => {
    expect(
      trustedLogoUrl('https://legacy.example/old.png', 'c1', 'https://legacy.example/old.png'),
    ).toBe('https://legacy.example/old.png');
  });
});

describe('readBlobBytes', () => {
  const url = 'https://abc123xyz.private.blob.vercel-storage.com/resumes/u1/cv.pdf';

  function streamOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(c) {
        for (const ch of chunks) c.enqueue(ch);
        c.close();
      },
    });
  }

  it('reads through the SDK with our credentials — never fetch()', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    sdk.get.mockResolvedValue({
      statusCode: 200,
      stream: streamOf(new Uint8Array([1, 2]), new Uint8Array([3])),
      blob: { contentType: 'application/pdf' },
    });
    const bytes = await readBlobBytes(url, { maxBytes: 100 });
    expect([...bytes]).toEqual([1, 2, 3]);
    expect(sdk.get).toHaveBeenCalledWith('resumes/u1/cv.pdf', {
      access: 'private',
      token: PRIVATE_TOKEN,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('refuses a locator that is not in our store, without any network call', async () => {
    await expect(
      readBlobBytes('https://attacker.example/resumes/u1/cv.pdf', { maxBytes: 100 }),
    ).rejects.toThrow(/not in the private store/);
    expect(sdk.get).not.toHaveBeenCalled();
  });

  it('stops reading once the byte budget is exceeded', async () => {
    sdk.get.mockResolvedValue({
      statusCode: 200,
      stream: streamOf(new Uint8Array(60), new Uint8Array(60)),
      blob: { contentType: 'application/pdf' },
    });
    await expect(readBlobBytes(url, { maxBytes: 100 })).rejects.toThrow(/size limit/);
  });

  it('refuses data: locators in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(
      readBlobBytes('data:application/pdf;base64,JVBERi0xLjQK', { maxBytes: 100 }),
    ).rejects.toThrow(/production/);
  });

  it('decodes data: locators in development only', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const bytes = await readBlobBytes('data:application/pdf;base64,JVBERi0xLjQK', {
      maxBytes: 100,
    });
    expect(new TextDecoder().decode(bytes)).toBe('%PDF-1.4\n');
  });
});

describe('deleteStored', () => {
  const url = 'https://abc123xyz.private.blob.vercel-storage.com/resumes/u1/cv.pdf';

  it('distinguishes deleted / skipped (not ours) / failed (retry later)', async () => {
    sdk.del.mockResolvedValueOnce(undefined);
    expect(await deleteStored(url, 'private')).toBe('deleted');
    expect(await deleteStored('data:application/pdf;base64,AA==', 'private')).toBe('skipped');
    expect(await deleteStored('https://legacy.example/x.pdf', 'private')).toBe('skipped');
    sdk.del.mockRejectedValueOnce(new Error('503'));
    expect(await deleteStored(url, 'private')).toBe('failed');
  });
});

describe('storeConfigured', () => {
  it('is true with a token, or for the private store under OIDC', () => {
    expect(storeConfigured('private')).toBe(true);
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    vi.stubEnv('BLOB_PUBLIC_READ_WRITE_TOKEN', '');
    expect(storeConfigured('private')).toBe(false);
    vi.stubEnv('BLOB_STORE_ID', 'store_x');
    expect(storeConfigured('private')).toBe(true);
    expect(storeConfigured('public')).toBe(false); // logos need an explicit public token
  });
});
