'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';

const ProfileSchema = z.object({
  headline: z.string().max(140).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  yearsExperience: z.coerce.number().int().min(0).max(70).nullable(),
  location: z.string().max(140).optional().or(z.literal('')),
  desiredSalaryMin: z.coerce.number().int().min(0).nullable(),
  desiredSalaryMax: z.coerce.number().int().min(0).nullable(),
  desiredWorkMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

export async function saveProfile(input: ProfileInput): Promise<void> {
  const user = await requireRole('JOB_SEEKER');
  const parsed = ProfileSchema.parse(input);

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'USER_PROFILE_UPDATED',
      entity: 'job_seeker_profile',
      entityId: user.id,
      after: () => parsed,
    },
    async (tx) =>
      tx.jobSeekerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          headline: parsed.headline || null,
          bio: parsed.bio || null,
          yearsExperience: parsed.yearsExperience,
          location: parsed.location || null,
          desiredSalaryMin: parsed.desiredSalaryMin,
          desiredSalaryMax: parsed.desiredSalaryMax,
          desiredWorkMode: parsed.desiredWorkMode,
          visibility: parsed.visibility,
        },
        update: {
          headline: parsed.headline || null,
          bio: parsed.bio || null,
          yearsExperience: parsed.yearsExperience,
          location: parsed.location || null,
          desiredSalaryMin: parsed.desiredSalaryMin,
          desiredSalaryMax: parsed.desiredSalaryMax,
          desiredWorkMode: parsed.desiredWorkMode,
          visibility: parsed.visibility,
        },
      }),
  );

  updateTag(tags.user(user.id));
}
