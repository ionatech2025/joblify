'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { fileTypeFromBuffer } from 'file-type';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import {
  put,
  resumePathPrefix,
  logoPathPrefix,
  RESUME_MIME,
  IMAGE_MIME,
  RESUME_MAX_BYTES,
  LOGO_MAX_BYTES,
} from '@/lib/storage/blob';
import { runResumeParse } from '@/workflows/resume-parse.workflow';
import { logger } from '@/lib/observability/logger';
import { type ActionResult, succeed, fail } from '@/lib/action-result';

// Client uploads go straight to Vercel Blob via /api/v1/uploads/sign; the DB row
// (resume) / profile field (logo) is registered here once upload() resolves. This
// is synchronous from the client's view and works in local dev (where Blob's
// onUploadCompleted webhook never fires).

function pathnameOf(url: string): string {
  return new URL(url).pathname.replace(/^\/+/, '');
}

function isAllowedResumeUrl(url: string, userId: string): boolean {
  if (url.startsWith('data:application/')) return true;
  try {
    return pathnameOf(url).startsWith(resumePathPrefix(userId));
  } catch {
    return false;
  }
}

function isAllowedLogoUrl(url: string, userId: string): boolean {
  if (url.startsWith('data:image/')) return true;
  try {
    return pathnameOf(url).startsWith(logoPathPrefix(userId));
  } catch {
    return false;
  }
}

const RegisterResume = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(200),
  contentType: z.string().max(200).optional(),
  sizeBytes: z
    .number()
    .int()
    .min(0)
    .max(50 * 1024 * 1024)
    .optional(),
});

export type RegisteredResume = {
  id: string;
  title: string;
  fileBlobUrl: string;
  createdAt: string;
};

export async function registerResume(
  input: z.infer<typeof RegisterResume>,
): Promise<RegisteredResume> {
  const user = await requireRole('JOB_SEEKER');
  const parsed = RegisterResume.parse(input);

  // Defense in depth: the uploaded blob must live in this user's namespace.
  if (!isAllowedResumeUrl(parsed.url, user.id)) {
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

/**
 * Direct server-side upload fallback for resumes when Vercel Blob client token
 * is not configured or fails. Handles file validation, storage, and registration.
 */
export async function uploadResumeDirect(
  formData: FormData,
): Promise<ActionResult<RegisteredResume>> {
  const user = await requireRole('JOB_SEEKER');
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return fail('No file was provided. Please select a resume file.');
  }

  if (file.size > RESUME_MAX_BYTES) {
    return fail('File is too large. Please upload a resume under 5MB.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime || file.type;
  if (!detected || !RESUME_MIME.includes(detected.mime as (typeof RESUME_MIME)[number])) {
    return fail('Unsupported file type. Please upload a PDF or Word document.');
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  let fileBlobUrl: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`resumes/${user.id}/${safe}`, buffer, {
        access: 'public',
        contentType: mime,
      });
      fileBlobUrl = blob.url;
    } catch (err) {
      logger.warn({ err }, 'Vercel Blob put failed, falling back to data URL');
      fileBlobUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }
  } else {
    fileBlobUrl = `data:${mime};base64,${buffer.toString('base64')}`;
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
          title: file.name.slice(0, 200),
          fileBlobUrl,
          fileMime: mime,
          fileSizeBytes: file.size,
        },
        select: { id: true, title: true, fileBlobUrl: true, createdAt: true },
      }),
  );

  after(async () => {
    try {
      await runResumeParse({ resumeId: resume.id });
    } catch (err) {
      logger.error({ err, resumeId: resume.id }, 'resume-parse failed (post-register)');
    }
  });

  return succeed({
    id: resume.id,
    title: resume.title,
    fileBlobUrl: resume.fileBlobUrl,
    createdAt: resume.createdAt.toISOString(),
  });
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
  if (!isAllowedLogoUrl(url, user.id)) {
    throw new AuthError('FORBIDDEN');
  }
  await db.companyProfile.updateMany({ where: { userId: user.id }, data: { logoUrl: url } });
}

/**
 * Direct server-side upload fallback for company logos when Vercel Blob client token
 * is not configured or fails.
 */
export async function uploadLogoDirect(formData: FormData): Promise<ActionResult<string>> {
  const user = await requireRole('COMPANY');
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return fail('No file was provided.');
  }

  if (file.size > LOGO_MAX_BYTES) {
    return fail('Logo image is too large. Please upload an image under 2MB.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime || file.type;
  if (!detected || !IMAGE_MIME.includes(detected.mime as (typeof IMAGE_MIME)[number])) {
    return fail('Invalid image format. Please upload a PNG, JPEG, or WebP file.');
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  let logoUrl: string;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`logos/${user.id}/${safe}`, buffer, {
        access: 'public',
        contentType: mime,
      });
      logoUrl = blob.url;
    } catch (err) {
      logger.warn({ err }, 'Vercel Blob put failed for logo, falling back to data URL');
      logoUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }
  } else {
    logoUrl = `data:${mime};base64,${buffer.toString('base64')}`;
  }

  await db.companyProfile.updateMany({ where: { userId: user.id }, data: { logoUrl } });
  return succeed(logoUrl);
}
