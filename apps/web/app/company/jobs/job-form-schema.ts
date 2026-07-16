import { z } from 'zod';

// Job-form schema shared by the create/edit client forms AND the postJob/updateJob
// server actions. It must live in a plain (non-'use client') module: importing a
// value from a 'use client' module into a server action turns it into a
// client-reference proxy, so `PostJobFormSchema.parse(...)` throws
// "Input.parse is not a function" at runtime.

export const INDUSTRIES = [
  'TECHNOLOGY',
  'HOSPITALITY',
  'EDUCATION',
  'AGRICULTURE',
  'FINANCE',
  'MANUFACTURING',
  'CONSTRUCTION',
  'HEALTHCARE',
  'RETAIL',
  'TRANSPORTATION',
  'ENERGY',
  'MEDIA',
  'GOVERNMENT',
  'NONPROFIT',
  'OTHER',
] as const;

export const PostJobFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(140),
  description: z.string().min(50, 'Add a detailed description (50+ chars)').max(10_000),
  requirements: z.string().max(5000).optional().or(z.literal('')),
  industry: z.enum(INDUSTRIES),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY']),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'STAFF', 'EXECUTIVE']),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
  location: z.string().max(140).optional().or(z.literal('')),
  salaryMin: z.coerce.number().int().min(0).nullable(),
  salaryMax: z.coerce.number().int().min(0).nullable(),
  salaryCurrency: z.string().length(3).default('USD'),
  applicationDeadline: z.string().optional().or(z.literal('')),
  publish: z.boolean().default(true),
  createChatArea: z.boolean().default(false),
});

export type PostJobFormValues = z.infer<typeof PostJobFormSchema>;
