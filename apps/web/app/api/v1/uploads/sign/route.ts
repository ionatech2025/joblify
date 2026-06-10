import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import {
  RESUME_MIME,
  IMAGE_MIME,
  RESUME_MAX_BYTES,
  LOGO_MAX_BYTES,
  resumePathPrefix,
  logoPathPrefix,
} from '@/lib/storage/blob';
import { logger } from '@/lib/observability/logger';


// Signs scoped upload tokens for Vercel Blob client uploads. Path prefix is
// always derived server-side from the authenticated user — the client cannot
// upload outside their own namespace.

type Kind = 'resume' | 'logo';

export async function POST(request: Request): Promise<Response> {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = (clientPayload ? JSON.parse(clientPayload) : {}) as { kind?: Kind };
        const kind: Kind = payload.kind === 'logo' ? 'logo' : 'resume';

        if (kind === 'resume' && user.userType !== 'JOB_SEEKER') {
          throw new Error('Only jobseekers can upload resumes.');
        }
        if (kind === 'logo' && user.userType !== 'COMPANY') {
          throw new Error('Only companies can upload logos.');
        }

        const prefix = kind === 'resume' ? resumePathPrefix(user.id) : logoPathPrefix(user.id);
        if (!pathname.startsWith(prefix)) {
          throw new Error(`Path must start with ${prefix}`);
        }

        return {
          allowedContentTypes: kind === 'resume' ? [...RESUME_MIME] : [...IMAGE_MIME],
          maximumSizeInBytes: kind === 'resume' ? RESUME_MAX_BYTES : LOGO_MAX_BYTES,
          tokenPayload: JSON.stringify({ kind, userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // The DB row (resume) / profile field (logo) is written by the client-
        // invoked Server Action (app/actions/uploads.ts) once upload() resolves,
        // so it also works in local dev where this callback never fires.
        logger.info({ url: blob.url }, 'blob upload completed');
      },
    });

    return NextResponse.json(json);
  } catch (err) {
    logger.error({ err }, 'upload sign failed');
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'upload failed' },
      { status: 400 },
    );
  }
}
