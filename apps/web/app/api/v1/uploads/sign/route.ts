import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { RESUME_MIME, RESUME_MAX_BYTES, resumePathPrefix } from '@/lib/storage/blob';
import { logger } from '@/lib/observability/logger';
import { uploadSignLimit } from '@/lib/ratelimit';

// Signs scoped upload tokens for Vercel Blob client uploads of RÉSUMÉS — the
// one upload too large for a Server Action (the platform body limit is ~4.5 MB,
// the résumé limit 5 MB). Company logos are ≤ 2 MB and go through the
// `uploadLogoDirect` Server Action instead, which keeps this route to a single
// store (the private one, via BLOB_READ_WRITE_TOKEN) and a single caller type.
//
// The path prefix is always derived server-side from the authenticated user —
// the client cannot upload outside their own namespace.

// Messages from this are written for the end user and safe to return. Anything
// else (SDK/network errors) is logged and answered generically.
class UploadNotPermitted extends Error {}

export async function POST(request: Request): Promise<Response> {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const rl = await uploadSignLimit(user.id);
  if (!rl.success) {
    return NextResponse.json({ error: 'too many upload requests' }, { status: 429 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (user.userType !== 'JOB_SEEKER') {
          throw new UploadNotPermitted('Only jobseekers can upload resumes.');
        }

        const prefix = resumePathPrefix(user.id);
        if (!pathname.startsWith(prefix) || pathname.split('/').includes('..')) {
          throw new UploadNotPermitted('Invalid upload path.');
        }

        return {
          allowedContentTypes: [...RESUME_MIME],
          maximumSizeInBytes: RESUME_MAX_BYTES,
          // Unguessable names: a filename must not be the only thing standing
          // between a stranger and a document.
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind: 'resume', userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // The DB row is written by the client-invoked Server Action
        // (app/actions/uploads.ts → registerResume) once upload() resolves, so
        // it also works in local dev where this callback never fires. Log the
        // pathname only: the URL of a private object is not something to log.
        logger.info({ pathname: blob.pathname }, 'blob upload completed');
      },
    });

    return NextResponse.json(json);
  } catch (err) {
    if (err instanceof UploadNotPermitted) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    logger.error({ err }, 'upload sign failed');
    return NextResponse.json({ error: 'upload could not be started' }, { status: 400 });
  }
}
