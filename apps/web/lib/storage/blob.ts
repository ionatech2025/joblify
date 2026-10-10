import { put, del, get, head } from '@vercel/blob';
import { DOCX_MIME, PDF_MIME } from '@/lib/resume/mime';

/**
 * File storage, split by sensitivity.
 *
 *   private store  BLOB_READ_WRITE_TOKEN (or OIDC + BLOB_STORE_ID)
 *                  Résumés and generated CVs — personal documents. Reads need
 *                  credentials, so a URL on its own opens nothing. Everything a
 *                  user can see of these goes through an authenticated route
 *                  (app/api/v1/resumes/[id]/file) that checks who is asking.
 *
 *   public store   BLOB_PUBLIC_READ_WRITE_TOKEN
 *                  Company logos only: they are shown to anonymous visitors on
 *                  public pages, which is exactly what a public store is for.
 *
 * A Vercel Blob store is either private or public at creation time, so these
 * are two stores. Résumés, CVs and GDPR exports used to be written with
 * `access: 'public'` — a permanent, unauthenticated, un-revocable URL for
 * every candidate's personal data.
 */

export const RESUME_MIME = [PDF_MIME, DOCX_MIME] as const;
export type ResumeMime = (typeof RESUME_MIME)[number];

export const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;

// JOB_UC_08.1 Test 92: 5MB resume limit
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
/** Bounds storage a single account can consume. */
export const MAX_ACTIVE_RESUMES = 10;

export function resumePathPrefix(userId: string): string {
  return `resumes/${userId}/`;
}

export function logoPathPrefix(companyId: string): string {
  return `logos/${companyId}/`;
}

export type StoreKind = 'private' | 'public';

export function storeToken(kind: StoreKind): string | undefined {
  return kind === 'private'
    ? process.env.BLOB_READ_WRITE_TOKEN || undefined
    : process.env.BLOB_PUBLIC_READ_WRITE_TOKEN || undefined;
}

/** Whether this store can be reached at all (token, or OIDC for the private one). */
export function storeConfigured(kind: StoreKind): boolean {
  if (storeToken(kind)) return true;
  return kind === 'private' && Boolean(process.env.BLOB_STORE_ID);
}

/** `vercel_blob_rw_<storeId>_<secret>` → `<storeid>` (lower-cased, as in hostnames). */
export function storeIdFromToken(token: string | undefined): string | null {
  const m = /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(token ?? '');
  return m ? m[1]!.toLowerCase() : null;
}

function storeId(kind: StoreKind): string | null {
  if (kind === 'private' && process.env.BLOB_STORE_ID) {
    return process.env.BLOB_STORE_ID.replace(/^store_/i, '').toLowerCase();
  }
  return storeIdFromToken(storeToken(kind));
}

/**
 * The pathname of a URL that belongs to OUR store of the given kind, or null.
 *
 * The host is pinned: a URL on any other host — including another Vercel Blob
 * store, which an attacker can create for free — is not ours. (The previous
 * check looked only at the path prefix, so
 * `https://attacker.example/resumes/<my-id>/cv.pdf` was accepted, stored, and
 * later fetched server-side.)
 */
export function pathnameInStore(url: string, kind: StoreKind): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;

  const suffix = `.${kind}.blob.vercel-storage.com`;
  const host = u.hostname.toLowerCase();
  if (!host.endsWith(suffix)) return null;
  const id = storeId(kind);
  // When the store id is known the match is exact; otherwise (OIDC without
  // BLOB_STORE_ID) the suffix check above still excludes every non-Blob host,
  // and the existence lookup below (head via OUR credentials) rejects objects
  // that live in someone else's store.
  if (id && host !== `${id}${suffix}`) return null;

  let pathname: string;
  try {
    pathname = decodeURIComponent(u.pathname).replace(/^\/+/, '');
  } catch {
    return null;
  }
  if (!pathname || pathname.split('/').some((seg) => seg === '..' || seg === '.')) return null;
  return pathname;
}

/**
 * A logo URL that is safe to persist and later render / embed in markup.
 *
 * Accepts only (a) the value already stored, (b) an object in OUR public store
 * under this company's own prefix, or (c) in non-production, an inline image.
 * Anything else — a URL the company typed into a form field — returns null.
 * Logos used to be accepted as free-form URLs by the profile actions, which
 * put an arbitrary host into JSON-LD, the search index and the OG-image
 * renderer (which fetches it server-side).
 */
