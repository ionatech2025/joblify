import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { resumeDownloadLimit } from '@/lib/ratelimit';
import { openBlobStream, readBlobBytes, RESUME_MIME, type ResumeMime } from '@/lib/storage/blob';
import { logger } from '@/lib/observability/logger';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The only way to read a stored résumé.
 *
 * Résumés live in a private Blob store, so a storage URL opens nothing on its
 * own; this route is where "who may read this document" is decided, per
 * request, next to the read — the pattern Vercel's private-blob guidance asks
 * for (verify auth in the route handler, never in middleware or a CDN cache).
 *
 * Who may read résumé R:
 *   - its owner (while it is not deleted);
 *   - a COMPANY that owns a job R was submitted to, via an application that is
 *     still live (a WITHDRAWN application withdraws the employer's access too).
 * Nobody else — in particular not other companies, other candidates, or admins
 * (the verification queue never needs a candidate's document).
 *
 * A non-authorised caller gets 404, not 403, so ids cannot be probed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const rl = await resumeDownloadLimit(user.id);
  if (!rl.success) return NextResponse.json({ error: 'rate-limited' }, { status: 429 });

  const { id } = await params;
  if (!UUID.test(id)) return notFound();

  const resume = await db.resume.findUnique({
    where: { id },
    select: { id: true, userId: true, title: true, fileBlobUrl: true, fileMime: true, deletedAt: true },
  });
  if (!resume) return notFound();

  let allowed = false;
  if (resume.userId === user.id) {
    allowed = resume.deletedAt === null;
  } else if (user.userType === 'COMPANY') {
    const grant = await db.jobApplication.findFirst({
      where: {
        resumeId: resume.id,
        status: { not: 'WITHDRAWN' },
        jobPost: { companyId: user.id },
      },
      select: { id: true },
    });
    allowed = grant !== null;
  }
  if (!allowed) return notFound();

  const mime = RESUME_MIME.includes(resume.fileMime as ResumeMime)
    ? resume.fileMime
    : 'application/octet-stream';

  // Always a download, never rendered inline in our origin: a hostile PDF must
  // not execute in a page that shares cookies with the signed-in session.
  const headers = new Headers({
    'Content-Type': mime,
    'Content-Disposition': contentDisposition(resume.title, mime),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  });

  try {
    if (resume.fileBlobUrl.startsWith('data:')) {
      // Local-development locators only (readBlobBytes refuses them in prod).
      const bytes = await readBlobBytes(resume.fileBlobUrl, { maxBytes: 10 * 1024 * 1024 });
      return new Response(Buffer.from(bytes), { headers });
    }
    const opened = await openBlobStream(resume.fileBlobUrl);
    if (!opened) return notFound();
    return new Response(opened.stream, { headers });
  } catch (err) {
    logger.error({ err, resumeId: resume.id }, 'resume download failed');
    return NextResponse.json({ error: 'file unavailable' }, { status: 502 });
  }
}

function notFound(): Response {
  return NextResponse.json({ error: 'not found' }, { status: 404 });
}

const EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

function contentDisposition(title: string, mime: string): string {
  const ext = EXT[mime] ?? '';
  const base =
    title
      .replace(/\.(pdf|docx?)$/i, '')
      .replace(/[^\w .-]+/g, '_')
      .trim()
      .slice(0, 80) || 'resume';
  const ascii = `${base}${ext}`.replace(/"/g, '');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(ascii)}`;
}
