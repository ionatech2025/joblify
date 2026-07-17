import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import { STORAGE } from './storage-paths';
import { ensureE2eFixtures } from './fixtures';

// Produces signed-in storage states for authenticated.spec.ts. This file runs
// only when the `setup` project is enabled — i.e. Clerk dev creds are present
// (see playwright.config.ts). The dev instance requires an emailed second factor
// on password sign-in; the E2E users use `+clerk_test` addresses, for which
// Clerk accepts its fixed development code (424242), so we can drive the full
// password → email-code flow headlessly (clerk.signIn only does one factor).
setup('authenticate test users', async ({ browser }) => {
  // clerkSetup() + two live two-factor sign-ins run over the network and reliably
  // exceed Playwright's default 30s per-test budget; give the setup real headroom.
  setup.setTimeout(120_000);
  await clerkSetup();
  const password = process.env.E2E_TEST_PASSWORD;
  if (!password) return;

  const roles = [
    { email: process.env.E2E_TEST_EMAIL_JOBSEEKER, landing: '/jobseeker/applications', file: STORAGE.jobseeker },
    { email: process.env.E2E_TEST_EMAIL_COMPANY, landing: '/company/jobs', file: STORAGE.company },
  ];

  for (const role of roles) {
    if (!role.email) continue;
    const page = await browser.newPage();
    // Inject Clerk's testing token so the dev-instance bot check lets the sign-in
    // handshake through (without it the landing nav bounces back to /sign-in).
    await setupClerkTestingToken({ page });
    await page.goto('/');
    await page.waitForFunction(() => (window as unknown as ClerkWindow).Clerk?.loaded === true, {
      timeout: 30_000,
    });
    await page.evaluate(
      async ({ identifier, password }) => {
        const { Clerk } = window as unknown as ClerkWindow;
        const signIn = await Clerk.client.signIn.create({ strategy: 'password', identifier, password });
        if (signIn.status === 'needs_second_factor') {
          const emailFactor = signIn.supportedSecondFactors.find((f) => f.strategy === 'email_code');
          if (!emailFactor) throw new Error('email_code second factor not offered');
          await signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: emailFactor.emailAddressId });
          const done = await signIn.attemptSecondFactor({ strategy: 'email_code', code: '424242' });
          await Clerk.setActive({ session: done.createdSessionId });
        } else if (signIn.status === 'complete') {
          await Clerk.setActive({ session: signIn.createdSessionId });
        } else {
          throw new Error(`unexpected sign-in status: ${signIn.status}`);
        }
      },
      { identifier: role.email, password },
    );
    await page.goto(role.landing);
    await page.context().storageState({ path: role.file });
    await page.close();
  }

  // Both accounts now have a mirrored User row (the landing-page nav above
  // triggered lazy Clerk->Postgres provisioning) — safe to provision the
  // cross-account fixtures workflows.spec.ts depends on.
  if (process.env.E2E_TEST_EMAIL_JOBSEEKER && process.env.E2E_TEST_EMAIL_COMPANY) {
    await ensureE2eFixtures(process.env.E2E_TEST_EMAIL_JOBSEEKER, process.env.E2E_TEST_EMAIL_COMPANY);
  }
});

// Minimal shape of the Clerk client we touch in-browser (window.Clerk is injected
// by ClerkProvider at runtime, so it isn't in the DOM lib types).
interface ClerkWindow {
  Clerk: {
    loaded: boolean;
    client: { signIn: ClerkSignInResource };
    setActive(opts: { session: string | null }): Promise<void>;
  };
}
interface ClerkSignInResource {
  status: string;
  createdSessionId: string | null;
  supportedSecondFactors: { strategy: string; emailAddressId: string }[];
  create(params: { strategy: 'password'; identifier: string; password: string }): Promise<ClerkSignInResource>;
  prepareSecondFactor(params: { strategy: 'email_code'; emailAddressId: string }): Promise<ClerkSignInResource>;
  attemptSecondFactor(params: { strategy: 'email_code'; code: string }): Promise<ClerkSignInResource>;
}
