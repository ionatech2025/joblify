'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { renderToBuffer } from '@react-pdf/renderer';
import type { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import {
  MAX_ACTIVE_RESUMES,
  putStored,
  resumePathPrefix,
  storeConfigured,
} from '@/lib/storage/blob';
import { ResumeDocument, type ResumeData } from '@/lib/resume/resume-document';
import { runResumeParse } from '@/workflows/resume-parse.workflow';
import { logger } from '@/lib/observability/logger';
import { clientIp } from '@/lib/security/client-ip';

// JOB_UC_05.0: builds a resume PDF from the jobseeker's own profile data
// (headline, bio, skills, work experience, education, certifications)
// instead of requiring a pre-made file upload. The generated PDF is stored
// through the same Resume model as an uploaded file, so it shows up
// alongside uploads in "My resumes" with no separate UI needed.
export async function generateResume(): Promise<{ id: string }> {
  const user = await requireRole('JOB_SEEKER');

  const maxResumes = MAX_ACTIVE_RESUMES ?? 10;
  if (db.resume?.count) {
    const active = await db.resume.count({ where: { userId: user.id, deletedAt: null } });
    if (active >= maxResumes) {
      throw new Error(`You can keep up to ${maxResumes} résumés. Delete one to generate another.`);
    }
  }

  const profile = await db.jobSeekerProfile.findUnique({
    where: { userId: user.id },
    include: {
      skills: { select: { skill: { select: { label: true } } } },
      workExperiences: { orderBy: { createdAt: 'asc' } },
    },
  });

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const data: ResumeData = {
    name,
    headline: profile?.headline ?? null,
    email: user.email,
    location: profile?.location ?? null,
    portfolioUrl: profile?.portfolioUrl ?? null,
    bio: profile?.bio ?? null,
    skills: profile?.skills.map((s) => s.skill.label) ?? [],
    experience:
      profile?.workExperiences.map((e) => ({
        company: e.company,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
      })) ?? [],
    education: profile?.education ?? null,
    certifications: profile?.certifications ?? null,
  };

  const pdfBuffer = await renderToBuffer(<ResumeDocument data={data} />);

  // Private store, same as an uploaded résumé. The stored locator is only ever
  // read back through the authenticated route (app/api/v1/resumes/[id]/file).
  let locator: string;
  if (storeConfigured('private')) {
    const stored = await putStored(
      'private',
      `${resumePathPrefix(user.id)}generated.pdf`,
      pdfBuffer,
      'application/pdf',
    );
    locator = stored.url;
  } else if (process.env.NODE_ENV !== 'production') {
    // Local development with no Blob store only.
    locator = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  } else {
    throw new Error('File storage is not configured.');
  }

  const h = await headers();
  const ip = clientIp(h);
  const ua = h.get('user-agent') ?? null;

  const created = await withAudit(
    { actorId: user.id, ip, ua },
    { action: 'RESUME_GENERATED', entity: 'resume', after: (r) => ({ id: r.id }) },
    (tx) =>
      tx.resume.create({
        data: {
          userId: user.id,
          title: 'Generated resume',
          fileBlobUrl: locator,
          fileMime: 'application/pdf',
          fileSizeBytes: pdfBuffer.length,
          // Shaped like a ParsedResume (summary/skills/experience) so the
          // embedding builder can use it, and tagged so it is never mistaken
          // for model output.
          parsedJson: {
            ...data,
            fullName: data.name,
            summary: data.bio,
            _source: 'profile',
          } as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      }),
  );

  // Compute the embedding off the response path from the stored parsedJson so
  // /jobseeker/matches and JD match badges work immediately after generation.
  after(async () => {
    try {
      await runResumeParse({ resumeId: created.id });
    } catch (err) {
      logger.error({ err, resumeId: created.id }, 'resume-parse failed (post-generate)');
    }
  });

  return created;
}
