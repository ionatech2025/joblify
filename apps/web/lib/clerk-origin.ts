/**
 * Clerk's frontend API origin, decoded from the publishable key (which encodes
 * the host, base64, after the pk_test_/pk_live_ prefix). Derived rather than
 * hardcoded so it follows the dev -> production instance switch on its own.
 *
 * Used for connection hints. clerk-js is a render-blocking dependency of the
 * thing people came to /sign-up to use: the sign-up card cannot paint until a
 * script arrives from an origin the browser has otherwise never seen. A hint
 * moves DNS + TCP + TLS to the start of the document — but only pages that are
 * going to load Clerk should send one; elsewhere it is a connection opened for
 * nothing.
 */
export function clerkFrontendOrigin(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;
  try {
    const host = atob(key.replace(/^pk_(test|live)_/, '')).replace(/\$$/, '');
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : null;
  } catch {
    return null;
  }
}
