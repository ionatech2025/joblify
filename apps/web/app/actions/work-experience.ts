'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';

const WorkExperienceEntry = z.object({
  company: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  startDate: z.string().trim().max(40).optional().or(z.literal('')),
  endDate: z.string().trim().max(40).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
});

const SaveInput = z.object({ entries: z.array(WorkExperienceEntry).max(20) });

export type WorkExperienceInput = z.infer<typeof WorkExperienceEntry>;

// JOB_UC_05.0: the resume builder's source of structured experience data.
// Reset-and-recreate on every save (same idempotent shape as saveProfile's
// skill relinking) — the client always submits the full, current list.
export async function saveWorkExperiences(entries: WorkExperienceInput[]): Promise<void> {
  const user = await requireRole('JOB_SEEKER');
  const parsed = SaveInput.parse({ entries });

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'USER_PROFILE_UPDATED',
      entity: 'job_seeker_profile',
      entityId: user.id,
      after: () => ({ workExperienceCount: parsed.entries.length }),
    },
    async (tx) => {
      // A profile may not exist yet if this is called before the profile
      // form's first save.
      const profile = await tx.jobSeekerProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
        select: { id: true },
      });

      await tx.workExperience.deleteMany({ where: { jobSeekerProfileId: profile.id } });
      if (parsed.entries.length > 0) {
        await tx.workExperience.createMany({
          data: parsed.entries.map((e) => ({
            jobSeekerProfileId: profile.id,
            company: e.company,
            title: e.title,
            startDate: e.startDate || null,
            endDate: e.endDate || null,
            description: e.description || null,
          })),
        });
      }
    },
  );

  updateTag(tags.user(user.id));
}
