// GDPR Article 15 (Right to access) export.
//
// Collects every row owned by the user, packs it into a JSON bundle, uploads
// it to Blob as an unguessable capability URL, and emails it to the user.
// The 24h expiry promised in that email is enforced by the retention sweep
// (workflows/retention.workflow.ts step 5), which deletes exports/ blobs
// older than 24h. Audit-logged.

import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import { logger } from '@/lib/observability/logger';

export type GdprExportInput = { userId: string };

export async function runGdprExport({ userId }: GdprExportInput): Promise<{ url: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      jobSeekerProfile: { include: { skills: { include: { skill: true } } } },
      companyProfile: true,
      jobsPosted: true,
      applications: { include: { jobPost: { select: { title: true, slug: true } }, resume: true } },
      resumes: true,
      notifications: true,
      invitationsSent: true,
      invitationsRecv: true,
    },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  const auditEvents = await db.auditEvent.findMany({
    where: { actorId: userId },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const bundle = {
    exportedAt: new Date().toISOString(),
    user: { ...user, resumes: user.resumes.map(stripResumeBinary) },
    auditEvents,
  };

  const json = JSON.stringify(bundle, null, 2);
  const blob = await put(`exports/${userId}/${Date.now()}.json`, json, {
    // Capability URL: unguessable via addRandomSuffix, and deleted after 24h
    // by the retention sweep — the exports/ prefix is what that sweep scans.
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: true,
  });

  await db.auditEvent.create({
    data: {
      actorId: userId,
      action: 'USER_EXPORTED',
      entity: 'user',
      entityId: userId,
    },
  });

  // Email link
  try {
    await resend().emails.send({
      from: EMAIL_FROM,
      to: user.email,
      subject: 'Your Joblify data export',
      text: `Your data export is ready: ${blob.url}\n\nThis link expires in 24 hours. You can request a fresh export at any time from your account page.`,
      html: `<p>Your data export is ready: <a href="${blob.url}">download</a>.</p><p>This link expires in 24 hours. You can request a fresh export at any time from your account page.</p>`,
    });
  } catch (err) {
    logger.warn({ err, userId }, 'GDPR export email failed (best-effort)');
  }

  return { url: blob.url };
}

function stripResumeBinary<T extends { fileBlobUrl: string }>(resume: T): T {
  // The export points at the URL; we don't inline binary bytes to keep the
  // bundle small. Users can download from the URL.
  return resume;
}
