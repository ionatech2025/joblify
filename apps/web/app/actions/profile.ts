'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { logger } from '@/lib/observability/logger';

const ProfileSchema = z.object({
  profileType: z.enum(['EMPLOYABLE', 'VIRTUAL_INTERN']),
  headline: z.string().max(140).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  yearsExperience: z.coerce.number().int().min(0).max(70).nullable(),
  location: z.string().max(140).optional().or(z.literal('')),
  desiredSalaryMin: z.coerce.number().int().min(0).nullable(),
  desiredSalaryMax: z.coerce.number().int().min(0).nullable(),
  desiredWorkMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  // Virtual-intern extras (JOB_UC_05.0): stored only for VI profiles.
  careerInterest: z.string().max(140).optional().or(z.literal('')),
  availabilityHoursPerWeek: z.coerce.number().int().min(1).max(80).nullable(),
  learningGoal: z.string().max(500).optional().or(z.literal('')),
  // JOB_UC_05.0 profile-completeness: academic background, certifications, a
  // portfolio link, and skills picked from the canonical Skill catalog.
  education: z.string().max(1000).optional().or(z.literal('')),
  certifications: z.string().max(1000).optional().or(z.literal('')),
  portfolioUrl: z.string().trim().url().max(300).optional().or(z.literal('')),
  skillSlugs: z.array(z.string()).max(30).default([]),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

// VI extras only persist on VIRTUAL_INTERN profiles; switching to EMPLOYABLE
// clears them so stale intern data never leaks into the directory.
function viFields(parsed: ProfileInput) {
  if (parsed.profileType !== 'VIRTUAL_INTERN') {
    return { careerInterest: null, availabilityHoursPerWeek: null, learningGoal: null };
  }
  return {
    careerInterest: parsed.careerInterest || null,
    availabilityHoursPerWeek: parsed.availabilityHoursPerWeek,
    learningGoal: parsed.learningGoal || null,
  };
}

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
    async (tx) => {
      const profile = await tx.jobSeekerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          profileType: parsed.profileType,
          headline: parsed.headline || null,
          bio: parsed.bio || null,
          yearsExperience: parsed.yearsExperience,
          location: parsed.location || null,
          desiredSalaryMin: parsed.desiredSalaryMin,
          desiredSalaryMax: parsed.desiredSalaryMax,
          desiredWorkMode: parsed.desiredWorkMode,
          visibility: parsed.visibility,
          education: parsed.education || null,
          certifications: parsed.certifications || null,
          portfolioUrl: parsed.portfolioUrl || null,
          ...viFields(parsed),
        },
        update: {
          profileType: parsed.profileType,
          headline: parsed.headline || null,
          bio: parsed.bio || null,
          yearsExperience: parsed.yearsExperience,
          location: parsed.location || null,
          desiredSalaryMin: parsed.desiredSalaryMin,
          desiredSalaryMax: parsed.desiredSalaryMax,
          desiredWorkMode: parsed.desiredWorkMode,
          visibility: parsed.visibility,
          education: parsed.education || null,
          certifications: parsed.certifications || null,
          portfolioUrl: parsed.portfolioUrl || null,
          ...viFields(parsed),
        },
        select: { id: true },
      });

      // Reset + relink against the canonical catalog — idempotent, same
      // "clear then recreate" shape as the JD skill-extraction writer.
      // Unknown slugs (stale client state) are silently dropped.
      await tx.jobSeekerSkill.deleteMany({ where: { jobSeekerProfileId: profile.id } });
      if (parsed.skillSlugs.length > 0) {
        const skills = await tx.skill.findMany({ where: { slug: { in: parsed.skillSlugs } } });
        if (skills.length > 0) {
          await tx.jobSeekerSkill.createMany({
            data: skills.map((skill) => ({ jobSeekerProfileId: profile.id, skillId: skill.id })),
            skipDuplicates: true,
          });
        }
      }

      return profile;
    },
  );

  updateTag(tags.user(user.id));

  logger.info(
    { userId: user.id, profileType: parsed.profileType, skillCount: parsed.skillSlugs.length },
    'job seeker profile saved',
  );
}
