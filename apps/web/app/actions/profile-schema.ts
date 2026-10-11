import { z } from 'zod';
import { optionalPhone } from '@/lib/validation/phone';
import { MAX_PROFILE_SKILLS, PROFILE_SKILLS_LIMIT_MESSAGE } from '@/lib/profile-limits';

// Validation schemas for the profile Server Action.
//
// These live outside app/actions/profile.ts on purpose: a 'use server' file may
// export only async functions. Next 16.4 enforces that when the module is
// loaded in a production build ("A \"use server\" file can only export async
// functions, found object"), which made saveProfile throw for every jobseeker -
// the form reported "Couldn't save your profile" with no cause. Keep schemas,
// constants and helpers in plain modules like this one.

export const ProfileSchema = z.object({
  profileType: z.enum(['EMPLOYABLE', 'VIRTUAL_INTERN']),
  headline: z.string().max(140).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  yearsExperience: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).max(70).nullable().optional(),
  ),
  location: z.string().max(140).optional().or(z.literal('')),
  phone: optionalPhone,
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
  skillSlugs: z.array(z.string()).max(MAX_PROFILE_SKILLS, PROFILE_SKILLS_LIMIT_MESSAGE).default([]),
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
