import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse, after } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runResumeParse } from '@/workflows/resume-parse.workflow';
import {
  RESUME_MIME,
  IMAGE_MIME,
  RESUME_MAX_BYTES,
  LOGO_MAX_BYTES,
  resumePathPrefix,
  logoPathPrefix,
} from '@/lib/storage/blob';
import { db } from '@/lib/db';
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
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? '{}') as { kind?: Kind; userId?: string };
        if (!payload.userId) return;

        if (payload.kind === 'resume') {
          // Magic-byte mime sniff + virus scan happen in resume-parse workflow.
          const created = await db.resume.create({
            data: {
              userId: payload.userId,
              title: blob.pathname.split('/').pop() ?? 'Resume',
              fileBlobUrl: blob.url,
              fileMime: blob.contentType ?? 'application/octet-stream',
              fileSizeBytes: 0, // not on the upload-completed payload; resume-parse can backfill
            },
          });
          // Parse + embed off the response path. Idempotent — safe to retry.
          after(async () => {
            try {
              await runResumeParse({ resumeId: created.id });
            } catch (err) {
              logger.error({ err, resumeId: created.id }, 'resume-parse failed (post-upload)');
            }
          });
        }

        if (payload.kind === 'logo') {
          await db.companyProfile.updateMany({
            where: { userId: payload.userId },
            data: { logoUrl: blob.url },
          });
        }
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
