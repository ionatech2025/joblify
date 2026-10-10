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

export const SALARY_PERIODS = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'] as const;

export const SALARY_PERIOD_LABEL: Record<(typeof SALARY_PERIODS)[number], string> = {
  HOUR: 'per hour',
  DAY: 'per day',
  WEEK: 'per week',
  MONTH: 'per month',
  YEAR: 'per year',
};

export const PostJobFormSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(140),
    description: z.string().min(50, 'Add a detailed description (50+ chars)').max(10_000),
    requirements: z.string().max(5000).optional().or(z.literal('')),
    industry: z.enum(INDUSTRIES),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY']),
    experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'STAFF', 'EXECUTIVE']),
    workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
    location: z.string().max(140).optional().or(z.literal('')),
    // ISO 3166-1 alpha-2. Required by Google's JobPosting markup
    // (jobLocation.address.addressCountry); free-text `location` cannot give it.
    locationCountry: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, 'Use a 2-letter country code, e.g. UG')
      .optional()
      .or(z.literal('')),
    salaryMin: z.coerce.number().int().min(0).nullable(),
    salaryMax: z.coerce.number().int().min(0).nullable(),
    salaryCurrency: z.string().length(3).default('USD'),
    // What the range is per. Published as schema.org unitText, so a monthly
    // figure must not be sent as a yearly one.
    salaryPeriod: z.enum(SALARY_PERIODS).default('YEAR'),
    applicationDeadline: z.string().optional().or(z.literal('')),
    publish: z.boolean().default(true),
    createChatArea: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.salaryMin != null && v.salaryMax != null && v.salaryMin > v.salaryMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salaryMax'],
        message: 'Maximum salary must be at least the minimum',
      });
    }
  });

export type PostJobFormValues = z.infer<typeof PostJobFormSchema>;
