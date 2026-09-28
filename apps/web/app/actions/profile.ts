'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { logger } from '@/lib/observability/logger';

export const ProfileSchema = z.object({
  profileType: z.enum(['EMPLOYABLE', 'VIRTUAL_INTERN']),
  headline: z.string().max(140).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  yearsExperience: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).max(70).nullable().optional(),
  ),
  location: z.string().max(140).optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 numeric digits')
    .optional()
    .or(z.literal('')),
  desiredSalaryMin: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).nullable().optional(),
  ),
  desiredSalaryMax: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).nullable().optional(),
  ),
  desiredWorkMode: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable().optional(),
  ),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  // Virtual-intern extras (JOB_UC_05.0): stored only for VI profiles.
  careerInterest: z.string().max(140).optional().or(z.literal('')),
  availabilityHoursPerWeek: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(1).max(80).nullable().optional(),
  ),
  learningGoal: z.string().max(500).optional().or(z.literal('')),
  // JOB_UC_05.0 profile-completeness: academic background, certifications, a
  // portfolio link, and skills picked from the canonical Skill catalog.
  education: z.string().max(1000).optional().or(z.literal('')),
  certifications: z.string().max(1000).optional().or(z.literal('')),
  portfolioUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Invalid portfolio URL',
    }),
  skillSlugs: z.array(z.string()).max(30).default([]),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

// Strict validation schema for complete profile submission (JOB_UC_05.0)
export const StrictProfileSchema = ProfileSchema.superRefine((data, ctx) => {
  if (data.profileType === 'EMPLOYABLE') {
    if (!data.skillSlugs || data.skillSlugs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['skillSlugs'],
        message: 'An employable profile must have at least one skill selected.',
      });
    }
  }
  if (!data.bio || data.bio.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['bio'],
      message: 'Bio is required.',
    });
  }
  if (!data.education || data.education.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['education'],
      message: 'Education is required.',
    });
  }
});

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
