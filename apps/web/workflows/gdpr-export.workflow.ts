// GDPR Article 15 (right of access) / Article 20 (portability) export.
//
// Collects every row that belongs to the user, packs it into one JSON document
// and RETURNS it to the caller, which streams it to the signed-in requester.
//
// It is deliberately not stored. The previous implementation wrote the bundle
// to a *public* Blob URL, e-mailed that link, and relied on a once-a-day cron to
// delete it — so a complete copy of a person's data sat at an unauthenticated
// address for up to ~48 hours, in their mailbox, and in any forwarded copy. A
// response to the authenticated session that asked for it has none of those
// properties and needs no cleanup.
//
// Scope rule: the export contains data ABOUT THE REQUESTER. For a company that
// means its own profile and the postings it authored — not the personal data of
// the candidates who applied (that belongs to those candidates).

import { db } from '@/lib/db';

export type GdprExportInput = { userId: string };

export type GdprExport = {
  filename: string;
  json: string;
  counts: Record<string, number>;
};

const CAP = {
  applications: 2_000,
  auditEvents: 5_000,
  chatMessages: 5_000,
  jobViews: 5_000,
  notifications: 2_000,
} as const;

export async function buildGdprExport({ userId }: GdprExportInput): Promise<GdprExport> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      jobSeekerProfile: {
        include: {
          skills: { include: { skill: { select: { slug: true, label: true } } } },
          workExperiences: true,
        },
      },
      companyProfile: true,
      jobsPosted: true,
      applications: {
        include: { jobPost: { select: { title: true, slug: true } } },
        orderBy: { appliedAt: 'desc' },
        take: CAP.applications,
      },
      resumes: { orderBy: { createdAt: 'desc' } },
      notifications: { orderBy: { createdAt: 'desc' }, take: CAP.notifications },
      invitationsSent: true,
      invitationsRecv: true,
      savedJobs: true,
      savedSearches: true,
      subscriptions: true,
      chatMemberships: true,
    },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  const [auditEvents, chatMessages, jobViews] = await Promise.all([
    db.auditEvent.findMany({
      where: { actorId: userId },
      orderBy: { createdAt: 'desc' },
      take: CAP.auditEvents,
    }),
    db.chatMessage.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
      take: CAP.chatMessages,
      select: {
        id: true,
        chatAreaId: true,
        kind: true,
        body: true,
        attachmentUrl: true,
        createdAt: true,
      },
    }),
    // Only rows that carry the user's id (stored with analytics consent).
    db.jobView.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: CAP.jobViews,
      select: { id: true, jobPostId: true, referrer: true, createdAt: true },
    }),
  ]);

  // The stored file locator is an internal storage address, not something a
  // person can use. Give them the authenticated path that actually serves it.
  const resumes = user.resumes.map(({ fileBlobUrl: _locator, ...r }) => ({
    ...r,
    downloadPath: `/api/v1/resumes/${r.id}/file`,
  }));

  const { resumes: _r, ...rest } = user;
  const now = new Date();

  const bundle = {
    exportedAt: now.toISOString(),
    format: 'joblify-data-export/1',
    user: { ...rest, resumes },
    chatMessagesSent: chatMessages,
    jobViews,
    auditEvents,
    // Art. 15(1)(a)–(h): what is done with the data, and the automated parts.
    processing: {
      controller: 'Joblify',
      purposes: [
        'Operating your account and the job marketplace (contract)',
        'Security, fraud and abuse prevention (legitimate interest)',
        'Daily jobs digest by e-mail, only if you switched it on (consent)',
      ],
      recipients: [
        'The employers you apply to receive your application, cover letter and résumé',
        'Processors listed at /legal/processors (hosting, database, search, e-mail, monitoring, AI)',
      ],
      automatedProcessing: [
        {
          name: 'Résumé parsing',
          description:
            'An AI model extracts structured fields (name, skills, experience) from an uploaded résumé; matching skills are added to your profile, which you can edit.',
        },
        {
          name: 'Match score',
          description:
            'A similarity score between your résumé and a job posting is computed from text embeddings and shown to the employer and to you. It is an indicator, not a decision: no application is accepted or rejected automatically.',
        },
      ],
      retention: {
        account: 'Until you delete it; a deleted account is erased after 30 days',
        auditLog:
          'IP address and device details removed after 90 days; events deleted after 1 year',
        jobViews: '13 months',
      },
      yourRights: [
        'Rectification (edit your profile)',
        'Erasure (/account/delete)',
        'Objection and withdrawal of consent (notification settings)',
        'Complaint to your data-protection authority',
      ],
    },
  };

  await db.auditEvent.create({
    data: { actorId: userId, action: 'USER_EXPORTED', entity: 'user', entityId: userId },
  });

  return {
    filename: `joblify-data-export-${now.toISOString().slice(0, 10)}.json`,
    json: JSON.stringify(bundle, null, 2),
    counts: {
      applications: user.applications.length,
      resumes: resumes.length,
      notifications: user.notifications.length,
      chatMessages: chatMessages.length,
      auditEvents: auditEvents.length,
    },
  };
}
