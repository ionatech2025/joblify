import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

// Local/loopback runs use a placeholder Clerk publishable key whose decoded
// domain (clerk.example.com) doesn't exist. Clerk's dev-instance middleware
// answers browser document requests that lack a __client_uat cookie with a
// handshake redirect to that domain, which then fails DNS and surfaces as
// net::ERR_NAME_NOT_RESOLVED on every page.goto. Pre-seeding __client_uat=0
// ("signed out, already synced") skips the handshake. Loopback-only: preview
// runs against a real Clerk instance must keep real handshake behavior.
const loopbackTarget = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(baseURL);
const anonCookie = {
  domain: new URL(baseURL).hostname,
  path: '/',
  expires: -1,
  httpOnly: false,
  secure: false,
  sameSite: 'Lax' as const,
};
const anonClerkState = {
  // Mirrors what auth.setup.ts stores for signed-in users, with signed-out
  // values: __clerk_db_jwt presence skips the dev-browser handshake (the
  // middleware only checks presence), __client_uat=0 marks "signed out".
  cookies: [
    { ...anonCookie, name: '__clerk_db_jwt', value: 'dvb_e2e_anonymous' },
    { ...anonCookie, name: '__client_uat', value: '0' },
  ],
  origins: [],
};

// Authenticated specs need a Clerk dev instance. When creds are absent we omit
// the `setup` project and those specs skip — CI stays green without secrets.
const hasClerkCreds = Boolean(
  process.env.E2E_TEST_PASSWORD && process.env.E2E_TEST_EMAIL_JOBSEEKER,
);

const browserProjects = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
].map((p) => ({
  ...p,
  testIgnore: /auth\.setup\.ts/,
  ...(hasClerkCreds ? { dependencies: ['setup'] } : {}),
}));

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...(loopbackTarget ? { storageState: anonClerkState } : {}),
  },
  projects: [
    ...(hasClerkCreds ? [{ name: 'setup', testMatch: /auth\.setup\.ts/ }] : []),
    ...browserProjects,
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'bun run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
