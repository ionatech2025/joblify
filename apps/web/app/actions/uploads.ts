'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { fileTypeFromBuffer } from 'file-type';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import {
  putStored,
  verifyStoredBlob,
  deleteStored,
  storeConfigured,
  resumePathPrefix,
  logoPathPrefix,
  RESUME_MIME,
  IMAGE_MIME,
  RESUME_MAX_BYTES,
  LOGO_MAX_BYTES,
  MAX_ACTIVE_RESUMES,
  type ResumeMime,
} from '@/lib/storage/blob';
import { runResumeParse } from '@/workflows/resume-parse.workflow';
import { logger } from '@/lib/observability/logger';
import { clientIp } from '@/lib/security/client-ip';
import { type ActionResult, succeed, fail } from '@/lib/action-result';

// Client uploads go straight to the private Blob store via /api/v1/uploads/sign;
// the DB row (resume) / profile field (logo) is registered here once upload()
// resolves.
//
// TRUST MODEL — the client only *names* an object; it never describes one. The
// URL it sends is checked against OUR store (host pinned, path prefix pinned,
// existence confirmed through the store's own API) and every persisted value
// (URL, content type, size) is the store's, not the client's. Previously the
// check was a path prefix on a URL of any host, and the content type and size
// were taken from the request.

const RegisterResume = z.object({
  url: z.string().url().max(2_000),
  title: z.string().min(1).max(200),
  // Accepted for API compatibility and ignored: the store reports the truth.
  contentType: z.string().max(200).optional(),
  sizeBytes: z.number().int().min(0).optional(),
});

export type RegisteredResume = {
  id: string;
  title: string;
  createdAt: string;
};

// No fallback to inline `data:` storage in production: it put up to 5 MB of
// base64 per résumé in a Postgres column and bypassed every control above.
// It survives only for local development with no Blob store configured.
const DEV_INLINE_FALLBACK = process.env.NODE_ENV !== 'production';

function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return cleaned.slice(0, 120) || 'file';
}

async function activeResumeCount(userId: string): Promise<number> {
  return db.resume.count({ where: { userId, deletedAt: null } });
}

function auditContext(h: Headers, actorId: string) {
  return { actorId, ip: clientIp(h), ua: h.get('user-agent') };
}

