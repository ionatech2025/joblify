'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { logger } from '@/lib/observability/logger';
import { clientIp } from '@/lib/security/client-ip';
import { ProfileSchema, type ProfileInput } from './profile-schema';

// VI extras only persist on VIRTUAL_INTERN profiles; switching to EMPLOYABLE
// clears them so stale intern data never leaks into the directory.
function viFields(parsed: ProfileInput) {
  if (parsed.profileType !== 'VIRTUAL_INTERN') {
    return { careerInterest: null, availabilityHoursPerWeek: null, learningGoal: null };
  }
  return {
    careerInterest: parsed.careerInterest || null,
    availabilityHoursPerWeek: parsed.availabilityHoursPerWeek ?? null,
    learningGoal: parsed.learningGoal || null,
  };
}

export type { ProfileInput };

export async function saveProfile(input: ProfileInput): Promise<void> {
  const user = await requireRole('JOB_SEEKER');
  const parsed = ProfileSchema.parse(input);

  const h = await headers();
  const ip = clientIp(h);
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
          yearsExperience: parsed.yearsExperience ?? null,
          location: parsed.location || null,
          desiredSalaryMin: parsed.desiredSalaryMin ?? null,
          desiredSalaryMax: parsed.desiredSalaryMax ?? null,
          desiredWorkMode: parsed.desiredWorkMode ?? null,
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
          yearsExperience: parsed.yearsExperience ?? null,
          location: parsed.location || null,
          desiredSalaryMin: parsed.desiredSalaryMin ?? null,
          desiredSalaryMax: parsed.desiredSalaryMax ?? null,
          desiredWorkMode: parsed.desiredWorkMode ?? null,
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

      if (parsed.phone !== undefined && tx.user?.update) {
        await tx.user.update({
          where: { id: user.id },
          data: { phone: parsed.phone || null },
        });
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
