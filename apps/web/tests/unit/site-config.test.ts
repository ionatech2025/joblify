import { describe, it, expect } from 'vitest';
import { configWarnings, isPlaceholderAddress } from '@/lib/site-config';

const ok = {
  NEXT_PUBLIC_PRIVACY_EMAIL: 'privacy@joblify.com',
  NEXT_PUBLIC_ACCESSIBILITY_EMAIL: 'a11y@joblify.com',
  EMAIL_UNSUBSCRIBE_SECRET: 's',
  NEXT_PUBLIC_SITE_URL: 'https://joblify.com',
  EMAIL_POSTAL_ADDRESS: '1 Main St, Kampala',
  ALGOLIA_APP_ID: 'app',
  ALGOLIA_SEARCH_API_KEY: 'search-only',
  BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_x_y',
  BLOB_PUBLIC_READ_WRITE_TOKEN: 'vercel_blob_rw_z_y',
} as unknown as NodeJS.ProcessEnv;

describe('configWarnings', () => {
  it('is silent for a fully configured deployment', () => {
    expect(configWarnings(ok)).toEqual([]);
  });

  it('flags every promise a deployment cannot currently keep', () => {
    const w = configWarnings({} as NodeJS.ProcessEnv).join('\n');
    expect(w).toMatch(/PRIVACY_EMAIL/);
    expect(w).toMatch(/ACCESSIBILITY_EMAIL/);
    expect(w).toMatch(/unsubscribe/);
    expect(w).toMatch(/postal address/);
    expect(w).toMatch(/private Blob store/);
    expect(w).toMatch(/BLOB_PUBLIC_READ_WRITE_TOKEN/);
  });

  it('warns that search is on the admin key only once Algolia is in use', () => {
    expect(
      configWarnings({ ...ok, ALGOLIA_SEARCH_API_KEY: '' } as NodeJS.ProcessEnv).join(),
    ).toMatch(/admin key/);
    const noAlgolia = {
      ...ok,
      ALGOLIA_APP_ID: '',
      ALGOLIA_SEARCH_API_KEY: '',
    } as NodeJS.ProcessEnv;
    expect(configWarnings(noAlgolia).join()).not.toMatch(/admin key/);
  });

  it('recognises the reserved placeholder TLD', () => {
    expect(isPlaceholderAddress('privacy@joblify.example')).toBe(true);
    expect(isPlaceholderAddress('privacy@joblify.com')).toBe(false);
  });
});
