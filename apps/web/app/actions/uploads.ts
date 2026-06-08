'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { resumePathPrefix, logoPathPrefix } from '@/lib/storage/blob';
import { runResumeParse } from '@/workflows/resume-parse.workflow';
import { logger } from '@/lib/observability/logger';

// Client uploads go straight to Vercel Blob via /api/v1/uploads/sign; the DB row
// (resume) / profile field (logo) is registered here once upload() resolves. This
// is synchronous from the client's view and works in local dev (where Blob's
// onUploadCompleted webhook never fires).

function pathnameOf(url: string): string {
  return new URL(url).pathname.replace(/^\/+/, '');
}

const RegisterResume = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  contentType: z.string().max(200).optional(),
  sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024).optional(),
});

export type RegisteredResume = { id: string; title: string; fileBlobUrl: string; createdAt: string };

export async function registerResume(input: z.infer<typeof RegisterResume>): Promise<RegisteredResume> {
  const user = await requireRole('JOB_SEEKER');
  const parsed = RegisterResume.parse(input);

  // Defense in depth: the uploaded blob must live in this user's namespace.
  if (!pathnameOf(parsed.url).startsWith(resumePathPrefix(user.id))) {
    throw new AuthError('FORBIDDEN');
  }

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  const resume = await withAudit(
    { actorId: user.id, ip, ua },
    { action: 'RESUME_UPLOADED', entity: 'resume', after: (r) => ({ id: r.id, title: r.title }) },
    (tx) =>
      tx.resume.create({
        data: {
          userId: user.id,
          title: parsed.title.slice(0, 200),
          fileBlobUrl: parsed.url,
          fileMime: parsed.contentType ?? 'application/octet-stream',
          fileSizeBytes: parsed.sizeBytes ?? 0,
        },
        select: { id: true, title: true, fileBlobUrl: true, createdAt: true },
      }),
  );

  // Parse + embed off the response path (idempotent).
  after(async () => {
    try {
      await runResumeParse({ resumeId: resume.id });
    } catch (err) {
      logger.error({ err, resumeId: resume.id }, 'resume-parse failed (post-register)');
    }
  });

  return {
    id: resume.id,
    title: resume.title,
    fileBlobUrl: resume.fileBlobUrl,
    createdAt: resume.createdAt.toISOString(),
  };
}

export async function deleteResume(resumeId: string): Promise<void> {
  const user = await requireRole('JOB_SEEKER');
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: user.id, deletedAt: null },
    select: { id: true },
  });
  if (!resume) throw new AuthError('FORBIDDEN');
  await db.resume.update({ where: { id: resume.id }, data: { deletedAt: new Date() } });
}

export async function registerLogo(input: { url: string }): Promise<void> {
  const user = await requireRole('COMPANY');
  const url = z.string().url().parse(input.url);
  if (!pathnameOf(url).startsWith(logoPathPrefix(user.id))) {
    throw new AuthError('FORBIDDEN');
  }
  await db.companyProfile.updateMany({ where: { userId: user.id }, data: { logoUrl: url } });
}
