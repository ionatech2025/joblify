import { clerkSetup } from '@clerk/testing/playwright';

/**
 * clerkSetup() fetches a testing token from Clerk's API, and that single request
 * is the first thing every authenticated run does: one dropped connection
 * ("fetch failed") fails the whole setup project and with it every authenticated
 * spec. Retried a few times with a pause; the final failure is the real one.
 */
export async function clerkSetupWithRetry(attempts = 5, delayMs = 4_000): Promise<void> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await clerkSetup();
      return;
    } catch (err) {
      last = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw last;
}
