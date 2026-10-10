/**
 * Contact points that appear in legal pages and are promised to users.
 *
 * They are configuration, not copy: the pages used to hard-code
 * `privacy@joblify.example` — an address on a reserved, non-routable TLD — so a
 * data subject following the privacy policy had nobody to write to. Set these
 * in the environment for each deployment; the placeholders remain only so a
 * local build renders, and `configWarnings()` flags them loudly in production.
 */
const PLACEHOLDER_DOMAIN = 'joblify.example';

export const CONTACTS = {
  privacy: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || `privacy@${PLACEHOLDER_DOMAIN}`,
  accessibility:
    process.env.NEXT_PUBLIC_ACCESSIBILITY_EMAIL || `accessibility@${PLACEHOLDER_DOMAIN}`,
  legal: process.env.NEXT_PUBLIC_LEGAL_EMAIL || `legal@${PLACEHOLDER_DOMAIN}`,
} as const;

/** The controller named in the privacy policy (legal entity, as registered). */
export const CONTROLLER = {
  name: process.env.NEXT_PUBLIC_CONTROLLER_NAME || 'Joblify',
  address: process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS || null,
} as const;

export function isPlaceholderAddress(email: string): boolean {
  return email.toLowerCase().endsWith('.example');
}

/**
 * Deployment configuration that is not fatal but means a promise made to users
 * cannot be kept. Returned as messages so callers decide how loudly to say it.
 */
export function configWarnings(env: NodeJS.ProcessEnv = process.env): string[] {
  const out: string[] = [];
  if (!env.NEXT_PUBLIC_PRIVACY_EMAIL) {
    out.push(
      'NEXT_PUBLIC_PRIVACY_EMAIL is unset: the privacy policy points data subjects at a non-routable placeholder address.',
    );
  }
  if (!env.NEXT_PUBLIC_ACCESSIBILITY_EMAIL) {
    out.push(
      'NEXT_PUBLIC_ACCESSIBILITY_EMAIL is unset: the accessibility statement has no working contact.',
    );
  }
  if (!(env.EMAIL_UNSUBSCRIBE_SECRET || env.CRON_SECRET) || !env.NEXT_PUBLIC_SITE_URL) {
    out.push(
      'EMAIL_UNSUBSCRIBE_SECRET (or CRON_SECRET) and NEXT_PUBLIC_SITE_URL are required for the jobs digest to send: every digest must carry a working unsubscribe link.',
    );
  }
  if (!env.EMAIL_POSTAL_ADDRESS) {
    out.push(
      'EMAIL_POSTAL_ADDRESS is unset: commercial email needs a physical postal address (CAN-SPAM).',
    );
  }
  if (!env.ALGOLIA_SEARCH_API_KEY && env.ALGOLIA_APP_ID) {
    out.push(
      'ALGOLIA_SEARCH_API_KEY is unset: the public search route is using the admin key, which can write and delete the index.',
    );
  }
  if (!env.BLOB_READ_WRITE_TOKEN && !env.BLOB_STORE_ID) {
    out.push('No private Blob store is configured: résumé uploads are disabled in production.');
  }
  if (!env.BLOB_PUBLIC_READ_WRITE_TOKEN) {
    out.push(
      'BLOB_PUBLIC_READ_WRITE_TOKEN is unset: company logo uploads are disabled in production.',
    );
  }
  return out;
}
