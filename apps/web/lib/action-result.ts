/**
 * The result contract every Server Action uses for *expected* failures.
 *
 * Why this exists: React does not forward a thrown error's message to the
 * client in a production build. It replaces it, verbatim, with
 *
 *   "An error occurred in the Server Components render. The specific message
 *    is omitted in production builds to avoid leaking sensitive details. A
 *    digest property is included on this error instance which may provide
 *    additional details about the nature of the error."
 *
 * Twenty-two carefully-worded failure messages — "Daily application limit
 * reached. Try again tomorrow.", "You already applied to this job." — were
 * being thrown, caught in a client component as `err.message`, and rendered
 * into a toast. In production every one of them showed that paragraph instead.
 *
 * It never appeared in review because dev builds do not redact, and never
 * failed a test because unit tests call the action directly and see the real
 * string.
 *
 * The rule, which app/actions/chat.ts already stated and followed:
 *
 *   Expected failures (rate limit, validation, "already applied", a plan gate)
 *   RETURN a result. Unexpected ones (auth, DB, programmer error) still THROW,
 *   because those belong to error.tsx and Sentry, not to a toast.
 *
 * AuthError and its kin are deliberately still thrown.
 */

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

/** Success. `succeed()` for actions whose success carries no value. */
export function succeed(): ActionResult;
export function succeed<T>(data: T): ActionResult<T>;
export function succeed<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

/** An expected failure, with the message the user should actually read. */
export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * Client-side unwrap for the common case: a call site that already sits in a
 * try/catch and wants an expected failure to reach the same handler as an
 * unexpected one. Throws on the client, where messages are not redacted, so
 * the existing `err instanceof Error ? err.message : …` handlers keep working
 * and now show the real text.
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