export function trustedLogoUrl(
  url: string | null | undefined,
  companyId: string,
  current?: string | null,
): string | null {
  if (!url) return null;
  if (current && url === current) return current;
  const pathname = pathnameInStore(url, 'public');
  if (pathname && pathname.startsWith(logoPathPrefix(companyId))) return url;
  if (process.env.NODE_ENV !== 'production' && /^data:image\/(png|jpeg|webp);base64,/.test(url)) {
    return url;
  }
  return null;
}

export type StoredBlob = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};

/**
 * Confirm that `url` is an object that really exists in our `kind` store under
 * `requiredPrefix`, and return the STORE'S own description of it. Callers must
 * persist these values — never the client-supplied URL, content type or size.
 */
export async function verifyStoredBlob(
  url: string,
  kind: StoreKind,
  requiredPrefix: string,
): Promise<StoredBlob | null> {
  const pathname = pathnameInStore(url, kind);
  if (!pathname || !pathname.startsWith(requiredPrefix)) return null;
  try {
    const meta = await head(pathname, { token: storeToken(kind) });
    return {
      url: meta.url,
      pathname: meta.pathname,
      contentType: meta.contentType,
      size: meta.size,
    };
  } catch {
    return null;
  }
}

export class BlobReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlobReadError';
  }
}

/**
 * Read a stored résumé's bytes.
 *
 * The locator in the database is resolved to a pathname and read THROUGH the
 * SDK with our credentials — it is never passed to `fetch()`, so a row can
 * never turn this into a request to an arbitrary host. `data:` locators exist
 * only for local development without a Blob store and are refused in
 * production.
 */
export async function readBlobBytes(
  locator: string,
  { maxBytes }: { maxBytes: number },
): Promise<Uint8Array> {
  if (locator.startsWith('data:')) {
    if (process.env.NODE_ENV === 'production') {
      throw new BlobReadError('Inline data locators are not readable in production');
    }
    const comma = locator.indexOf(',');
    const base64 = locator.slice(0, comma).endsWith(';base64');
    const payload = locator.slice(comma + 1);
    const buf = base64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload));
    if (buf.byteLength > maxBytes) throw new BlobReadError('Stored file exceeds the size limit');
    return new Uint8Array(buf);
  }

  const pathname = pathnameInStore(locator, 'private');
  if (!pathname) throw new BlobReadError('Stored locator is not in the private store');

  const result = await get(pathname, { access: 'private', token: storeToken('private') });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new BlobReadError('Stored file could not be read');
  }
  return collect(result.stream, maxBytes);
}

/** Stream a stored file to the caller, capped, for the download route. */
export async function openBlobStream(
  locator: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  const pathname = pathnameInStore(locator, 'private');
  if (!pathname) return null;
  const result = await get(pathname, { access: 'private', token: storeToken('private') });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return { stream: result.stream, contentType: result.blob.contentType };
}

async function collect(stream: ReadableStream<Uint8Array>, maxBytes: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new BlobReadError('Stored file exceeds the size limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/** Write a file with an unguessable suffix. Private or public store by `kind`. */
export async function putStored(
  kind: StoreKind,
  pathname: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ url: string; pathname: string }> {
  const blob = await put(pathname, body as Buffer, {
    access: kind,
    token: storeToken(kind),
    contentType,
    addRandomSuffix: true,
  });
  return { url: blob.url, pathname: blob.pathname };
}

export type DeleteOutcome = 'deleted' | 'skipped' | 'failed';

/**
 * Delete a stored object by its locator. Never throws.
 *
 *   'deleted' — the store accepted the delete (it is also idempotent);
 *   'skipped' — the locator is not in our `kind` store (a `data:` URL, a
 *               foreign host, a legacy URL): there is nothing for us to remove;
 *   'failed'  — the store errored; the caller should retry later.
 *
 * Erasure code uses the distinction: a user row is only hard-deleted once none
 * of its files 'failed', so a transient store error leaves the record (and the
 * retry) in place instead of orphaning the file.
 */
export async function deleteStored(locator: string, kind: StoreKind): Promise<DeleteOutcome> {
  const pathname = pathnameInStore(locator, kind);
  if (!pathname) return 'skipped';
  try {
    await del(pathname, { token: storeToken(kind) });
    return 'deleted';
  } catch {
    return 'failed';
  }
}