export async function registerResume(
  input: z.infer<typeof RegisterResume>,
): Promise<RegisteredResume> {
  const user = await requireRole('JOB_SEEKER');
  const parsed = RegisterResume.parse(input);

  const blob = await verifyStoredBlob(parsed.url, 'private', resumePathPrefix(user.id));
  if (!blob) throw new AuthError('FORBIDDEN');

  // The sign route constrains type and size at upload time; re-assert here
  // because this action is callable directly with any URL in the user's
  // namespace. Anything out of bounds is removed from the store, not just
  // refused.
  const typeOk = RESUME_MIME.includes(blob.contentType as ResumeMime);
  if (!typeOk || blob.size > RESUME_MAX_BYTES) {
    await deleteStored(blob.url, 'private');
    throw new Error('That file is not an accepted résumé (PDF or Word .docx, up to 5 MB).');
  }

  if ((await activeResumeCount(user.id)) >= MAX_ACTIVE_RESUMES) {
    await deleteStored(blob.url, 'private');
    throw new Error(
      `You can keep up to ${MAX_ACTIVE_RESUMES} résumés. Delete one to upload another.`,
    );
  }

  const h = await headers();
  const resume = await withAudit(
    auditContext(h, user.id),
    { action: 'RESUME_UPLOADED', entity: 'resume', after: (r) => ({ id: r.id, title: r.title }) },
    (tx) =>
      tx.resume.create({
        data: {
          userId: user.id,
          title: parsed.title.slice(0, 200),
          fileBlobUrl: blob.url,
          fileMime: blob.contentType,
          fileSizeBytes: blob.size,
        },
        select: { id: true, title: true, createdAt: true },
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

  return { id: resume.id, title: resume.title, createdAt: resume.createdAt.toISOString() };
}

/**
 * Direct server-side upload, for when the browser cannot use a client token.
 * Bounded by the platform request-body limit (~4.5 MB on Vercel), which is why
 * client uploads remain the primary path. Validates by magic bytes, stores
 * privately, registers.
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

  if ((await activeResumeCount(user.id)) >= MAX_ACTIVE_RESUMES) {
    return fail(`You can keep up to ${MAX_ACTIVE_RESUMES} résumés. Delete one to upload another.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !RESUME_MIME.includes(detected.mime as ResumeMime)) {
    return fail('Unsupported file type. Please upload a PDF or a Word .docx document.');
  }
  const mime = detected.mime;

  const name = safeFileName(file.name);
  let locator: string;

  if (storeConfigured('private')) {
    try {
      const stored = await putStored(
        'private',
        `${resumePathPrefix(user.id)}${name}`,
        buffer,
        mime,
      );
      locator = stored.url;
    } catch (err) {
      logger.error({ err, userId: user.id }, 'private blob put failed (resume upload)');
      return fail('We could not store your file right now. Please try again in a few minutes.');
    }
  } else if (DEV_INLINE_FALLBACK) {
    locator = `data:${mime};base64,${buffer.toString('base64')}`;
  } else {
    logger.error('resume upload attempted but no private Blob store is configured');
    return fail('File uploads are temporarily unavailable. Please try again later.');
  }

  const h = await headers();
  const resume = await withAudit(
    auditContext(h, user.id),
    { action: 'RESUME_UPLOADED', entity: 'resume', after: (r) => ({ id: r.id, title: r.title }) },
    (tx) =>
      tx.resume.create({
        data: {
          userId: user.id,
          title: file.name.slice(0, 200),
          fileBlobUrl: locator,
          fileMime: mime,
          fileSizeBytes: buffer.byteLength,
        },
        select: { id: true, title: true, createdAt: true },
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
    createdAt: resume.createdAt.toISOString(),
  });
}

/**
 * Delete a résumé.
 *
 * A résumé that no application references is erased outright — row and stored
 * file. One that an employer has already received with an application is only
 * hidden from the owner (`deletedAt`): the employer's copy of what was
 * submitted is not the candidate's to recall, `JobApplication.resumeId` is a
 * RESTRICT foreign key, and the retention sweep removes the file once the
 * applications that reference it are gone.
 */
export async function deleteResume(resumeId: string): Promise<void> {
  const user = await requireRole('JOB_SEEKER');
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: user.id, deletedAt: null },
    select: { id: true, fileBlobUrl: true },
  });
  if (!resume) throw new AuthError('FORBIDDEN');

  const referenced = await db.jobApplication.count({ where: { resumeId: resume.id } });
  if (referenced === 0) {
    await db.resume.delete({ where: { id: resume.id } });
    await deleteStored(resume.fileBlobUrl, 'private');
    return;
  }
  await db.resume.update({ where: { id: resume.id }, data: { deletedAt: new Date() } });
}

/**
 * Company logo upload. Logos are <= 2 MB, so they go straight through this
 * Server Action: validated by magic bytes, stored in the PUBLIC store (they are
 * shown to anonymous visitors), and any logo they replace is deleted.
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
  if (!detected || !IMAGE_MIME.includes(detected.mime as (typeof IMAGE_MIME)[number])) {
    return fail('Invalid image format. Please upload a PNG, JPEG, or WebP file.');
  }
  const mime = detected.mime;
  const name = safeFileName(file.name);

  let logoUrl: string;
  if (storeConfigured('public')) {
    try {
      const stored = await putStored('public', `${logoPathPrefix(user.id)}${name}`, buffer, mime);
      logoUrl = stored.url;
    } catch (err) {
      logger.error({ err, userId: user.id }, 'public blob put failed (logo upload)');
      return fail('We could not store your logo right now. Please try again in a few minutes.');
    }
  } else if (DEV_INLINE_FALLBACK) {
    logoUrl = `data:${mime};base64,${buffer.toString('base64')}`;
  } else {
    logger.error('logo upload attempted but no public Blob store is configured');
    return fail('Logo uploads are temporarily unavailable. Please try again later.');
  }

  await replaceLogo(user.id, logoUrl);
  return succeed(logoUrl);
}

// Set the new logo, then remove the file it replaces so superseded logos do
// not accumulate in the store.
async function replaceLogo(userId: string, logoUrl: string): Promise<void> {
  const previous = await db.companyProfile.findUnique({
    where: { userId },
    select: { logoUrl: true },
  });
  await db.companyProfile.updateMany({ where: { userId }, data: { logoUrl } });
  if (previous?.logoUrl && previous.logoUrl !== logoUrl) {
    await deleteStored(previous.logoUrl, 'public');
  }
}
