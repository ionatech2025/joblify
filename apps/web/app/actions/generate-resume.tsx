'use server';

import { headers } from 'next/headers';
import { renderToBuffer } from '@react-pdf/renderer';
import type { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { put, resumePathPrefix } from '@/lib/storage/blob';
import { ResumeDocument, type ResumeData } from '@/lib/resume/resume-document';

// JOB_UC_05.0: builds a resume PDF from the jobseeker's own profile data
// (headline, bio, skills, work experience, education, certifications)
// instead of requiring a pre-made file upload. The generated PDF is stored
// through the same Resume model as an uploaded file, so it shows up
// alongside uploads in "My resumes" with no separate UI needed.
export async function generateResume(): Promise<{ id: string; fileBlobUrl: string }> {
  const user = await requireRole('JOB_SEEKER');

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

  const blob = await put(`${resumePathPrefix(user.id)}generated-${Date.now()}.pdf`, pdfBuffer, {
    access: 'public',
    contentType: 'application/pdf',
  });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  return withAudit(
    { actorId: user.id, ip, ua },
    { action: 'RESUME_GENERATED', entity: 'resume', after: (r) => ({ id: r.id }) },
    (tx) =>
      tx.resume.create({
        data: {
          userId: user.id,
          title: 'Generated resume',
          fileBlobUrl: blob.url,
          fileMime: 'application/pdf',
          fileSizeBytes: pdfBuffer.length,
          parsedJson: data as unknown as Prisma.InputJsonValue,
        },
        select: { id: true, fileBlobUrl: true },
      }),
  );
}
