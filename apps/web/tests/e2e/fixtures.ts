import { db } from '@/lib/db';

// Deterministic cross-account state the authenticated e2e specs need but can't
// (or shouldn't) create through the UI on every run: a shared chat area between
// the two Clerk test accounts, a resume, an application, and an invitation.
// Runs once from auth.setup.ts after both test users have signed in (so their
// User rows already exist via the lazy Clerk->Postgres provisioner). Idempotent
// — safe to re-run — and resets the invitation/application/notification state
// each run so tests that mutate them (accept, change status, mark read) are
// repeatable regardless of the previous run's outcome.

const FIXTURE_JOB_SLUG = 'e2e-fixture-support-engineer';
const FIXTURE_RESUME_ID = 'e2e00000-0000-4000-8000-000000000001';
const FIXTURE_MESSAGE_ID = 'e2e00000-0000-4000-8000-000000000002';
const FIXTURE_NOTIFICATION_ID = 'e2e00000-0000-4000-8000-000000000003';

export async function ensureE2eFixtures(
  jobseekerEmail: string,
  companyEmail: string,
): Promise<void> {
  // findFirst, not findUnique: email is only unique among active rows (see
  // the users_email_partial_unique migration), so deletedAt: null pins this
  // to the live test account rather than any stale soft-deleted row.
  const [jobseeker, company] = await Promise.all([
    db.user.findFirst({ where: { email: jobseekerEmail, deletedAt: null }, select: { id: true } }),
    db.user.findFirst({ where: { email: companyEmail, deletedAt: null }, select: { id: true } }),
  ]);
  if (!jobseeker || !company) return; // sign-in above didn't complete; nothing to provision

  // Opt-in only. Verification is the admin's decision in the product, and on a
  // database shared with production it lets this account publish listings that
  // real users see - the e2e suite then creates one per run. Set it for a
  // preview/ephemeral database; otherwise approve the account in /admin (or
  // leave it pending and the company specs skip with that reason).
  if (process.env.E2E_VERIFY_COMPANY === '1') {
    await db.companyProfile.updateMany({
      where: { userId: company.id },
      data: { verificationStatus: 'VERIFIED' },
    });
  }

  const resume = await db.resume.upsert({
    where: { id: FIXTURE_RESUME_ID },
    create: {
      id: FIXTURE_RESUME_ID,
      userId: jobseeker.id,
      title: 'E2E Fixture Resume.pdf',
      fileBlobUrl:
        'https://demo-blob.public.blob.vercel-storage.com/resumes/e2e-fixture-resume.pdf',
      fileMime: 'application/pdf',
      fileSizeBytes: 123_456,
      isDefault: true,
    },
    // Revived, not left alone: retention soft-deletes a résumé whose blob it
    // cannot find (this one's URL is a placeholder), and `update: {}` kept it
    // hidden from the list for good.
    update: { deletedAt: null, userId: jobseeker.id },
  });

  // A job the e2e company "owns", with a chat area both e2e accounts share —
  // backs the applicant-status and chat specs.
  const job = await db.jobPost.upsert({
    where: { slug: FIXTURE_JOB_SLUG },
    create: {
      slug: FIXTURE_JOB_SLUG,
      companyId: company.id,
      title: 'E2E Fixture — Support Engineer',
      description: 'Fixture job used only by the Playwright e2e suite. Not a real listing.',
      requirements: 'None — e2e fixture.',
      industry: 'TECHNOLOGY',
      jobType: 'FULL_TIME',
      experienceLevel: 'MID',
      workMode: 'REMOTE',
      location: 'Remote',
      salaryMin: 50_000,
      salaryMax: 70_000,
      salaryCurrency: 'USD',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    update: { deletedAt: null, status: 'PUBLISHED' },
    select: { id: true, title: true },
  });

  const chatArea = await db.chatArea.upsert({
    where: { jobPostId: job.id },
    create: { kind: 'JOB', companyId: company.id, jobPostId: job.id, title: job.title },
    update: {},
    select: { id: true },
  });
  await Promise.all(
    [company.id, jobseeker.id].map((userId) =>
      db.chatParticipant.upsert({
        where: { chatAreaId_userId: { chatAreaId: chatArea.id, userId } },
        create: { chatAreaId: chatArea.id, userId },
        update: {},
      }),
    ),
  );
  await db.chatMessage.upsert({
    where: { id: FIXTURE_MESSAGE_ID },
    create: {
      id: FIXTURE_MESSAGE_ID,
      chatAreaId: chatArea.id,
      senderId: company.id,
      kind: 'TEXT',
      body: 'Welcome — this is the e2e fixture chat area.',
    },
    update: {},
  });

  // Reset to SUBMITTED each run so the applicant-status e2e test (which moves
  // it to SHORTLISTED) is repeatable.
  await db.jobApplication.upsert({
    where: { jobPostId_jobSeekerId: { jobPostId: job.id, jobSeekerId: jobseeker.id } },
    create: {
      jobPostId: job.id,
      jobSeekerId: jobseeker.id,
      resumeId: resume.id,
      status: 'SUBMITTED',
    },
    update: { status: 'SUBMITTED' },
  });

  // Each run's status-change test genuinely triggers update-applicant-status.ts's
  // real notification (APPLICATION_STATUS_CHANGED, and CHAT_AREA_ADDED the first
  // time it shortlists) — otherwise these accumulate forever across repeated e2e
  // runs and eventually bloat the notifications page enough to time out other
  // specs. Only ever produced for this fixture application, so safe to clear.
  await db.notification.deleteMany({
    where: {
      userId: jobseeker.id,
      kind: { in: ['APPLICATION_STATUS_CHANGED', 'CHAT_AREA_ADDED'] },
    },
  });

  // Reset to PENDING each run so the accept/decline e2e test is repeatable.
  await db.invitation.upsert({
    where: {
      companyId_jobSeekerId_profileType: {
        companyId: company.id,
        jobSeekerId: jobseeker.id,
        profileType: 'VIRTUAL_INTERN',
      },
    },
    create: {
      companyId: company.id,
      jobSeekerId: jobseeker.id,
      profileType: 'VIRTUAL_INTERN',
      status: 'PENDING',
      message: 'E2E fixture invitation.',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      status: 'PENDING',
      respondedAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Dedicated unread notification for the mark-read spec — kept independent of
  // the invitation's own INVITATION_RECEIVED notification so the two specs
  // don't interfere with each other.
  await db.notification.upsert({
    where: { id: FIXTURE_NOTIFICATION_ID },
    create: {
      id: FIXTURE_NOTIFICATION_ID,
      userId: jobseeker.id,
      kind: 'SYSTEM',
      payload: { message: 'E2E fixture notification for the mark-read test.' },
    },
    update: { readAt: null },
  });
}
