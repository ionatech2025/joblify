import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import { STORAGE } from './storage-paths';

// Produces signed-in storage states for authenticated.spec.ts. This file runs
// only when the `setup` project is enabled — i.e. Clerk dev creds are present
// (see playwright.config.ts). Clerk's testing token lets the dev instance accept
// a password sign-in even when production requires MFA.
setup('authenticate test users', async ({ browser }) => {
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
    await page.goto('/');
    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: role.email, password },
    });
    await page.goto(role.landing);
    await page.context().storageState({ path: role.file });
    await page.close();
  }
});
